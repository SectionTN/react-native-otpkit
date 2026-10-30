import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { codeFromMessage } from '../core/extract';
import NativeOTPKit from '../specs/NativeOTPKit';
import type { SmsCodeState, SmsStatus, UseSmsCodeOptions } from '../types';
import { statusFromError } from './statusFromError';

interface Received {
  status: SmsStatus;
  code: string | null;
  message: string | null;
}

const supported = () => NativeOTPKit?.isAvailable() === true;

// The hook whose listen the native module holds; it keeps one session at a time.
let owner: object | null = null;

export function useSmsCode(options: UseSmsCodeOptions): SmsCodeState {
  const token = useRef<object>({});
  const { mode, sender, enabled = true } = options;
  const [state, setState] = useState<Received>(() => ({
    status: supported() ? 'idle' : 'unavailable',
    code: null,
    message: null,
  }));
  const attempt = useRef(0);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  const start = useCallback(() => {
    if (!NativeOTPKit || !supported()) return;
    attempt.current += 1;
    const id = attempt.current;
    const { mode, sender } = latest.current;
    owner = token.current;
    setState({ status: 'listening', code: null, message: null });
    const request =
      mode === 'retriever'
        ? NativeOTPKit.startRetriever()
        : NativeOTPKit.startConsent(sender ?? null);
    request.then(
      (message) => {
        if (id !== attempt.current) return;
        const { extract, length, type } = latest.current;
        let code: string | null = null;
        try {
          code = extract
            ? extract(message)
            : codeFromMessage(message, length ?? 6, type ?? 'numeric');
        } catch {}
        setState({ status: 'received', code, message });
      },
      (error: unknown) => {
        if (id !== attempt.current) return;
        setState((current) => ({ ...current, status: statusFromError(error) }));
      },
    );
  }, []);

  const stop = useCallback(() => {
    if (!NativeOTPKit) return;
    attempt.current += 1;
    if (owner === token.current) {
      owner = null;
      NativeOTPKit.stop();
    }
    setState((current) =>
      current.status === 'listening' ? { ...current, status: 'idle' } : current,
    );
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new mode or sender restarts listening
  useEffect(() => {
    if (!enabled) return;
    start();
    return stop;
  }, [enabled, mode, sender, start, stop]);

  return { ...state, start, stop };
}
