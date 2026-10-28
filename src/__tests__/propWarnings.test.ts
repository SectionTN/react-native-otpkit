import { describe, expect, it } from 'vitest';
import { propWarnings } from '../propWarnings';

describe('propWarnings', () => {
  it('accepts valid props', () =>
    expect(propWarnings({ length: 6, groups: [3, 3], value: '12' })).toEqual([]));
  it('flags a bad length', () => expect(propWarnings({ length: 0 })[0]).toContain('length 0'));
  it('flags groups that miss length', () =>
    expect(propWarnings({ length: 6, groups: [3, 2] })[0]).toContain('groups [3,2]'));
  it('flags a value longer than length', () =>
    expect(propWarnings({ length: 4, value: '12345' })[0]).toContain('value "12345"'));
  it('flags characters the type rejects', () =>
    expect(propWarnings({ type: 'numeric', defaultValue: '12a' })[0]).toContain(
      'defaultValue "12a"',
    ));
});
