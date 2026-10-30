import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies text to the clipboard. After a successful copy, `copied` stays true for `resetAfterMs`
 * (restarted by every copy). A failed copy (permission denied, insecure context) leaves it false.
 */
export const useCopyToClipboard = (resetAfterMs: number) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Resolves to whether the text reached the clipboard. */
  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      clearTimeout(timer.current);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), resetAfterMs);
      return true;
    },
    [resetAfterMs],
  );

  return { copied, copy };
};
