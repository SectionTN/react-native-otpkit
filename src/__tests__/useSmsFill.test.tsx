// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OTPStatus } from '../types';
import { useSmsFill } from '../useSmsFill';

interface Props {
  code: string | null;
  status: OTPStatus;
}

function setup(initialProps: Props) {
  const setValue = vi.fn();
  const hook = renderHook((props: Props) => useSmsFill(props.code, props.status, setValue), {
    initialProps,
  });
  return { ...hook, setValue };
}

describe('useSmsFill', () => {
  it('fills a code that arrives while idle', () => {
    const { rerender, setValue } = setup({ code: null, status: 'idle' });
    rerender({ code: '123456', status: 'idle' });
    expect(setValue).toHaveBeenCalledWith('123456');
  });

  it('fills a code that arrived during a check once the check fails', () => {
    const { rerender, setValue } = setup({ code: null, status: 'verifying' });
    rerender({ code: '654321', status: 'verifying' });
    expect(setValue).not.toHaveBeenCalled();
    rerender({ code: '654321', status: 'error' });
    expect(setValue).toHaveBeenCalledWith('654321');
  });

  it('drops a code that arrived during a check once the check succeeds', () => {
    const { rerender, setValue } = setup({ code: null, status: 'verifying' });
    rerender({ code: '654321', status: 'verifying' });
    rerender({ code: '654321', status: 'success' });
    expect(setValue).not.toHaveBeenCalled();
  });

  it('fills the same code again after a new listen', () => {
    const { rerender, setValue } = setup({ code: '123456', status: 'idle' });
    rerender({ code: null, status: 'idle' });
    rerender({ code: '123456', status: 'idle' });
    expect(setValue).toHaveBeenCalledTimes(2);
  });
});
