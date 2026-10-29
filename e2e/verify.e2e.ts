import { expect, test } from 'e2e';
import { installBuildOnce, tapCenter } from './support';

installBuildOnce();

test('rejects a wrong code, then signs in', async ({ app, screen }) => {
  await app.restart();
  await screen.getByTestId('phone').fill('5551234');
  await tapCenter(screen.getByTestId('send-code'));
  const field = screen.getByTestId('sign-in-field-input');
  await field.pressSequentially('111111', { delay: 120 });
  await expect(screen.getByTestId('sign-in-status')).toHaveText('Incorrect code');
  await expect(field).toHaveValue('');
  await field.pressSequentially('123456', { delay: 120 });
  await expect(screen.getByTestId('sign-in-status')).toHaveText('Signed in');
});

test('focuses the field when it appears', async ({ app, screen }) => {
  await app.restart();
  await tapCenter(screen.getByTestId('send-code'));
  await expect(screen.getByTestId('sign-in-field-input')).toBeFocused();
});

test('counts down before allowing a resend', async ({ app, screen }) => {
  await app.restart();
  await tapCenter(screen.getByTestId('send-code'));
  await expect(screen.getByTestId('resend')).toContainText('Resend in');
});

// iOS once dropped a key in the first burst after the field mounted; this repeats that path on every run.
test('keeps every digit when typing right after the field mounts', async ({ app, screen }) => {
  await app.restart();
  await tapCenter(screen.getByTestId('send-code'));
  await screen.getByTestId('sign-in-field-input').pressSequentially('123456');
  await expect(screen.getByTestId('sign-in-status')).toHaveText('Signed in');
});
