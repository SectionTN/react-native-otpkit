import { useEffect, useRef } from 'react';
import type { OTPStatus } from './types';

// Fills a code read from SMS, holding one that lands during a check until the check fails.
export function useSmsFill(
  code: string | null,
  status: OTPStatus,
  setValue: (text: string) => void,
): void {
  const pending = useRef<string | null>(null);
  const checking = useRef(false);
  const verifying = status === 'verifying';

  useEffect(() => {
    pending.current = code;
  }, [code]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new code or a settled check fills
  useEffect(() => {
    const ended = checking.current && !verifying;
    checking.current = verifying;
    if (verifying || pending.current === null) return;
    if (!ended || status === 'error') setValue(pending.current);
    pending.current = null;
  }, [code, verifying, status, setValue]);
}
