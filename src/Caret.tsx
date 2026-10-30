import { useEffect, useState } from 'react';
import { Animated, Platform, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { metrics } from './theme';

const BLINK_MS = 500;
const useNativeDriver = Platform.OS !== 'web';

export function Caret(props: {
  color: string;
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { color, reduceMotion, style } = props;
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    opacity.setValue(1);
    if (reduceMotion) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, delay: BLINK_MS, duration: 0, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, delay: BLINK_MS, duration: 0, useNativeDriver }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [opacity, reduceMotion]);

  return <Animated.View style={[styles.caret, { backgroundColor: color, opacity }, style]} />;
}

const styles = StyleSheet.create({
  caret: { width: 2, height: metrics.height / 2, borderRadius: 1 },
});
