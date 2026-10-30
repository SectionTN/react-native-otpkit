import type { CodeType } from '../types';

const PATTERNS = {
  numeric: /^[0-9]$/,
  alpha: /^[A-Za-z]$/,
  alphanumeric: /^[A-Za-z0-9]$/,
} as const;

const stateless = new WeakMap<RegExp, RegExp>();

// A copy without g and y, so lastIndex never carries over between characters.
function statelessCopy(pattern: RegExp): RegExp {
  let copy = stateless.get(pattern);
  if (!copy) {
    copy = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
    stateless.set(pattern, copy);
  }
  return copy;
}

export function isAllowed(char: string, type: CodeType): boolean {
  // A code character is one UTF-16 unit, so slicing a value never splits one.
  if (char.length !== 1) return false;
  const pattern = typeof type === 'string' ? PATTERNS[type] : statelessCopy(type);
  return pattern.test(char);
}

export function filterText(text: string, type: CodeType): string {
  return Array.from(text)
    .filter((char) => isAllowed(char, type))
    .join('');
}
