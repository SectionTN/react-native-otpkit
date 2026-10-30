import { describe, expect, it } from 'vitest';
import { applyInput, sanitize } from '../applyInput';

const rules = { length: 6, type: 'numeric' } as const;

describe('applyInput', () => {
  it('appends a typed digit', () => expect(applyInput('12', '123', rules)).toBe('123'));
  it('deletes the last digit', () => expect(applyInput('123', '12', rules)).toBe('12'));
  it('ignores a seventh digit', () =>
    expect(applyInput('123456', '1234567', rules)).toBe('123456'));
  it('drops a character the type rejects', () => expect(applyInput('12', '12a', rules)).toBe('12'));
  it('replaces the value with a pasted code', () =>
    expect(applyInput('12', '12654321', rules)).toBe('654321'));
  it('reads the code out of a pasted message', () =>
    expect(applyInput('', 'Call 555-0100, code 123456', rules)).toBe('123456'));
  it('joins a formatted code', () => expect(applyInput('', '123-456', rules)).toBe('123456'));
  it('keeps one copy of a code inserted twice', () =>
    expect(applyInput('', '123456123456', rules)).toBe('123456'));
  it('appends a pasted part of a code', () => {
    expect(applyInput('123', '123456', rules)).toBe('123456');
    expect(applyInput('', '12-34', rules)).toBe('1234');
  });
  it('normalizes Arabic-Indic digits', () =>
    expect(applyInput('', '١٢٣٤٥٦', rules)).toBe('123456'));
  it('runs transform before filtering', () =>
    expect(
      applyInput('', 'abc', { length: 3, type: 'alpha', transform: (t) => t.toUpperCase() }),
    ).toBe('ABC'));
  it('appends a character typed before the end', () =>
    expect(applyInput('12345', '162345', rules)).toBe('123456'));
  it('deletes from the end when one character goes from the middle', () =>
    expect(applyInput('123456', '12456', rules)).toBe('12345'));
  it('keeps the rest when a selection in the middle is deleted', () =>
    expect(applyInput('123456', '1256', rules)).toBe('1256'));
});

describe('sanitize', () => {
  it('filters and cuts a controlled value', () =>
    expect(sanitize('12a3456789', rules)).toBe('123456'));
  it('normalizes digits', () => expect(sanitize('١٢', rules)).toBe('12'));
});
