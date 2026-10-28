import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { OTPField, type OTPFieldRef, useResendTimer } from 'react-native-otpkit';
import { verifyCode } from './fakeServer';
import { type Theme, useTheme } from './theme';

export function SignInScreen() {
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={48}
    >
      {step === 'phone' ? (
        <>
          <Text style={[styles.title, { color: theme.text }]}>Sign in</Text>
          <Text style={[styles.hint, { color: theme.secondaryText }]}>
            We will text you a code. This demo checks it against a fake server.
          </Text>
          <TextInput
            testID="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={theme.secondaryText}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={[
              styles.phone,
              { color: theme.text, borderColor: theme.separator, backgroundColor: theme.card },
            ]}
          />
          <Button
            testID="send-code"
            title="Send code"
            theme={theme}
            onPress={() => setStep('code')}
          />
        </>
      ) : (
        <CodeStep phone={phone} theme={theme} onChangeNumber={() => setStep('phone')} />
      )}
    </KeyboardAwareScrollView>
  );
}

function CodeStep(props: { phone: string; theme: Theme; onChangeNumber: () => void }) {
  const { phone, theme, onChangeNumber } = props;
  const timer = useResendTimer(30);
  const field = useRef<OTPFieldRef>(null);
  const [message, setMessage] = useState('Enter the code');

  const onComplete = (code: string) => {
    setMessage('Checking');
    return verifyCode(code).then(
      () => setMessage('Signed in'),
      (error: unknown) => {
        setMessage('Incorrect code');
        throw error;
      },
    );
  };

  const minutes = Math.floor(timer.remaining / 60);
  const seconds = String(timer.remaining % 60).padStart(2, '0');

  return (
    <>
      <Text style={[styles.title, { color: theme.text }]}>Enter the code</Text>
      <Text style={[styles.hint, { color: theme.secondaryText }]}>
        {`Sent to ${phone || 'your phone'}. The code is 123456.`}
      </Text>
      <OTPField ref={field} testID="sign-in-field" sms="consent" onComplete={onComplete} />
      <Text testID="sign-in-status" style={[styles.status, { color: theme.secondaryText }]}>
        {message}
      </Text>
      <Button
        testID="resend"
        title={timer.canResend ? 'Resend code' : `Resend in ${minutes}:${seconds}`}
        theme={theme}
        disabled={!timer.canResend}
        onPress={() => {
          timer.restart();
          field.current?.listenForSms();
        }}
      />
      <Button testID="change-number" title="Change number" theme={theme} onPress={onChangeNumber} />
    </>
  );
}

function Button(props: {
  testID: string;
  title: string;
  theme: Theme;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { testID, title, theme, disabled, onPress } = props;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.card, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: theme.accent }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  hint: { fontSize: 15, lineHeight: 21 },
  phone: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 17 },
  status: { fontSize: 15, textAlign: 'center' },
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
