# Fill the phone number

On Android, `requestPhoneNumberHint()` opens Google's phone number sheet with the numbers of the SIM cards in the device. It resolves to the number the user picks in E.164, such as `+15551234567`. It resolves to `null` when the user closes the sheet, on iOS, on the web and without Google Play services.

## Offer the numbers on the device

Call it the first time the empty phone field takes focus:

```tsx
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { requestPhoneNumberHint } from 'react-native-otpkit';

export function PhoneStep() {
  const [phone, setPhone] = useState('');
  const hinted = useRef(false);

  const onFocus = () => {
    if (hinted.current || phone) return;
    hinted.current = true;
    requestPhoneNumberHint().then((number) => number && setPhone(number));
  };

  return (
    <TextInput
      value={phone}
      onChangeText={setPhone}
      onFocus={onFocus}
      keyboardType="phone-pad"
      autoComplete="tel"
      placeholder="Phone number"
    />
  );
}
```

`autoComplete="tel"` lets iOS and browsers suggest the user's own number in the same field.

The hint needs native code, so in Expo it runs in a development build.
