import { expect, test } from 'e2e';
import { installBuildOnce, openTab, sendSms, settle, tapCenter } from './support';

installBuildOnce();

test('fills the code from an SMS after consent', { platforms: ['android'] }, async ({
  app,
  screen,
}) => {
  await app.restart();
  await tapCenter(screen.getByTestId('send-code'));
  await expect(screen.getByTestId('sign-in-field-input')).toBeFocused();
  sendSms('Your code is 123456');
  await screen.getByText('Allow').waitFor({ state: 'visible' });
  await settle();
  await tapCenter(screen.getByText('Allow'));
  await expect(screen.getByTestId('sign-in-status')).toHaveText('Signed in');
});

test('fills the code from an SMS with the app hash', { platforms: ['android'] }, async ({
  app,
  screen,
}) => {
  await app.restart();
  await openTab(screen, 'retriever');
  const hashText = screen.getByTestId('app-hash');
  await expect(hashText).toHaveText(/^[A-Za-z0-9+/]{11}$/);
  const hash = await hashText.textContent();
  sendSms(`Your code is 654321 ${hash}`);
  await expect(screen.getByTestId('retriever-value')).toHaveText('retriever: 654321');
});
