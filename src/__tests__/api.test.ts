import { describe, expect, expectTypeOf, it } from 'vitest';
import { CodeType, OTPStatus, SmsMode, SmsStatus, Variant } from '../types';

describe('option constants', () => {
  it('hold the strings the props take', () => {
    expect(CodeType).toEqual({ Numeric: 'numeric', Alpha: 'alpha', Alphanumeric: 'alphanumeric' });
    expect(SmsMode).toEqual({ Consent: 'consent', Retriever: 'retriever' });
    expect(Variant).toEqual({ Box: 'box', Underline: 'underline' });
    expect(OTPStatus).toEqual({
      Idle: 'idle',
      Verifying: 'verifying',
      Error: 'error',
      Success: 'success',
    });
    expect(SmsStatus).toEqual({
      Idle: 'idle',
      Listening: 'listening',
      Received: 'received',
      Timeout: 'timeout',
      Denied: 'denied',
      Unavailable: 'unavailable',
    });
  });

  it('share their names with types that take the plain strings', () => {
    expectTypeOf<CodeType>().toEqualTypeOf<'numeric' | 'alpha' | 'alphanumeric' | RegExp>();
    expectTypeOf<SmsMode>().toEqualTypeOf<'consent' | 'retriever'>();
    expectTypeOf<Variant>().toEqualTypeOf<'box' | 'underline'>();
    expectTypeOf<OTPStatus>().toEqualTypeOf<'idle' | 'verifying' | 'error' | 'success'>();
    expectTypeOf<SmsStatus>().toEqualTypeOf<
      'idle' | 'listening' | 'received' | 'timeout' | 'denied' | 'unavailable'
    >();
  });
});
