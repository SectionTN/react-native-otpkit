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
