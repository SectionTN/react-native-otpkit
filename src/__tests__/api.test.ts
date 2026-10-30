import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type Cell,
  CodeType,
  type OTPFieldProps,
  OTPStatus,
  SmsMode,
  SmsStatus,
  Variant,
} from '../types';

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

describe('OTPFieldProps', () => {
  it('takes the SMS sender inside the sms prop', () => {
    const props: OTPFieldProps = { sms: { mode: SmsMode.Consent, sender: '5551234' } };
    // @ts-expect-error the sender moved into sms
    const old: OTPFieldProps = { smsSender: '5551234' };
    expect([props, old]).toHaveLength(2);
  });
});

describe('cell styles', () => {
  it('take a function of the cell', () => {
    const props: OTPFieldProps = {
      cellStyle: (cell) => cell.isActive && { borderColor: '#FF6F61' },
      textStyle: ({ isFilled }) => !isFilled && { color: '#A3A3A3' },
    };
    expect(props).toBeDefined();
    expectTypeOf<Cell['isDisabled']>().toEqualTypeOf<boolean>();
  });

  it('replace the per-state style props', () => {
    type Removed =
      | 'focusedCellStyle'
      | 'filledCellStyle'
      | 'errorCellStyle'
      | 'successCellStyle'
      | 'disabledCellStyle'
      | 'placeholderStyle';
    expectTypeOf<Extract<keyof OTPFieldProps, Removed>>().toBeNever();
  });
});
