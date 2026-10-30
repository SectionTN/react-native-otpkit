import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { filterText } from '../core/chars';
import { normalizeDigits } from '../core/digits';
import type { SmsCodeState, SmsStatus, UseSmsCodeOptions } from '../types';

interface Received {
  status: SmsStatus;
  code: string | null;
  message: string | null;
}

const supported = () => typeof window !== 'undefined' && 'OTPCredential' in window;

// WebOTP. The browser reads the code from the SMS, so `mode` does not apply.
export function useSmsCode(options: UseSmsCodeOptions): SmsCodeState {
  const { enabled = true } = options;
  const [state, setState] = useState<Received>(() => ({
    status: supported() ? 'idle' : 'unavailable',
    code: null,
    message: null,
  }));
  const controller = useRef<AbortController | null>(null);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  const start = useCallback(() => {
    if (!supported()) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ status: 'listening', code: null, message: null });
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: current.signal } as CredentialRequestOptions)
      .then(
        (credential) => {
          if (controller.current !== current) return;
          const { length, type } = latest.current;
          const raw = (credential as { code?: string } | null)?.code ?? '';
          const code = filterText(normalizeDigits(raw), type ?? 'numeric').slice(0, length ?? 6);
          setState({ status: 'received', code, message: code });
        },
        () => {
          if (controller.current !== current) return;
          setState((state) => ({ ...state, status: current.signal.aborted ? 'idle' : 'denied' }));
        },
      );
  }, []);

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setState((state) => (state.status === 'listening' ? { ...state, status: 'idle' } : state));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    start();
    return stop;
  }, [enabled, start, stop]);

  return { ...state, start, stop };
}
