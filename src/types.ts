import type { ComponentRef, RefObject } from 'react';
import type { TextInput, TextInputProps } from 'react-native';

/** `'numeric'`, `'alpha'` (ASCII letters), `'alphanumeric'`, or a RegExp tested on each character. */
export type CodeType = 'numeric' | 'alpha' | 'alphanumeric' | RegExp;

export type OTPStatus = 'idle' | 'verifying' | 'error' | 'success';

export interface Cell {
  index: number;
  /** What to draw: '', the character, or a dot when secure. */
  char: string;
  isFilled: boolean;
  /** Where the next character lands, only while focused. */
  isActive: boolean;
  status: OTPStatus;
}

export interface UseOTPFieldOptions {
  /** Number of cells. Default 6. */
  length?: number;
  /** Which characters the field accepts. Default `'numeric'`. */
  type?: CodeType;
  /** The code, for a controlled field. */
  value?: string;
  /** The starting code, for an uncontrolled field. */
  defaultValue?: string;
  /** Runs on every change, never debounced. */
  onChange?: (code: string) => void;
  /** Runs each time the code becomes complete. Return a promise to show verifying, then success or error. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a plain callback returns void, a verifying one a promise
  onComplete?: (code: string) => void | Promise<unknown>;
  /** Overrides the internal status. The field then only styles itself. */
  status?: OTPStatus;
  /** Clear the code after a rejected `onComplete`. Default true. */
  clearOnError?: boolean;
  /** Blur when `onComplete` returns without a promise. Default false. */
  blurOnComplete?: boolean;
  /** Runs on all incoming text (typed, pasted, autofilled, read from SMS) before filtering. */
  transform?: (text: string) => string;
  /** Draw a dot in filled cells. Default false. */
  secure?: boolean;
  /** Block focus and input. Default false. */
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Props to spread on the hidden `TextInput`. */
export interface OTPInputProps {
  ref: RefObject<ComponentRef<typeof TextInput> | null>;
  value: string;
  selection: { start: number; end: number };
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  editable: boolean;
  inputMode: 'numeric' | 'text';
  autoComplete: TextInputProps['autoComplete'];
  autoCapitalize: 'none' | 'characters';
  autoCorrect: false;
  spellCheck: false;
  caretHidden: boolean;
  cursorColor?: string;
  selectionHandleColor?: string;
}

export interface OTPFieldState {
  value: string;
  status: OTPStatus;
  isFocused: boolean;
  cells: Cell[];
  inputProps: OTPInputProps;
  focus(): void;
  blur(): void;
  clear(): void;
  setValue(text: string): void;
}
