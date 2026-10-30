import { describe, expect, it } from 'vitest';
import { normalizeDigits } from '../digits';

describe('normalizeDigits', () => {
  it.each(['٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹', '०१२३४५६७८९', '０１２３４５６７８９'])(
    'maps %s to ASCII digits',
    (input) => expect(normalizeDigits(input)).toBe('0123456789'),
  );
  it('leaves other text alone', () => expect(normalizeDigits('a1-b2')).toBe('a1-b2'));
});
