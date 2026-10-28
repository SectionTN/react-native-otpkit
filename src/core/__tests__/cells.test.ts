import { describe, expect, it } from 'vitest';
import { buildCells, resolveLength } from '../cells';

const base = { length: 4, isFocused: true, status: 'idle', secure: false } as const;

describe('buildCells', () => {
  it('marks the next empty cell active while focused', () =>
    expect(buildCells('12', base).map((c) => [c.char, c.isFilled, c.isActive])).toEqual([
      ['1', true, false],
      ['2', true, false],
      ['', false, true],
      ['', false, false],
    ]));
  it('has no active cell without focus', () =>
    expect(buildCells('12', { ...base, isFocused: false }).some((c) => c.isActive)).toBe(false));
  it('keeps the last cell active when the value is full', () =>
    expect(buildCells('1234', base).map((c) => c.isActive)).toEqual([false, false, false, true]));
  it('draws a dot in secure cells', () =>
    expect(buildCells('12', { ...base, secure: true }).map((c) => c.char)).toEqual([
      '•',
      '•',
      '',
      '',
    ]));
  it('gives every cell the status', () =>
    expect(buildCells('1', { ...base, status: 'error' }).every((c) => c.status === 'error')).toBe(
      true,
    ));
});

describe('resolveLength', () => {
  it.each([0, -1, 2.5, Number.NaN, undefined])('resolveLength(%s) falls back to 6', (n) =>
    expect(resolveLength(n)).toBe(6),
  );
  it('resolveLength keeps a positive integer', () => expect(resolveLength(4)).toBe(4));
});
