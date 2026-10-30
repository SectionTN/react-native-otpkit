import type { SmsStatus } from '../types';

const STATUSES: Record<string, SmsStatus> = {
  E_TIMEOUT: 'timeout',
  E_DENIED: 'denied',
  E_CANCELLED: 'idle',
  E_UNAVAILABLE: 'unavailable',
};

export function statusFromError(error: unknown): SmsStatus {
  const code = (error as { code?: unknown } | null)?.code;
  const status = typeof code === 'string' ? STATUSES[code] : undefined;
  if (status) return status;
  if (__DEV__) console.warn('react-native-otpkit: SMS listening failed', error);
  return 'unavailable';
}
