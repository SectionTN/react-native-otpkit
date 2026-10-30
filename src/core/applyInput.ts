import type { CodeType } from '../types';
import { filterText } from './chars';
import { normalizeDigits } from './digits';
import { extractCode } from './extract';

export interface InputRules {
  length: number;
  type: CodeType;
  transform?: (text: string) => string;
}

const identity = (text: string) => text;

function commonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

// previous is always sanitized; next is the raw TextInput text
export function applyInput(previous: string, next: string, rules: InputRules): string {
  if (next === previous) return previous;
  const start = commonPrefixLength(previous, next);
  const end = commonSuffixLength(previous.slice(start), next.slice(start));
  const inserted = next.slice(start, next.length - end);
  const removed = previous.length - start - end;
  const text = normalizeDigits((rules.transform ?? identity)(inserted));
  const code = extractCode(text, rules.length, rules.type);
  if (code) return code;
  const valid = filterText(text, rules.type);
  if (valid.length >= rules.length) return valid.slice(0, rules.length);
  // One typed or deleted character acts at the end, wherever a browser caret sits.
  if (removed === 0 && Array.from(inserted).length === 1) {
    return (previous + valid).slice(0, rules.length);
  }
  if (removed === 1 && inserted === '') return previous.slice(0, -1);
  return (previous.slice(0, start) + valid + previous.slice(previous.length - end)).slice(
    0,
    rules.length,
  );
}

export function sanitize(value: string, rules: InputRules): string {
  return filterText(normalizeDigits(value), rules.type).slice(0, rules.length);
}
