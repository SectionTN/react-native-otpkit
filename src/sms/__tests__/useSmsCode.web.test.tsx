// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSmsCode } from '../useSmsCode.web';

function stubWebOTP(get: (options: { signal: AbortSignal }) => Promise<unknown>) {
  vi.stubGlobal('OTPCredential', class {});
  const spy = vi.fn(get);
  Object.defineProperty(navigator, 'credentials', { value: { get: spy }, configurable: true });
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'credentials');
});

describe('useSmsCode on web', () => {
  it('reports unavailable without WebOTP', () => {
    const { result } = renderHook(() => useSmsCode({ mode: 'consent' }));
    expect(result.current.status).toBe('unavailable');
  });

  it('reads the code from navigator.credentials', async () => {
    const get = stubWebOTP(() => Promise.resolve({ type: 'otp', code: '123456' }));
    const { result } = renderHook(() => useSmsCode({ mode: 'consent' }));
    await act(async () => {});
    expect(result.current).toMatchObject({ status: 'received', code: '123456' });
    expect(get).toHaveBeenCalledWith({
      otp: { transport: ['sms'] },
      signal: expect.any(AbortSignal),
    });
  });

  it('aborts on unmount', () => {
    const get = stubWebOTP(() => new Promise(() => {}));
    const { unmount } = renderHook(() => useSmsCode({ mode: 'consent' }));
    unmount();
    expect(get.mock.calls[0]?.[0].signal.aborted).toBe(true);
  });

  it('goes idle when enabled turns false while listening', async () => {
    const get = stubWebOTP(() => new Promise(() => {}));
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) => useSmsCode({ mode: 'consent', enabled: props.enabled }),
      { initialProps: { enabled: true } },
    );
    expect(result.current.status).toBe('listening');
    rerender({ enabled: false });
    await act(async () => {});
    expect(get.mock.calls[0]?.[0].signal.aborted).toBe(true);
    expect(result.current.status).toBe('idle');
  });

  it('calls a rejection it did not cause a denial', async () => {
    stubWebOTP(() => Promise.reject(new DOMException('Denied', 'NotAllowedError')));
    const { result } = renderHook(() => useSmsCode({ mode: 'consent' }));
    await act(async () => {});
    expect(result.current.status).toBe('denied');
  });
});
