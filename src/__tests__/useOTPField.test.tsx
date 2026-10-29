// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CLEAR_DELAY_MS } from '../core/timing';
import { type UseOTPFieldOptions, useOTPField } from '../useOTPField';

function setup(options: UseOTPFieldOptions = {}) {
  const input = { focus: vi.fn(), blur: vi.fn() };
  const hook = renderHook((props: UseOTPFieldOptions) => useOTPField(props), {
    initialProps: options,
  });
  (hook.result.current.inputProps.ref as { current: unknown }).current = input;
  const type = (text: string) => act(() => hook.result.current.inputProps.onChangeText(text));
  return { ...hook, input, type };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const fail = () => Promise.reject(new Error('Incorrect code'));
const flush = () => act(async () => {});

afterEach(() => vi.useRealTimers());

describe('useOTPField', () => {
  it('types digits and reports each change', () => {
    const onChange = vi.fn();
    const { result, type } = setup({ onChange });
    type('1');
    type('12');
    expect(result.current.value).toBe('12');
    expect(onChange.mock.calls).toEqual([['1'], ['12']]);
  });

  it('starts from defaultValue', () => {
    expect(setup({ defaultValue: '12' }).result.current.value).toBe('12');
  });

  it('shows a sanitized controlled value without calling onChange', () => {
    const onChange = vi.fn();
    expect(setup({ value: '12a', onChange }).result.current.value).toBe('12');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onComplete once when the value becomes complete', () => {
    const onComplete = vi.fn();
    const { rerender, type } = setup({ onComplete });
    type('123456');
    rerender({ onComplete });
    expect(onComplete.mock.calls).toEqual([['123456']]);
  });

  it('calls onComplete again after an edit completes the value again', () => {
    const onComplete = vi.fn();
    const { type } = setup({ onComplete });
    type('123456');
    type('12345');
    type('123456');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('skips onComplete for the value on mount, then fires when a controlled value turns complete', () => {
    const onComplete = vi.fn();
    const { rerender } = setup({ value: '123456', onComplete });
    expect(onComplete).not.toHaveBeenCalled();
    rerender({ value: '12345', onComplete });
    rerender({ value: '123456', onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('verifies, ignores input meanwhile, then succeeds and blurs', async () => {
    const d = deferred();
    const { result, input, type } = setup({ onComplete: () => d.promise });
    type('123456');
    expect(result.current.status).toBe('verifying');
    type('12345');
    expect(result.current.value).toBe('123456');
    await act(async () => d.resolve());
    expect(result.current.status).toBe('success');
    expect(input.blur).toHaveBeenCalledTimes(1);
  });

  it('shows the error, then clears after ERROR_CLEAR_DELAY_MS', async () => {
    vi.useFakeTimers();
    const { result, input, type } = setup({ onComplete: fail });
    type('123456');
    await flush();
    expect(result.current.status).toBe('error');
    act(() => vi.advanceTimersByTime(ERROR_CLEAR_DELAY_MS - 1));
    expect(result.current.value).toBe('123456');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.value).toBe('');
    expect(result.current.status).toBe('error');
    expect(input.focus).toHaveBeenCalled();
    type('1');
    expect(result.current.status).toBe('idle');
  });

  it('keeps the value when clearOnError is false', async () => {
    vi.useFakeTimers();
    const { result, type } = setup({ onComplete: fail, clearOnError: false });
    type('123456');
    await flush();
    act(() => vi.advanceTimersByTime(ERROR_CLEAR_DELAY_MS));
    expect(result.current.value).toBe('123456');
  });

  it('errors again on the same wrong code', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn(fail);
    const { result, type } = setup({ onComplete });
    type('123456');
    await flush();
    act(() => vi.advanceTimersByTime(ERROR_CLEAR_DELAY_MS));
    type('123456');
    await flush();
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('error');
  });

  it('leaves clearing to the app when status is controlled', async () => {
    vi.useFakeTimers();
    const { result, type } = setup({ status: 'idle', onComplete: fail });
    type('123456');
    await flush();
    act(() => vi.advanceTimersByTime(ERROR_CLEAR_DELAY_MS));
    expect(result.current.value).toBe('123456');
    expect(result.current.status).toBe('idle');
  });

  it('follows a length change', () => {
    const onComplete = vi.fn();
    const { result, rerender, type } = setup({ length: 4, onComplete });
    type('1234');
    expect(onComplete).toHaveBeenLastCalledWith('1234');
    rerender({ length: 6, onComplete });
    expect(result.current.cells).toHaveLength(6);
    expect(result.current.value).toBe('1234');
    type('123456');
    expect(onComplete).toHaveBeenLastCalledWith('123456');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('follows a controlled reset after an error', async () => {
    const onChange = vi.fn();
    const props = { onComplete: fail, onChange };
    const { result, rerender, type } = setup({ value: '12345', ...props });
    rerender({ value: '123456', ...props });
    await flush();
    expect(result.current.status).toBe('error');
    rerender({ value: '', ...props });
    expect(result.current.value).toBe('');
    expect(result.current.status).toBe('error');
    type('1');
    expect(result.current.status).toBe('idle');
    expect(onChange).toHaveBeenLastCalledWith('1');
  });

  it('drops a late result after unmount', async () => {
    const d = deferred();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { input, type, unmount } = setup({ onComplete: () => d.promise });
    type('123456');
    unmount();
    await act(async () => d.resolve());
    expect(input.blur).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('cancels the error clear on unmount', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { type, unmount } = setup({ onComplete: fail, onChange });
    type('123456');
    await flush();
    unmount();
    act(() => vi.advanceTimersByTime(ERROR_CLEAR_DELAY_MS));
    expect(onChange).not.toHaveBeenCalledWith('');
  });

  it('drops the result and returns to idle when cleared while verifying', async () => {
    const d = deferred();
    const { result, input, type } = setup({ onComplete: () => d.promise });
    type('123456');
    act(() => result.current.clear());
    expect(result.current.value).toBe('');
    expect(result.current.status).toBe('idle');
    await act(async () => d.resolve());
    expect(result.current.status).toBe('idle');
    expect(input.blur).not.toHaveBeenCalled();
  });

  it('sets the keyboard and autofill props', () => {
    const { inputProps } = setup().result.current;
    expect(inputProps).toMatchObject({
      inputMode: 'numeric',
      autoComplete: 'one-time-code',
      autoCapitalize: 'none',
      autoCorrect: false,
      spellCheck: false,
      caretHidden: true,
      editable: true,
      selection: { start: 0, end: 0 },
    });
    expect(setup({ type: 'alpha' }).result.current.inputProps).toMatchObject({
      inputMode: 'text',
      autoCapitalize: 'characters',
    });
  });

  it('blocks input when disabled', () => {
    const { result, type } = setup({ disabled: true });
    expect(result.current.inputProps.editable).toBe(false);
    type('1');
    expect(result.current.value).toBe('');
  });

  it('marks the input disabled, which react-native-web needs to drop it from focus', () => {
    const { result, rerender } = setup({ disabled: true });
    expect(result.current.inputProps['aria-disabled']).toBe(true);
    rerender({ disabled: false });
    expect(result.current.inputProps['aria-disabled']).toBe(false);
  });

  it('runs setValue through the paste rules', () => {
    const onComplete = vi.fn();
    const { result } = setup({ onComplete });
    act(() => result.current.setValue('Your code is 123456'));
    expect(result.current.value).toBe('123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tracks focus', () => {
    const onFocus = vi.fn();
    const { result } = setup({ onFocus });
    act(() => result.current.inputProps.onFocus());
    expect(result.current.isFocused).toBe(true);
    expect(result.current.cells[0]?.isActive).toBe(true);
    expect(onFocus).toHaveBeenCalledTimes(1);
    act(() => result.current.inputProps.onBlur());
    expect(result.current.isFocused).toBe(false);
  });

  it('blurs after a plain onComplete when blurOnComplete is set', () => {
    const { input, type } = setup({ onComplete: vi.fn(), blurOnComplete: true });
    type('123456');
    expect(input.blur).toHaveBeenCalledTimes(1);
  });
});
