import { useCallback, useEffect, useState } from 'react';

export interface ResendTimer {
  /** Whole seconds left, 0 when resending is allowed. */
  remaining: number;
  canResend: boolean;
  /** Starts a new countdown from `seconds`. */
  restart(): void;
}

export function useResendTimer(
  seconds: number,
  options: { autoStart?: boolean } = {},
): ResendTimer {
  const autoStart = options.autoStart ?? true;
  const full = Math.max(0, Math.ceil(seconds));
  const [deadline, setDeadline] = useState<number | null>(() =>
    autoStart ? Date.now() + seconds * 1000 : null,
  );
  const [remaining, setRemaining] = useState(autoStart ? full : 0);

  useEffect(() => {
    if (deadline === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Reads the clock on each tick, so time spent in the background counts.
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, Math.ceil(left / 1000)));
      if (left > 0) timer = setTimeout(tick, left % 1000 || 1000);
    };
    tick();
    return () => clearTimeout(timer);
  }, [deadline]);

  const restart = useCallback(() => {
    setDeadline(Date.now() + seconds * 1000);
    setRemaining(full);
  }, [seconds, full]);

  return { remaining, canResend: remaining === 0, restart };
}
