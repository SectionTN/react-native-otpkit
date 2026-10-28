// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResendTimer } from '../useResendTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => vi.useRealTimers());

describe('useResendTimer', () => {
  it('counts down from seconds', () => {
    const { result } = renderHook(() => useResendTimer(30));
    expect(result.current.remaining).toBe(30);
    expect(result.current.canResend).toBe(false);
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.remaining).toBe(20);
  });

  it('counts time spent in the background', () => {
    const { result } = renderHook(() => useResendTimer(30));
    act(() => vi.advanceTimersByTime(10_000));
    vi.setSystemTime(35_000);
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it('restart starts a new countdown', () => {
    const { result } = renderHook(() => useResendTimer(30));
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.remaining).toBe(0);
    act(() => result.current.restart());
    expect(result.current.remaining).toBe(30);
  });

  it('allows resending at once when autoStart is false', () => {
    const { result } = renderHook(() => useResendTimer(30, { autoStart: false }));
    expect(result.current.remaining).toBe(0);
    expect(result.current.canResend).toBe(true);
    act(() => result.current.restart());
    expect(result.current.remaining).toBe(30);
  });

  it('stops ticking at zero', () => {
    const { result } = renderHook(() => useResendTimer(30));
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.remaining).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
