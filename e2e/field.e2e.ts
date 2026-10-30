import { test as webTest } from '@e2e-dev/web';
import { expect, test } from 'e2e';
import {
  deleteLast,
  input,
  installBuildOnce,
  openTab,
  setSimulatorClipboard,
  tapCenter,
} from './support';

installBuildOnce();

test('types a code at a human pace', async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await (await input(screen, 'box')).pressSequentially('123456', { delay: 120 });
  await expect(screen.getByTestId('box-value')).toHaveText('box: 123456');
});

test('removes the last digit with backspace', async ({ app, screen, platform }) => {
  await app.restart();
  await openTab(screen, 'looks');
  const box = await input(screen, 'box');
  await box.pressSequentially('123456', { delay: 120 });
  await deleteLast(screen, box, platform);
  await expect(screen.getByTestId('box-value')).toHaveText('box: 12345');
});

test('drops letters in a numeric field', async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await (await input(screen, 'underline')).pressSequentially('1a2b', { delay: 120 });
  await expect(screen.getByTestId('underline-value')).toHaveText('underline: 12');
});

// The iOS runner types fill as keystrokes and cannot match the spoken value, so iOS pastes the formatted code instead.
test('takes a formatted code at once', { platforms: ['android', 'web'] }, async ({
  app,
  screen,
}) => {
  await app.restart();
  await openTab(screen, 'looks');
  await (await input(screen, 'groups')).fill('123-456');
  await expect(screen.getByTestId('groups-value')).toHaveText('groups: 123456');
});

test('keeps every digit when typing fast', async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await (await input(screen, 'box')).pressSequentially('987654');
  await expect(screen.getByTestId('box-value')).toHaveText('box: 987654');
});

test('pastes a formatted code', { platforms: ['ios'] }, async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  setSimulatorClipboard('654-321');
  const field = await input(screen, 'box');
  // Like a person: focus the field, then hold it for the edit menu.
  await field.tap();
  await field.longPress();
  await tapCenter(screen.getByText('Paste'));
  await expect(screen.getByTestId('box-value')).toHaveText('box: 654321');
});

test('masks a secure code', { platforms: ['web'] }, async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await (await input(screen, 'secure')).pressSequentially('12');
  await expect(screen.getByTestId('secure-cell-0')).toHaveText('•');
});

// A click can move a browser caret into the code, which native fields never allow.
test('keeps typing at the end after a click on the first cell', { platforms: ['web'] }, async ({
  app,
  screen,
}) => {
  await app.restart();
  await openTab(screen, 'looks');
  const box = await input(screen, 'box');
  await box.pressSequentially('12345', { delay: 50 });
  await box.tap({ position: { x: 4, y: 28 } });
  await box.pressSequentially('6');
  await expect(screen.getByTestId('box-value')).toHaveText('box: 123456');
});

// Cells are hidden from the accessibility tree, so only the web engine can measure one.
test('sizes the built-in cells from cellStyle', { platforms: ['web'] }, async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await input(screen, 'large');
  expect(await screen.getByTestId('large-cell-0').boundingBox()).toMatchObject({
    width: 64,
    height: 64,
  });
});

webTest(
  'styles the built-in cells from a cellStyle function',
  { platforms: ['web'] },
  async ({ app, screen, browser }) => {
    await app.restart();
    await openTab(screen, 'looks');
    await (await input(screen, 'tint')).tap();
    const border = (index: number) =>
      browser.evaluate<string>(
        `getComputedStyle(document.querySelector('[data-testid="tint-cell-${index}"] > div')).borderTopColor`,
      );
    expect(await border(0)).toBe('rgb(255, 111, 97)');
    expect(await border(1)).not.toBe('rgb(255, 111, 97)');
  },
);

test('keeps a disabled field closed', async ({ app, screen }) => {
  await app.restart();
  await openTab(screen, 'looks');
  await expect(await input(screen, 'disabled')).toBeDisabled();
});
