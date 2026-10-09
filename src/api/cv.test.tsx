import { fc, test } from "@fast-check/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { failureReason, useCvGeneration } from "@/api/cv";
import { ApiError } from "@/api/fetcher";
import type { CvSelection } from "@/lib/cv-search";

const selection: CvSelection = { titleId: "title-a", conceptIds: [], skillIds: ["skill-a"] };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "content-type": "text/plain" } });

/** Stubs the api: `start` answers the POST, `status` answers each status request (numbered from 1). */
const stubApi = ({
  start = () => json({ task_id: "task-1" }, 202),
  status = () => json({ state: "done", digest: "digest-1" }),
}: {
  start?: () => Response;
  status?: (call: number) => Response;
}) => {
  let statusCalls = 0;
  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith("/cv/generate")) return Promise.resolve(start());
    statusCalls += 1;
    return Promise.resolve(status(statusCalls));
  });
  vi.stubGlobal("fetch", fetchMock);
  return { statusCalls: () => statusCalls, fetchMock };
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
  await waitFor(() => expect(result.current.status).not.toBe("processing"));
  return result.current;
};

describe("failureReason", () => {
  it("is rate-limited for a 429", () => {
    expect(failureReason(new ApiError(429, "Too Many Requests"))).toBe("rate-limited");
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

    expect(result.current).toEqual({ status: "idle" });
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
    expect(result.current).toEqual({ status: "processing" });
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
});
