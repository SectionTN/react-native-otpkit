import NativeOTPKit from '../specs/NativeOTPKit';

/** Opens the Android phone number hint and resolves to the picked number in E.164, or null. */
export function requestPhoneNumberHint(): Promise<string | null> {
  if (!NativeOTPKit?.isAvailable()) return Promise.resolve(null);
  return NativeOTPKit.requestPhoneNumberHint().catch((error: unknown) => {
    if (__DEV__) console.warn('react-native-otpkit: the phone number hint failed', error);
    return null;
  });
}
