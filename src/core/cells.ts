import type { Cell, OTPStatus } from '../types';

export const DEFAULT_LENGTH = 6;
export const SECURE_CHAR = '•';

export function resolveLength(length?: number): number {
  return length !== undefined && Number.isInteger(length) && length > 0 ? length : DEFAULT_LENGTH;
}

export function buildCells(
  value: string,
  state: { length: number; isFocused: boolean; status: OTPStatus; secure: boolean },
): Cell[] {
  const active = state.isFocused ? Math.min(value.length, state.length - 1) : -1;
  return Array.from({ length: state.length }, (_, index) => {
    const char = value[index] ?? '';
    return {
      index,
      char: char && state.secure ? SECURE_CHAR : char,
      isFilled: char !== '',
      isActive: index === active,
      status: state.status,
    };
  });
}
