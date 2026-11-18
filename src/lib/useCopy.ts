import { useCallback, useEffect, useRef, useState } from 'react';
import { writeToClipboard } from './clipboard';

/** Copy helper with a short-lived "Copied" state. */
export function useCopy(resetDelay = 1800) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timeout.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      const succeeded = await writeToClipboard(text);
      if (!succeeded) {
        return false;
      }

      setCopied(true);
      window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setCopied(false), resetDelay);
      return true;
    },
    [resetDelay],
  );

  return { copied, copy };
}
