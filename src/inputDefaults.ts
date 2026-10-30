import type { OTPInputProps } from './types';

export const AUTOFILL = 'one-time-code' as const;

export const CARET_PROPS: Pick<
  OTPInputProps,
  'caretHidden' | 'cursorColor' | 'selectionHandleColor'
> = { caretHidden: true };
