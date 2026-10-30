import { describe, expect, it } from 'vitest';
import { codeFromMessage, extractCode } from '../extract';

describe('extractCode', () => {
  it('finds the code in a message', () =>
    expect(extractCode('Your code is 123456', 6, 'numeric')).toBe('123456'));
  it('skips runs of another length', () =>
    expect(extractCode('Call 555-0100, code 123456', 6, 'numeric')).toBe('123456'));
  it('reads Arabic-Indic digits', () =>
    expect(extractCode('رمزك ١٢٣٤٥٦', 6, 'numeric')).toBe('123456'));
  it('returns null without a run of exactly length', () => {
    expect(extractCode('123-456', 6, 'numeric')).toBeNull();
    expect(extractCode('123456123456', 6, 'numeric')).toBeNull();
  });
  it('needs a digit in an alphanumeric run', () => {
    expect(extractCode('Your code: AB12CD', 6, 'alphanumeric')).toBe('AB12CD');
    expect(extractCode('Your code', 4, 'alphanumeric')).toBeNull();
  });
});

describe('codeFromMessage', () => {
  it('joins the valid characters when they make one code', () =>
    expect(codeFromMessage('A1 B2 C3', 6, 'alphanumeric')).toBe('A1B2C3'));
  it('needs a digit when it joins an alphanumeric code', () =>
    expect(codeFromMessage('Thanks', 6, 'alphanumeric')).toBeNull());
});
