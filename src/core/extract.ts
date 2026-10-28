import type { CodeType } from '../types';
import { isAllowed } from './chars';
import { normalizeDigits } from './digits';

export function extractCode(text: string, length: number, type: CodeType): string | null {
  const runs: string[] = [];
  let run = '';
  for (const char of normalizeDigits(text)) {
    if (isAllowed(char, type)) {
      run += char;
    } else if (run) {
      runs.push(run);
      run = '';
    }
  }
  if (run) runs.push(run);
  const needsDigit = type === 'alphanumeric';
  return (
    runs.find(
      (candidate) => candidate.length === length && (!needsDigit || /[0-9]/.test(candidate)),
    ) ?? null
  );
}
