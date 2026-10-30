# Read codes from SMS

On Android, `OTPField` can fill itself from an incoming SMS through Google Play services. It doesn't add any permissions to your app. iOS has no API for this, and its keyboard already suggests codes from Messages for any `OTPField`.

SMS reading needs native code, so in Expo it runs in a development build. Expo Go and devices without Google Play services report `unavailable`.

## Choose a mode

| Mode | What the user sees | What the message needs |
| --- | --- | --- |
| `'consent'` | A sheet asking to share that one message, with Allow and Deny. | A code of 4 to 10 letters or digits, with at least one digit, from a number that isn't in the user's contacts. |
| `'retriever'` | Nothing. The code fills on its own. | Your app's 11-character hash, at most 140 bytes in total. |

Consent works with any message your server already sends. Retriever needs your server to add the hash.

## Ask the user to share the message

Pass `sms="consent"`:

```tsx
<OTPField sms="consent" onComplete={verify} />
```

To accept messages from one sender only, pass its phone number:

```tsx
<OTPField sms={{ mode: 'consent', sender: '+15551234567' }} onComplete={verify} />
```

If the message arrives while your app is in the background, the sheet opens when the user comes back to it.

## Read the message without asking

1. Get your app's hash on the device:

   ```tsx
   const hash = await getAppHash();
   ```

   The hash comes from the key that signs the app, so debug and release builds have different ones. With Play App Signing, Google signs the release build, so read the hash from a build installed from Google Play.

2. Add the hash to the message your server sends, for example on its last line:

   ```text
   Your code is 123456

   FA+9qCX9VSu
   ```

3. Pass `sms="retriever"`:

   ```tsx
   <OTPField sms="retriever" onComplete={verify} />
   ```

## Listen again after a resend

The field listens from mount until a message arrives, or for five minutes. Call `listenForSms()` when the user asks for a new code:

```tsx
const field = useRef<OTPFieldRef>(null);

function resend() {
  sendCode();
  field.current?.listenForSms();
}

return <OTPField ref={field} sms="consent" onComplete={verify} />;
```

A code that arrives while `onComplete` is still pending fills the field only if that check fails.

## Read the code without a field

`useSmsCode` listens on its own and returns the code it finds:

```tsx
const sms = useSmsCode({ mode: 'consent', length: 6 });

useEffect(() => {
  if (sms.code) verify(sms.code);
}, [sms.code]);
```

Pass `extract` to find the code yourself, for example in a message with two numbers:

```tsx
const sms = useSmsCode({
  mode: 'consent',
  extract: (message) => message.match(/code: (\d{6})/)?.[1] ?? null,
});
```

The [listening statuses](https://github.com/SectionTN/react-native-otpkit#listening-statuses) table lists what `status` can be.

## Test on an emulator

Send a message to a running Android emulator from your computer:

```sh
adb emu sms send 5551234 "Your code is 123456"
```

For Retriever, end the message with the hash that `getAppHash()` returns in that build.
