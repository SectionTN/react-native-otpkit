import { describe, expect, it } from 'vitest';
import { resolveSms } from '../resolveSms';

describe('resolveSms', () => {
  it('reads a mode alone', () => expect(resolveSms('retriever')).toEqual({ mode: 'retriever' }));
  it('keeps the sender of an options object', () =>
    expect(resolveSms({ mode: 'consent', sender: '5551234' })).toEqual({
      mode: 'consent',
      sender: '5551234',
    }));
  it('stays off without a mode', () => {
    expect(resolveSms(undefined)).toBeNull();
    expect(resolveSms(false)).toBeNull();
  });
});
