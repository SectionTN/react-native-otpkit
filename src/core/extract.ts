import type { CodeType } from '../types';
import { filterText, isAllowed } from './chars';
import { normalizeDigits } from './digits';

// An alphanumeric code needs a digit, so a word of the right length is not taken for one.
function isCode(candidate: string, length: number, type: CodeType): boolean {
  return candidate.length === length && (type !== 'alphanumeric' || /[0-9]/.test(candidate));
}

// The code in a message: its exact-length run, or all its valid characters when they make one code.
export function codeFromMessage(text: string, length: number, type: CodeType): string | null {
  const code = extractCode(text, length, type);
  if (code) return code;
  const valid = filterText(normalizeDigits(text), type);
  return isCode(valid, length, type) ? valid : null;
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
  return runs.find((candidate) => isCode(candidate, length, type)) ?? null;
}
