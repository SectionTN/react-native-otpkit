import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPhoneNumberHint } from '../requestPhoneNumberHint';
import { requestPhoneNumberHint as requestOnWeb } from '../requestPhoneNumberHint.web';

const native = vi.hoisted(() => ({
  isAvailable: vi.fn(() => true),
  requestPhoneNumberHint: vi.fn(),
}));
vi.mock('../../specs/NativeOTPKit', () => ({ default: native }));

beforeEach(() => {
  vi.clearAllMocks();
  native.isAvailable.mockReturnValue(true);
});

describe('requestPhoneNumberHint', () => {
  it('resolves to the number the user picks', async () => {
    native.requestPhoneNumberHint.mockResolvedValue('+15555215554');
    await expect(requestPhoneNumberHint()).resolves.toBe('+15555215554');
  });

  it('resolves to null when the user closes the sheet', async () => {
    native.requestPhoneNumberHint.mockResolvedValue(null);
    await expect(requestPhoneNumberHint()).resolves.toBeNull();
  });

  it('resolves to null without Google Play services', async () => {
    native.isAvailable.mockReturnValue(false);
    await expect(requestPhoneNumberHint()).resolves.toBeNull();
    expect(native.requestPhoneNumberHint).not.toHaveBeenCalled();
  });

  it('resolves to null and warns when the hint fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    native.requestPhoneNumberHint.mockRejectedValue(
      Object.assign(new Error('No phone number'), { code: 'E_UNAVAILABLE' }),
    );
    await expect(requestPhoneNumberHint()).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('resolves to null on the web', async () => {
    await expect(requestOnWeb()).resolves.toBeNull();
  });
});
