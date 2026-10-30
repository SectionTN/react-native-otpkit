import { useEffect, useState } from 'react';
import { Animated, Platform } from 'react-native';
import { SHAKE_MS } from './core/timing';
import type { OTPStatus } from './types';

const OFFSETS = [10, -10, 6, -6, 2, 0];
const useNativeDriver = Platform.OS !== 'web';

export function useShake(status: OTPStatus, reduceMotion: boolean): Animated.Value {
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (status !== 'error' || reduceMotion) return;
    const duration = SHAKE_MS / OFFSETS.length;
    const shake = Animated.sequence(
      OFFSETS.map((toValue) => Animated.timing(offset, { toValue, duration, useNativeDriver })),
    );
    shake.start();
    return () => {
      shake.stop();
      offset.setValue(0);
    };
  }, [status, reduceMotion, offset]);

  return offset;
}
