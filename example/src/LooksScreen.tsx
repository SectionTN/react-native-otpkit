import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { type Cell, CodeType, OTPField, type OTPFieldProps, Variant } from 'react-native-otpkit';
import { type Theme, useTheme } from './theme';

interface Look {
  id: string;
  label: string;
  props?: Partial<OTPFieldProps>;
  rtl?: boolean;
}

export function LooksScreen() {
  const theme = useTheme();
  const [values, setValues] = useState<Record<string, string>>({ disabled: '12' });

  const looks: Look[] = [
    { id: 'box', label: 'Box', props: { autoFocus: true } },
    { id: 'underline', label: 'Underline', props: { variant: Variant.Underline } },
    { id: 'groups', label: 'Groups of three', props: { groups: [3, 3] } },
    { id: 'secure', label: 'Secure', props: { secure: true } },
    { id: 'placeholder', label: 'Placeholder', props: { placeholder: '•' } },
    { id: 'alphanumeric', label: 'Letters and digits', props: { type: CodeType.Alphanumeric } },
    { id: 'disabled', label: 'Disabled', props: { disabled: true, defaultValue: '12' } },
    { id: 'rtl', label: 'Inside a right-to-left view', rtl: true },
    {
      id: 'custom',
      label: 'Custom cells',
      props: { renderCell: (cell) => <DotCell cell={cell} theme={theme} /> },
    },
    {
      id: 'pop',
      label: 'Animated cells',
      props: { renderCell: (cell) => <PopCell cell={cell} theme={theme} /> },
    },
    {
      id: 'large',
      label: 'Larger cells',
      props: { length: 4, cellStyle: { width: 64, height: 64 } },
    },
  ];

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={48}
    >
      {looks.map(({ id, label, props, rtl }) => {
        const field = (
          <OTPField
            testID={id}
            autoFocus={false}
            {...props}
            onChange={(code) => setValues((current) => ({ ...current, [id]: code }))}
          />
        );
        return (
          <View key={id} style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            {rtl ? <View style={styles.rtl}>{field}</View> : field}
            <Text testID={`${id}-value`} style={[styles.value, { color: theme.secondaryText }]}>
              {`${id}: ${values[id] ?? ''}`}
            </Text>
          </View>
        );
      })}
    </KeyboardAwareScrollView>
  );
}

function DotCell({ cell, theme }: { cell: Cell; theme: Theme }) {
  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: cell.isActive || cell.isFilled ? theme.accent : theme.separator,
          backgroundColor: cell.isFilled ? theme.accent : 'transparent',
        },
      ]}
    >
      <Text style={[styles.dotText, { color: theme.onAccent }]}>{cell.char}</Text>
    </View>
  );
}

function PopCell({ cell, theme }: { cell: Cell; theme: Theme }) {
  const [scale] = useState(() => new Animated.Value(cell.isFilled ? 1 : 0.6));

  useEffect(() => {
    if (!cell.isFilled) {
      scale.setValue(0.6);
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 14,
      useNativeDriver: true,
    }).start();
  }, [cell.isFilled, scale]);

  return (
    <View
      style={[
        styles.pop,
        {
          borderColor: cell.isActive ? theme.accent : theme.separator,
          backgroundColor: theme.background,
        },
      ]}
    >
      <Animated.Text style={[styles.popText, { color: theme.text, transform: [{ scale }] }]}>
        {cell.char}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, padding: 16, gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 13, fontVariant: ['tabular-nums'] },
  rtl: { direction: 'rtl' },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 20, fontWeight: '600' },
  pop: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popText: { fontSize: 24, fontWeight: '700' },
});
