import { describe, expect, it, vi } from 'vitest';
import { statusFromError } from '../statusFromError';

const coded = (code: string) => Object.assign(new Error(code), { code });

describe('statusFromError', () => {
  it.each([
    ['E_TIMEOUT', 'timeout'],
    ['E_DENIED', 'denied'],
    ['E_CANCELLED', 'idle'],
    ['E_UNAVAILABLE', 'unavailable'],
    ['E_NATIVE', 'unavailable'],
  ])('maps %s to %s', (code, status) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(statusFromError(coded(code))).toBe(status);
    warn.mockRestore();
  });

  it('maps a plain Error to unavailable and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(statusFromError(new Error('boom'))).toBe('unavailable');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
