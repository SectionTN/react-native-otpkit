import { describe, expect, it } from 'vitest';
import { filterText } from '../chars';

describe('filterText', () => {
  it('keeps digits for numeric', () => expect(filterText('1a2-3 ', 'numeric')).toBe('123'));
  it('keeps ASCII letters for alpha', () => expect(filterText('aB1cé', 'alpha')).toBe('aBc'));
  it('keeps letters and digits for alphanumeric', () =>
    expect(filterText('a-B 1_c', 'alphanumeric')).toBe('aB1c'));
  it('tests each character against a RegExp', () =>
    expect(filterText('1a2f9z', /[0-9a-f]/)).toBe('1a2f9'));
  it('answers the same for every character of a global RegExp', () =>
    expect(filterText('1111', /\d/g)).toBe('1111'));
  it('answers the same for every character of a sticky RegExp', () =>
    expect(filterText('1111', /\d/y)).toBe('1111'));
  it('drops emoji without splitting them', () => expect(filterText('1😀2', 'numeric')).toBe('12'));
  it('drops an astral character that a custom RegExp matches', () =>
    expect(filterText('1😀2', /./u)).toBe('12'));
});
