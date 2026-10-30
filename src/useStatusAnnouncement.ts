import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import type { OTPStatus, StatusMessages } from './types';

const DEFAULT_MESSAGES = {
  verifying: 'Verifying code',
  error: 'Incorrect code',
  success: 'Code verified',
} as const;

// Announces on iOS; Android and web read the returned message from a live region instead.
export function useStatusAnnouncement(status: OTPStatus, messages?: StatusMessages): string {
  const message = status === 'idle' ? '' : (messages?.[status] ?? DEFAULT_MESSAGES[status]);

  useEffect(() => {
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return message;
}
