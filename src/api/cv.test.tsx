import { fc, test } from "@fast-check/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  GenerationTimeoutError,
  MAX_PENDING_MS,
  failureReason,
  useCvGeneration,
} from "@/api/cv";
import { ApiError } from "@/api/fetcher";
import type { CvSelection } from "@/lib/cv-search";

const selection: CvSelection = { titleId: "title-a", conceptIds: [], skillIds: ["skill-a"] };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "content-type": "text/plain" } });

/** Stubs the api: `start` answers each POST, `status` each status request (both numbered from 1). */
const stubApi = ({
  start = () => json({ task_id: "task-1" }, 202),
  status = () => json({ state: "done", digest: "digest-1" }),
}: {
  start?: (call: number) => Response;
  status?: (call: number) => Response;
}) => {
  let statusCalls = 0;
  let startCalls = 0;
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith("/cv/generate")) {
      startCalls += 1;
      return Promise.resolve(start(startCalls));
    }
    statusCalls += 1;
    return Promise.resolve(status(statusCalls));
  });
  vi.stubGlobal("fetch", fetchMock);
  return { startCalls: () => startCalls, statusCalls: () => statusCalls, fetchMock };
};

const renderGeneration = (forSelection: CvSelection = selection) => {
  // No retry delay, so retried status requests don't slow the tests down.
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCvGeneration(forSelection), { wrapper });
};

const settled = async (result: { current: ReturnType<typeof useCvGeneration> }) => {
  await waitFor(() => expect(result.current.generation.status).not.toBe("processing"));
  return result.current.generation;
};

describe("failureReason", () => {
  it("is rate-limited for a 429", () => {
    expect(failureReason(new ApiError(429, "Too Many Requests"))).toBe("rate-limited");
  });

  it("is timed-out when the task stayed pending too long", () => {
    expect(failureReason(new GenerationTimeoutError())).toBe("timed-out");
  });

  it("is invalid-selection for a 422", () => {
    expect(failureReason(new ApiError(422, { detail: [] }))).toBe("invalid-selection");
  });

  test.prop([fc.integer({ min: 400, max: 599 }).filter((s) => s !== 429 && s !== 422)])(
    "is error for any other failed status",
    (status) => {
      expect(failureReason(new ApiError(status, undefined))).toBe("error");
    },
  );

  it("is error for anything that isn't an ApiError", () => {
    expect(failureReason(new TypeError("Failed to fetch"))).toBe("error");
    expect(failureReason(z.string().safeParse(1).error)).toBe("error");
    expect(failureReason(undefined)).toBe("error");
  });
});

describe("useCvGeneration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is idle without a valid selection, and sends nothing", () => {
    const { fetchMock } = stubApi({});
    const { result } = renderGeneration({ conceptIds: [], skillIds: [] });

    expect(result.current.generation).toEqual({ status: "idle" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is done with the digest once the task is done", async () => {
    stubApi({});
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "done", digest: "digest-1" });
  });

  it("is processing while the task is pending", async () => {
    const api = stubApi({ status: () => json({ state: "pending" }) });
    const { result } = renderGeneration();

    await waitFor(() => expect(api.statusCalls()).toBeGreaterThan(0));
    expect(result.current.generation).toEqual({ status: "processing" });
  });

  describe("fails with the reason when starting fails", () => {
    it.each([
      ["rate-limited", () => text("Too Many Requests", 429)],
      ["invalid-selection", () => json({ detail: [{ loc: ["body", "skill_ids", 0] }] }, 422)],
      ["error", () => text("Bad Gateway", 502)],
    ] as const)("%s", async (reason, start) => {
      stubApi({ start });
      const { result } = renderGeneration();

      expect(await settled(result)).toEqual({ status: "failed", reason });
    });
  });

  it("fails as rate-limited when a status request is rate-limited, without retrying it", async () => {
    const api = stubApi({ status: () => text("Too Many Requests", 429) });
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "failed", reason: "rate-limited" });
    expect(api.statusCalls()).toBe(1);
  });

  it("retries a status request that failed on the server", async () => {
    const api = stubApi({
      status: (call) => (call === 1 ? text("Bad Gateway", 502) : json({ state: "done", digest: "digest-1" })),
    });
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "done", digest: "digest-1" });
    expect(api.statusCalls()).toBe(2);
  });

  it("fails as error when status requests keep failing on the server", async () => {
    const api = stubApi({ status: () => text("Bad Gateway", 502) });
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "failed", reason: "error" });
    expect(api.statusCalls()).toBeGreaterThan(1);
  });

  it("fails as error when the task fails", async () => {
    stubApi({ status: () => json({ state: "failed" }) });
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "failed", reason: "error" });
  });

  it("fails as error when the task is done without a digest", async () => {
    stubApi({ status: () => json({ state: "done", digest: null }) });
    const { result } = renderGeneration();

    expect(await settled(result)).toEqual({ status: "failed", reason: "error" });
  });

  describe("retry", () => {
    it("starts again after starting failed", async () => {
      const api = stubApi({
        start: (call) => (call === 1 ? text("Bad Gateway", 502) : json({ task_id: "task-2" }, 202)),
      });
      const { result } = renderGeneration();
      expect(await settled(result)).toEqual({ status: "failed", reason: "error" });

      act(() => result.current.retry());

      // Right after retry the state can still be the old failure, so wait for the new outcome.
      await waitFor(() =>
        expect(result.current.generation).toEqual({ status: "done", digest: "digest-1" }),
      );
      expect(api.startCalls()).toBe(2);
    });

    it("starts a fresh task after the task failed", async () => {
      const api = stubApi({
        start: (call) => json({ task_id: `task-${call}` }, 202),
        status: (call) => (call === 1 ? json({ state: "failed" }) : json({ state: "done", digest: "digest-1" })),
      });
      const { result } = renderGeneration();
      expect(await settled(result)).toEqual({ status: "failed", reason: "error" });

      act(() => result.current.retry());

      // Right after retry the state can still be the old failure, so wait for the new outcome.
      await waitFor(() =>
        expect(result.current.generation).toEqual({ status: "done", digest: "digest-1" }),
      );
      expect(api.fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("task-2"),
        expect.anything(),
      );
    });

    it("asks for the status again when starting returns the same task", async () => {
      let serverDown = true;
      stubApi({
        status: () =>
          serverDown ? text("Bad Gateway", 502) : json({ state: "done", digest: "digest-1" }),
      });
      const { result } = renderGeneration();
      expect(await settled(result)).toEqual({ status: "failed", reason: "error" });

      serverDown = false;
      act(() => result.current.retry());

      // Right after retry the state can still be the old failure, so wait for the new outcome.
      await waitFor(() =>
        expect(result.current.generation).toEqual({ status: "done", digest: "digest-1" }),
      );
    });
  });

  describe("pending limit", () => {
    // Only Date is faked: polling runs on real timers, while the clock can jump past the limit.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const pastTheLimit = () => vi.setSystemTime(Date.now() + MAX_PENDING_MS + 1);

    it("keeps polling a pending task within the limit", async () => {
      stubApi({
        status: (call) => (call < 3 ? json({ state: "pending" }) : json({ state: "done", digest: "digest-1" })),
      });
      const { result } = renderGeneration();

      await waitFor(
        () => expect(result.current.generation).toEqual({ status: "done", digest: "digest-1" }),
        { timeout: 4000 },
      );
    });

    it("times out a task still pending past the limit, and stops polling", async () => {
      const api = stubApi({ status: () => json({ state: "pending" }) });
      const { result } = renderGeneration();
      await waitFor(() => expect(api.statusCalls()).toBeGreaterThan(0));

      pastTheLimit();

      await waitFor(
        () => expect(result.current.generation).toEqual({ status: "failed", reason: "timed-out" }),
        { timeout: 3000 },
      );
      const callsWhenTimedOut = api.statusCalls();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      expect(api.statusCalls()).toBe(callsWhenTimedOut);
    });

    it("starts over on retry after timing out", async () => {
      let stuck = true;
      const api = stubApi({
        start: (call) => json({ task_id: `task-${call}` }, 202),
        status: () => (stuck ? json({ state: "pending" }) : json({ state: "done", digest: "digest-1" })),
      });
      const { result } = renderGeneration();
      await waitFor(() => expect(api.statusCalls()).toBeGreaterThan(0));
      pastTheLimit();
      await waitFor(
        () => expect(result.current.generation).toEqual({ status: "failed", reason: "timed-out" }),
        { timeout: 3000 },
      );

      stuck = false;
      act(() => result.current.retry());

      await waitFor(() =>
        expect(result.current.generation).toEqual({ status: "done", digest: "digest-1" }),
      );
      expect(api.startCalls()).toBe(2);
    });
  });
});
