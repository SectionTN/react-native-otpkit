import NativeOTPKit from '../specs/NativeOTPKit';

/** The 11-character hash the SMS Retriever needs in the message. Null off Android. */
export function getAppHash(): Promise<string | null> {
  return NativeOTPKit ? NativeOTPKit.getAppHash() : Promise.resolve(null);
}
