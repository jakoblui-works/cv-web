import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyToClipboard } from "./use-copy-to-clipboard";

const RESET_AFTER_MS = 1000;

const stubClipboard = (writeText: (text: string) => Promise<void>) => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  });
  return navigator.clipboard.writeText;
};

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("writes the text and reports copied until the delay has passed", async () => {
    const writeText = stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard(RESET_AFTER_MS));
    expect(result.current.copied).toBe(false);

    await act(async () => {
      await expect(result.current.copy("https://example.com/a")).resolves.toBe(true);
    });
    expect(writeText).toHaveBeenCalledWith("https://example.com/a");
    expect(result.current.copied).toBe(true);

    act(() => vi.advanceTimersByTime(RESET_AFTER_MS - 1));
    expect(result.current.copied).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.copied).toBe(false);
  });

  it("restarts the delay when copying again", async () => {
    stubClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard(RESET_AFTER_MS));

    await act(() => result.current.copy("a"));
    act(() => vi.advanceTimersByTime(RESET_AFTER_MS - 1));
    await act(() => result.current.copy("a"));
    act(() => vi.advanceTimersByTime(RESET_AFTER_MS - 1));
    expect(result.current.copied).toBe(true);
  });

  it("never reports copied when the write fails", async () => {
    stubClipboard(() => Promise.reject(new DOMException("Denied", "NotAllowedError")));
    const { result } = renderHook(() => useCopyToClipboard(RESET_AFTER_MS));

    await act(async () => {
      await expect(result.current.copy("a")).resolves.toBe(false);
    });
    expect(result.current.copied).toBe(false);
  });

  it("never reports copied without a clipboard (insecure context)", async () => {
    const { result } = renderHook(() => useCopyToClipboard(RESET_AFTER_MS));

    await act(async () => {
      await expect(result.current.copy("a")).resolves.toBe(false);
    });
    expect(result.current.copied).toBe(false);
  });
});
