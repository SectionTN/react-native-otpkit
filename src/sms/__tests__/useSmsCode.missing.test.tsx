// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAppHash } from '../getAppHash';
import { useSmsCode } from '../useSmsCode';

vi.mock('../../specs/NativeOTPKit', () => ({ default: null }));

describe('useSmsCode without the native module', () => {
  it('reports unavailable and ignores start()', () => {
    const { result } = renderHook(() => useSmsCode({ mode: 'consent' }));
    expect(result.current.status).toBe('unavailable');
    act(() => result.current.start());
    expect(result.current.status).toBe('unavailable');
  });

  it('resolves getAppHash() to null', async () => {
    await expect(getAppHash()).resolves.toBeNull();
  });
});
