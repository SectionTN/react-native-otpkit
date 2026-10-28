import type { OTPInputProps } from './types';

export const AUTOFILL = 'one-time-code' as const;

// Android drops the long-press Paste menu when the caret is hidden, so it stays on and transparent.
export const CARET_PROPS: Pick<
  OTPInputProps,
  'caretHidden' | 'cursorColor' | 'selectionHandleColor'
> = { caretHidden: false, cursorColor: 'transparent', selectionHandleColor: 'transparent' };
