import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getAppHash, OTPField, SmsMode } from 'react-native-otpkit';
import { useTheme } from './theme';

export function RetrieverScreen() {
  const theme = useTheme();
  const [hash, setHash] = useState<string | null | undefined>(undefined);
  const [value, setValue] = useState('');

  useEffect(() => {
    let active = true;
    getAppHash().then(
      (appHash) => active && setHash(appHash),
      () => active && setHash(null),
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={48}
    >
      <Text style={[styles.title, { color: theme.text }]}>SMS Retriever</Text>
      <Text style={[styles.hint, { color: theme.secondaryText }]}>
        Android reads a message that ends with this app's hash, with no prompt.
      </Text>
      <Text testID="app-hash" selectable style={[styles.hash, { color: theme.text }]}>
        {hash === undefined ? '' : (hash ?? 'unavailable')}
      </Text>
      <OTPField
        testID="retriever-field"
        sms={SmsMode.Retriever}
        autoFocus={false}
        onChange={setValue}
      />
      <Text testID="retriever-value" style={[styles.hint, { color: theme.secondaryText }]}>
        {`retriever: ${value}`}
      </Text>
      <Text selectable style={[styles.command, { color: theme.secondaryText }]}>
        {`adb emu sms send 5551234 "Your code is 654321 ${hash ?? '<hash>'}"`}
      </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  hint: { fontSize: 15, lineHeight: 21 },
  hash: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  command: { fontSize: 13, fontFamily: 'monospace' },
});
