import {
  type ComponentRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { TextInput } from 'react-native';
import { applyInput, type InputRules, sanitize } from './core/applyInput';
import { buildCells, resolveLength } from './core/cells';
import { ERROR_CLEAR_DELAY_MS } from './core/timing';
import { AUTOFILL, CARET_PROPS } from './inputDefaults';
import type { OTPFieldState, OTPStatus, UseOTPFieldOptions } from './types';

export type { OTPFieldState, UseOTPFieldOptions } from './types';

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';
}

export function useOTPField(options: UseOTPFieldOptions = {}): OTPFieldState {
  const length = resolveLength(options.length);
  const type = options.type ?? 'numeric';
  const disabled = options.disabled ?? false;
  const rules: InputRules = { length, type, transform: options.transform };

  const [internal, setInternal] = useState(() => sanitize(options.defaultValue ?? '', rules));
  const [internalStatus, setInternalStatus] = useState<OTPStatus>('idle');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const attempt = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The last complete code, null while incomplete, undefined before the first effect.
  const completed = useRef<string | null | undefined>(undefined);

  const value = sanitize(options.value ?? internal, rules);
  const status = options.status ?? internalStatus;

  const latest = useRef({ options, rules, value, status, internalStatus, disabled });
  useLayoutEffect(() => {
    latest.current = { options, rules, value, status, internalStatus, disabled };
  });

  // Drops pending promise results and the error clear.
  const cancelPending = useCallback(() => {
    attempt.current += 1;
    clearTimeout(clearTimer.current);
  }, []);

  const commit = useCallback(
    (next: string) => {
      const current = latest.current;
      if (next === current.value) return;
      cancelPending();
      if (current.internalStatus !== 'idle') setInternalStatus('idle');
      current.value = next;
      setInternal(next);
      current.options.onChange?.(next);
    },
    [cancelPending],
  );

  const onChangeText = useCallback(
    (text: string) => {
      const { value, status, disabled, rules } = latest.current;
      if (status === 'verifying' || disabled) return;
      commit(applyInput(value, text, rules));
    },
    [commit],
  );

  const setValue = useCallback(
    (text: string) => {
      const { status, disabled, rules } = latest.current;
      if (status === 'verifying' || disabled) return;
      commit(applyInput('', text, rules));
    },
    [commit],
  );

  const focus = useCallback(() => {
    if (!latest.current.disabled) inputRef.current?.focus();
  }, []);

  const blur = useCallback(() => inputRef.current?.blur(), []);

  const clear = useCallback(() => {
    const current = latest.current;
    cancelPending();
    if (current.internalStatus === 'verifying' || current.internalStatus === 'success') {
      setInternalStatus('idle');
    }
    if (current.value === '') return;
    current.value = '';
    setInternal('');
    current.options.onChange?.('');
  }, [cancelPending]);

  const onFocus = useCallback(() => {
    setIsFocused(true);
    latest.current.options.onFocus?.();
  }, []);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    latest.current.options.onBlur?.();
  }, []);

  useEffect(() => {
    const code = value.length === length ? value : null;
    const last = completed.current;
    completed.current = code;
    if (last === undefined || code === null || code === last) return;
    const { options } = latest.current;
    attempt.current += 1;
    const id = attempt.current;
    clearTimeout(clearTimer.current);
    const result = options.onComplete?.(value);
    // onComplete cleared or replaced the code itself, so this attempt is over.
    if (id !== attempt.current) return;
    if (isThenable(result)) {
      setInternalStatus('verifying');
      result.then(
        () => {
          if (id !== attempt.current) return;
          setInternalStatus('success');
          inputRef.current?.blur();
        },
        () => {
          if (id !== attempt.current) return;
          setInternalStatus('error');
          const { options } = latest.current;
          if (options.clearOnError === false || options.status !== undefined) return;
          clearTimer.current = setTimeout(() => {
            if (id !== attempt.current) return;
            clear();
            focus();
          }, ERROR_CLEAR_DELAY_MS);
        },
      );
    } else if (options.blurOnComplete) {
      inputRef.current?.blur();
    }
  }, [value, length, clear, focus]);

  useEffect(() => cancelPending, [cancelPending]);

  return {
    value,
    status,
    isFocused,
    cells: buildCells(value, { length, isFocused, status, secure: options.secure ?? false }),
    inputProps: {
      ref: inputRef,
      value,
      selection: { start: value.length, end: value.length },
      onChangeText,
      onFocus,
      onBlur,
      editable: !disabled,
      'aria-disabled': disabled,
      inputMode: type === 'numeric' ? 'numeric' : 'text',
      autoComplete: AUTOFILL,
      autoCapitalize: type === 'alpha' || type === 'alphanumeric' ? 'characters' : 'none',
      autoCorrect: false,
      spellCheck: false,
      ...CARET_PROPS,
    },
    focus,
    blur,
    clear,
    setValue,
  };
}
