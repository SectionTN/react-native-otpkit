import type { OTPFieldProps, SmsOptions } from '../types';

export function resolveSms(sms: OTPFieldProps['sms']): SmsOptions | null {
  if (!sms) return null;
  return typeof sms === 'string' ? { mode: sms } : sms;
}
