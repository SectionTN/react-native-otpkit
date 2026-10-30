import { useEffect } from 'react';
import { propWarnings } from './propWarnings';
import type { OTPFieldProps } from './types';

export function usePropWarnings(
  props: Pick<OTPFieldProps, 'length' | 'type' | 'groups' | 'value' | 'defaultValue'>,
): void {
  const warnings = __DEV__ ? propWarnings(props).join('\n') : '';
  useEffect(() => {
    if (!warnings) return;
    for (const warning of warnings.split('\n')) console.warn(`react-native-otpkit: ${warning}`);
  }, [warnings]);
}
