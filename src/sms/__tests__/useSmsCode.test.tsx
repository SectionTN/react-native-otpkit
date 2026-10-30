// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseSmsCodeOptions } from '../../types';
import { useSmsCode } from '../useSmsCode';

const native = vi.hoisted(() => ({
  isAvailable: vi.fn(() => true),
  startConsent: vi.fn(),
  startRetriever: vi.fn(),
  stop: vi.fn(),
  getAppHash: vi.fn(),
}));
vi.mock('../../specs/NativeOTPKit', () => ({ default: native }));

const rejectWith = (code: string) => Promise.reject(Object.assign(new Error(code), { code }));

function pending() {
  let resolve!: (message: string) => void;
  const promise = new Promise<string>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const setup = (options: UseSmsCodeOptions) =>
  renderHook((props: UseSmsCodeOptions) => useSmsCode(props), { initialProps: options });

beforeEach(() => {
  vi.clearAllMocks();
  native.isAvailable.mockReturnValue(true);
});

describe('useSmsCode', () => {
  it('listens on mount and reads the code', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const { result } = setup({ mode: 'consent' });
    expect(result.current.status).toBe('listening');
    await act(async () => sms.resolve('Your code is 123456'));
    expect(result.current).toMatchObject({
      status: 'received',
      code: '123456',
      message: 'Your code is 123456',
    });
  });

  it('passes the sender, or null', () => {
    native.startConsent.mockReturnValue(pending().promise);
    setup({ mode: 'consent', sender: '5551234' });
    setup({ mode: 'consent' });
    expect(native.startConsent.mock.calls).toEqual([['5551234'], [null]]);
  });

  it('uses the retriever in retriever mode', () => {
    native.startRetriever.mockReturnValue(pending().promise);
    setup({ mode: 'retriever' });
    expect(native.startRetriever).toHaveBeenCalledTimes(1);
    expect(native.startConsent).not.toHaveBeenCalled();
  });

  it('reports a timeout and a denial', async () => {
    native.startConsent.mockReturnValueOnce(rejectWith('E_TIMEOUT'));
    const timeout = setup({ mode: 'consent' });
    await act(async () => {});
    expect(timeout.result.current.status).toBe('timeout');
    native.startConsent.mockReturnValueOnce(rejectWith('E_DENIED'));
    const denial = setup({ mode: 'consent' });
    await act(async () => {});
    expect(denial.result.current.status).toBe('denied');
  });

  it('goes idle when another listener takes over', async () => {
    native.startConsent.mockReturnValue(rejectWith('E_CANCELLED'));
    const { result } = setup({ mode: 'consent' });
    await act(async () => {});
    expect(result.current.status).toBe('idle');
  });

  it('listens again on start()', async () => {
    native.startConsent.mockReturnValueOnce(rejectWith('E_TIMEOUT'));
    const { result } = setup({ mode: 'consent' });
    await act(async () => {});
    native.startConsent.mockReturnValueOnce(pending().promise);
    act(() => result.current.start());
    expect(native.startConsent).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('listening');
  });

  it('stop() stops the module and goes idle', () => {
    native.startConsent.mockReturnValue(pending().promise);
    const { result } = setup({ mode: 'consent' });
    act(() => result.current.stop());
    expect(native.stop).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('goes idle when enabled turns false while listening', () => {
    native.startConsent.mockReturnValue(pending().promise);
    const { result, rerender } = setup({ mode: 'consent' });
    expect(result.current.status).toBe('listening');
    rerender({ mode: 'consent', enabled: false });
    expect(native.stop).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('stops on unmount and drops a late result', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = setup({ mode: 'consent' });
    unmount();
    expect(native.stop).toHaveBeenCalled();
    await act(async () => sms.resolve('Your code is 123456'));
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does nothing while enabled is false', () => {
    const { result } = setup({ mode: 'consent', enabled: false });
    expect(native.startConsent).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('reads a code split by a space', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const { result } = setup({ mode: 'consent' });
    await act(async () => sms.resolve('Your code is 123 456'));
    expect(result.current.code).toBe('123456');
  });

  it('finds no code among the digits of several numbers', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const { result } = setup({ mode: 'consent' });
    await act(async () => sms.resolve('Call 555-0100; code 123-456'));
    expect(result.current.code).toBeNull();
  });

  it('reports no code when extract throws', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const extract = () => {
      throw new Error('bad format');
    };
    const { result } = setup({ mode: 'consent', extract });
    await act(async () => sms.resolve('Your code is 123456'));
    expect(result.current).toMatchObject({ status: 'received', code: null });
  });

  it('leaves the listen of a newer hook alone when an older one unmounts', () => {
    native.startConsent.mockReturnValue(pending().promise);
    const older = setup({ mode: 'consent' });
    const newer = setup({ mode: 'consent' });
    native.stop.mockClear();
    older.unmount();
    expect(native.stop).not.toHaveBeenCalled();
    newer.unmount();
    expect(native.stop).toHaveBeenCalledTimes(1);
  });

  it('uses a custom extract', async () => {
    const sms = pending();
    native.startConsent.mockReturnValue(sms.promise);
    const { result } = setup({ mode: 'consent', extract: (message) => message.slice(-4) });
    await act(async () => sms.resolve('Code ABCD'));
    expect(result.current.code).toBe('ABCD');
  });

  it('reports unavailable without Play services', () => {
    native.isAvailable.mockReturnValue(false);
    const { result } = setup({ mode: 'consent' });
    expect(result.current.status).toBe('unavailable');
    expect(native.startConsent).not.toHaveBeenCalled();
  });
});
