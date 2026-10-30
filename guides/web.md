# Use it on the web

`OTPField` runs on the web through react-native-web 0.21+, including Expo for web. The hidden input renders as an `<input>` with `autocomplete="one-time-code"`, and with `inputmode="numeric"` when `type` is `'numeric'`. Browsers that offer one-time codes, such as Safari with codes from Messages, fill it as they fill any code field.

## Read codes from SMS

On the web, `sms` reads the code through WebOTP, whichever mode you pass:

```tsx
<OTPField sms="consent" onComplete={verify} />
```

WebOTP needs three things:

- A page served over HTTPS
- A browser with WebOTP, such as Chrome on Android
- A message whose last line is `@` and your domain, then `#` and the code

The message for `example.com` looks like this:

```text
Your code is 123456

@example.com #123456
```

The browser asks the user to allow the code, then hands over only the code, never the message. So `message` and `code` from `useSmsCode` are the same, and `extract` and `sender` don't apply.

Browsers without WebOTP report `unavailable`.

## Native-only functions

`getAppHash()` resolves to `null` on the web.
