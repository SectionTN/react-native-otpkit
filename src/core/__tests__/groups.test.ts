import { describe, expect, it } from 'vitest';
import { separatorsAfter } from '../groups';

describe('separatorsAfter', () => {
  it('puts a separator after each group but the last', () => {
    expect([...separatorsAfter([3, 3], 6)]).toEqual([2]);
    expect([...separatorsAfter([2, 2, 2], 6)]).toEqual([1, 3]);
  });
  it('shows none when the groups miss length', () =>
    expect(separatorsAfter([3, 2], 6).size).toBe(0));
  it('shows none without groups', () => expect(separatorsAfter(undefined, 6).size).toBe(0));
});
