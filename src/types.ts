import type { ComponentRef, ReactNode, Ref, RefObject } from 'react';
import type {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';

type ValueOf<T> = T[keyof T];

/** The characters the field accepts. `Alpha` means ASCII letters. */
export const CodeType = {
  Numeric: 'numeric',
  Alpha: 'alpha',
  Alphanumeric: 'alphanumeric',
} as const;
/** A `CodeType` or its string, or a RegExp tested on each character. */
export type CodeType = ValueOf<typeof CodeType> | RegExp;

export const OTPStatus = {
  Idle: 'idle',
  Verifying: 'verifying',
  Error: 'error',
  Success: 'success',
} as const;
export type OTPStatus = ValueOf<typeof OTPStatus>;

/** The look of the built-in cells. */
export const Variant = { Box: 'box', Underline: 'underline' } as const;
export type Variant = ValueOf<typeof Variant>;

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
  /** On web this renders a disabled input, which takes no focus; `editable` alone renders a read-only one. */
  'aria-disabled': boolean;
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

export interface OTPFieldRef {
  focus(): void;
  blur(): void;
  /** Empties the field. */
  clear(): void;
  /** Runs `text` through the paste rules, as if the user pasted it. */
  setValue(text: string): void;
  /** Starts listening for the SMS again, for example after a resend. */
  listenForSms(): void;
}

/** What screen readers hear when the status changes. */
export interface StatusMessages {
  /** Default "Verifying code". */
  verifying?: string;
  /** Default "Incorrect code". */
  error?: string;
  /** Default "Code verified". */
  success?: string;
}

export interface OTPFieldProps
  extends Omit<ViewProps, 'children'>,
    Omit<UseOTPFieldOptions, 'onFocus' | 'onBlur'> {
  /** A blinking caret in the active cell. Default true. */
  caret?: boolean;
  caretStyle?: StyleProp<ViewStyle>;
  /** Read the code from an SMS on Android (WebOTP on web). Off by default. */
  sms?: false | SmsMode;
  /** Consent mode only: the phone number the message must come from. */
  smsSender?: string;
  statusMessages?: StatusMessages;
  /** One character shown in each empty cell. */
  placeholder?: string;
  /** Cell counts per group, for example `[3, 3]`. A separator shows between groups. */
  groups?: number[];
  /** Focus on mount. Default true. */
  autoFocus?: boolean;
  /** Default `'box'`. */
  variant?: Variant;
  cellStyle?: StyleProp<ViewStyle>;
  focusedCellStyle?: StyleProp<ViewStyle>;
  filledCellStyle?: StyleProp<ViewStyle>;
  errorCellStyle?: StyleProp<ViewStyle>;
  successCellStyle?: StyleProp<ViewStyle>;
  disabledCellStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  /** Replaces a cell's content. */
  renderCell?: (cell: Cell) => ReactNode;
  /** Replaces the separator drawn after cell `afterIndex`. */
  renderSeparator?: (afterIndex: number) => ReactNode;
  /** Passed to the hidden `TextInput`, after the field's own props. */
  textInputProps?: Omit<TextInputProps, 'value' | 'onChangeText'>;
  onFocus?: () => void;
  onBlur?: () => void;
  ref?: Ref<OTPFieldRef>;
}

/** `Consent` asks the user to share one message; `Retriever` needs the app hash in it. */
export const SmsMode = { Consent: 'consent', Retriever: 'retriever' } as const;
export type SmsMode = ValueOf<typeof SmsMode>;

export const SmsStatus = {
  Idle: 'idle',
  Listening: 'listening',
  Received: 'received',
  Timeout: 'timeout',
  Denied: 'denied',
  Unavailable: 'unavailable',
} as const;
export type SmsStatus = ValueOf<typeof SmsStatus>;

export interface UseSmsCodeOptions {
  /** `'consent'` asks the user to share one message; `'retriever'` needs the app hash in it. */
  mode: SmsMode;
  /** Code length for the default extraction. Default 6. */
  length?: number;
  /** Code characters for the default extraction. Default `'numeric'`. */
  type?: CodeType;
  /** Consent mode only: the phone number the message must come from. */
  sender?: string;
  /** Replaces the default extraction of the code from the message. Web skips it: WebOTP hands over the code. */
  extract?: (message: string) => string | null;
  /** Listen on mount. Default true. */
  enabled?: boolean;
}

export interface SmsCodeState {
  code: string | null;
  message: string | null;
  status: SmsStatus;
  /** Listens again, for example after a resend. */
  start(): void;
  stop(): void;
}
