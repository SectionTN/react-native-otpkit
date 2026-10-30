import type { CodeType } from '../types';
import { filterText, isAllowed } from './chars';
import { normalizeDigits } from './digits';

// The code in a message: its exact-length run, or all its valid characters when they make one code.
export function codeFromMessage(text: string, length: number, type: CodeType): string | null {
  const code = extractCode(text, length, type);
  if (code) return code;
  const valid = filterText(normalizeDigits(text), type);
  return valid.length === length ? valid : null;
}

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
