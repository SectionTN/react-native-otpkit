import { describe, expect, it } from 'vitest';
import { buildCells, cellContent, resolveLength, styleFor } from '../cells';

const activeEmpty = {
  index: 0,
  char: '',
  isFilled: false,
  isActive: true,
  isDisabled: false,
  status: 'idle',
} as const;

describe('cellContent', () => {
  it('shows the placeholder in the active cell without a caret', () =>
    expect(cellContent(activeEmpty, false, '•')).toBe('placeholder'));
  it('draws the caret instead of the placeholder in the active cell', () =>
    expect(cellContent(activeEmpty, true, '•')).toBe('caret'));
});

const base = {
  length: 4,
  isFocused: true,
  status: 'idle',
  secure: false,
  disabled: false,
} as const;

describe('buildCells', () => {
  it('marks every cell disabled while the field is', () =>
    expect(buildCells('12', { ...base, disabled: true }).map((c) => c.isDisabled)).toEqual([
      true,
      true,
      true,
      true,
    ]));
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

describe('styleFor', () => {
  it('passes a plain style through', () =>
    expect(styleFor({ width: 64 }, activeEmpty)).toEqual({ width: 64 }));
  it('calls a style function with the cell', () =>
    expect(styleFor((cell) => cell.isActive && { borderColor: '#FF6F61' }, activeEmpty)).toEqual({
      borderColor: '#FF6F61',
    }));
});
