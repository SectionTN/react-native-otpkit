import { StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useOTPField } from 'react-native-otpkit';
import { useTheme } from './theme';

export function HeadlessScreen() {
  const theme = useTheme();
  const field = useOTPField({ length: 4 });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={48}
    >
      <Text style={[styles.title, { color: theme.text }]}>Headless</Text>
      <Text style={[styles.hint, { color: theme.secondaryText }]}>
        useOTPField drives your own input and cells. This screen draws big digits on underlines.
      </Text>
      <View style={styles.field}>
        <View
          style={styles.row}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {field.cells.map((cell) => (
            <View
              key={cell.index}
              testID={`headless-cell-${cell.index}`}
              style={[styles.cell, { borderColor: cell.isActive ? theme.accent : theme.separator }]}
            >
              <Text style={[styles.digit, { color: theme.text }]}>{cell.char}</Text>
            </View>
          ))}
        </View>
        <TextInput
          {...field.inputProps}
          testID="headless-input"
          accessibilityLabel="Verification code"
          style={[StyleSheet.absoluteFill, styles.input]}
        />
      </View>
      <Text testID="headless-value" style={[styles.hint, { color: theme.secondaryText }]}>
        {`headless: ${field.value}`}
      </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  hint: { fontSize: 15, lineHeight: 21 },
  field: { height: 80 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16, pointerEvents: 'none' },
  cell: {
    width: 56,
    height: 80,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 44, fontWeight: '700', fontVariant: ['tabular-nums'] },
  // UIKit skips hit-testing below 0.01 alpha, so the input stays just above it.
  input: { opacity: 0.011, color: 'transparent' },
});
