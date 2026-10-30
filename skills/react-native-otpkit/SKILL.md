---
name: react-native-otpkit
description: Adds one-time code fields to React Native and Expo apps with react-native-otpkit, covering install, OTPField props, the verifying flow, paste and autofill, Android SMS reading with User Consent or the SMS Retriever, the resend timer and the headless useOTPField hook. Use when building a verification code, OTP, 2FA or SMS code screen in a React Native app, or when code uses OTPField, OTPFieldRef, useOTPField, useSmsCode, useResendTimer or getAppHash.
license: MIT
compatibility: React Native 0.86+ (Expo SDK 57+), iOS 15.1+, Android 7+ (API 24), web through react-native-web 0.21+. The field runs in Expo Go, and SMS reading needs a development build.
metadata:
  repository: https://github.com/SectionTN/react-native-otpkit
---

# react-native-otpkit

- **IS:** installing react-native-otpkit and building screens where the user enters a code, around `OTPField`: the verifying flow through `onComplete`, paste and autofill, Android SMS reading, the resend timer, custom cells and the headless `useOTPField`.
- **IS NOT:** sending or checking codes, which stays on the server. It is also not one `TextInput` per cell. One hidden `TextInput` takes all input, so per-cell refs, `onKeyPress` backspace handling and focus hopping do not apply.

The installed package ships its API contract at `node_modules/react-native-otpkit/src/types.ts`. Read it before using a prop or option this file does not name. It is the source of truth over anything here.

## Install

```sh
npm install react-native-otpkit
```

- Use the project's package manager. The library has no runtime dependencies and no iOS native code, so iOS doesn't need a `pod install` for it.
- Android autolinks the `OTPKit` TurboModule and `play-services-auth-api-phone`. Rebuild the Android app after installing (`npx expo run:android`, or `npx react-native run-android`), since a Metro reload does not link it. Until then, SMS reports `'unavailable'` and the field still works.
- SMS reading doesn't need a permission, so nothing goes in `AndroidManifest.xml`.
- Expo Go runs the field, but SMS reading needs a development build.

Installing the package and rebuilding are local and safe to run without asking. The work is done when the field fills from a typed and a pasted code on a device, not when the TypeScript compiles.

## Minimal screen

```tsx
import { useRef } from 'react';
import { Button, View } from 'react-native';
import { OTPField, type OTPFieldRef, SmsMode, useResendTimer } from 'react-native-otpkit';

export function CodeStep(props: { verify: (code: string) => Promise<void>; resend: () => void }) {
  const field = useRef<OTPFieldRef>(null);
  const timer = useResendTimer(30);

  return (
    <View style={{ gap: 16, padding: 24 }}>
      <OTPField ref={field} sms={SmsMode.Consent} onComplete={props.verify} />
      <Button
        title={timer.canResend ? 'Resend code' : `Resend in ${timer.remaining}s`}
        disabled={!timer.canResend}
        onPress={() => {
          props.resend();
          timer.restart();
          field.current?.listenForSms();
        }}
      />
    </View>
  );
}
```

`verify` calls the server and rejects when the code is wrong. `resend` asks the server for a new SMS.

## How the API behaves

- **Constants or strings.** `CodeType`, `SmsMode`, `Variant`, `OTPStatus` and `SmsStatus` are objects of constants, each value its key in lowercase, so `SmsMode.Consent` and `'consent'` are interchangeable in props and comparisons. Each name is also the type.
- **Controlled or uncontrolled.** Pass `value` and `onChange` for a controlled field, or `defaultValue` or nothing for an uncontrolled one. `onChange` fires on every change and is never debounced. Either way the value is sanitized: characters `type` rejects are dropped, and the code is cut to `length` (default 6). The ref has no getter, so read the code from `onChange` or `onComplete`.
- **`onComplete` promises drive verifying.** `onComplete` runs each time a new complete code appears, from typing, paste, autofill, SMS, `setValue` or a controlled `value`, including one that replaces a complete code. It does not run for a code that is already complete on mount. Return the promise of the server call. While it is pending, the status is `'verifying'` and input is ignored. A resolve shows `'success'`, blurs and keeps the code. A reject shows `'error'`, shakes the cells and clears them after 600 ms with the caret back in the first cell, unless `clearOnError={false}`. Reject for a wrong code (an `async` function can throw), and the resolved value is ignored. A plain return leaves the status `'idle'`, and `blurOnComplete` then blurs.
- **`status` takes over.** A `status` prop overrides the internal status. The field then only styles itself and never clears on its own. Use it when the app keeps the verification state elsewhere, such as in a store or a form library.
- **Paste rules.** An insertion of more than one character (paste, autofill, a keyboard suggestion or `setValue`) first looks for a run of exactly `length` valid characters, so `Your code is 123456` and `123-456` both fill `123456`. One keystroke appends or deletes at the end. `transform(text)` runs on all incoming text before filtering. Arabic-Indic, Persian, Devanagari and full-width digits become ASCII.
- **`type`.** `'numeric'` (default) is the only type that opens a number keyboard. `'alpha'` means ASCII letters. A `RegExp` is tested on one character at a time, so write `/[0-9A-F]/`, never `/^[0-9A-F]{6}$/`. With `'alphanumeric'`, the code found in an SMS must contain a digit.
- **Focus.** The hidden input covers the cell row, so tapping any cell focuses the field. It doesn't need a `Pressable` around it.
- **`sms` is opt-in.** It defaults to `false`. Set it only on the screen that waits for a texted code. A field for an email or authenticator code leaves it off, or Android can offer to share an unrelated SMS. Listening starts on mount and ends when a message arrives, after five minutes, on a denial or on unmount. After a resend, call `ref.current?.listenForSms()`. It does nothing while `sms` is off or the field is `disabled`.
- **Consent or retriever.** `'consent'` uses the SMS User Consent API. The message doesn't need a special format: Android shows a sheet asking to share one message that contains a 4 to 10 character alphanumeric code with at least one digit, and `smsSender` limits it to one phone number. `'retriever'` uses the SMS Retriever API. It reads the message with no tap, but the server must put the app's 11-character hash in a message of at most 140 bytes. Pick consent unless the server can add the hash. Either way the field fills only with the code in the message: a run of exactly `length` characters, or all its `type` characters when they make exactly one code. A code that lands during a check waits until the check fails.
- **The app hash differs per signing key.** `getAppHash()` returns the hash of the running build, so debug, release and Play App Signing builds each have their own. Read it from a build signed with the key users get (with Play App Signing, a build installed from Google Play) and give that value to the server. It resolves to `null` on iOS and the web.
- **SMS reading is unavailable in Expo Go**, and also on iOS (no API exists, autofill covers it), in browsers without WebOTP and on Android devices without Google Play services. The field keeps working there, and `useSmsCode().status` is `'unavailable'`.
- **Autofill works without setup.** The hidden input sets `autoComplete="one-time-code"`, so iOS offers the code from Messages above the keyboard and Android autofill gets the `sms-otp` hint.
- **`useSmsCode` without a field.** `useSmsCode({ mode, length, type, sender, extract, enabled })` returns `{ code, message, status, start, stop }`. `status` is `'idle'`, `'listening'`, `'received'`, `'timeout'`, `'denied'` or `'unavailable'`. `extract(message)` replaces the default code search (not on the web, where WebOTP hands over the code), and `enabled: false` waits for `start()`.
- **`useResendTimer(seconds, { autoStart })`** returns `{ remaining, canResend, restart }`. It counts against the clock, so time in the background counts, and it works with any button.

## Gotchas

- **One SMS listen at a time.** A second `OTPField` with `sms`, or a `useSmsCode`, cancels the first listen. Keep one listener per screen.
- **A custom hidden input needs an opacity of 0.011.** With `useOTPField`, lay the `TextInput` over the cells with `StyleSheet.absoluteFill`, `opacity: 0.011` and `color: 'transparent'`. iOS skips hit-testing below an opacity of 0.01, so `opacity: 0` makes the field untappable. Put `pointerEvents: 'none'` on the cell row, hide the cells from screen readers and label the input.
- **Size built-in cells with `cellStyle`.** Its `width`, `height` and min and max sizes resize the cells, which are 52 wide and 56 tall by default, 8 apart, and shrink to fit a narrow row.
- **Style props only apply to the built-in cells.** With `renderCell`, `variant`, the cell styles, `textStyle`, `placeholder` and `caretStyle` are ignored. Draw focus, error and success from `cell.isActive` and `cell.status`. `cell.char` is a dot when `secure` is on.
- **`textInputProps` cannot replace** `value`, `onChangeText`, the ref, `testID` or `accessibilityLabel`. Its `onFocus` and `onBlur` run next to the field's. Pass `testID` and `accessibilityLabel` on `OTPField`, and the input gets `<testID>-input` and each cell `<testID>-cell-<index>`.
- **`secure` masks the cells, not the input.** The hidden input is not a password field, so autofill keeps working, and Android accessibility services can still read the code.
- **The keyboard can cover the field.** `OTPField` does not move itself. Wrap the screen in `KeyboardAvoidingView`, or in `KeyboardAwareScrollView` from react-native-keyboard-controller as the example app does.
- **`autoFocus` defaults to `true`**, with a 300 ms wait on Android so the keyboard opens after a screen transition. Pass `autoFocus={false}` where the keyboard must stay down.
- **Emulator testing.** `adb emu sms send 5551234 "Your code is 123456"` brings up the consent sheet. For the retriever, add the hash from `getAppHash()` to the message.

## Custom cells

`useOTPField` takes the field options (`length` to `onBlur` in `types.ts`) and returns `{ value, status, isFocused, cells, inputProps, focus, blur, clear, setValue }`:

```tsx
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOTPField } from 'react-native-otpkit';

export function BigDigits(props: { onComplete: (code: string) => Promise<void> }) {
  const field = useOTPField({ length: 4, onComplete: props.onComplete });

  return (
    <View>
      <View
        style={styles.row}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {field.cells.map((cell) => (
          <View
            key={cell.index}
            style={[
              styles.cell,
              cell.isActive && styles.active,
              cell.status === 'error' && styles.error,
            ]}
          >
            <Text style={styles.digit}>{cell.char}</Text>
          </View>
        ))}
      </View>
      <TextInput
        {...field.inputProps}
        accessibilityLabel="Verification code"
        style={[StyleSheet.absoluteFill, styles.input]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, pointerEvents: 'none' },
  cell: {
    width: 56,
    height: 72,
    borderBottomWidth: 3,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: '#2563EB' },
  error: { borderColor: '#DC2626' },
  digit: { fontSize: 40, fontWeight: '700' },
  input: { opacity: 0.011, color: 'transparent' },
});
```
