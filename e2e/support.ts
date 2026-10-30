import { execFileSync } from 'node:child_process';
import { beforeEach } from '@e2e-dev/mobile';
import type { Locator, Screen } from 'e2e';

let installed = false;

// Installs the build named by OTPKIT_APP_PATH once per run on device targets. Without it, the app must already be on the device.
export function installBuildOnce(): void {
  beforeEach(async (fixtures) => {
    if (fixtures.platform === 'web' || installed || !process.env.OTPKIT_APP_PATH) return;
    await fixtures.device.installApp();
    installed = true;
  });
}

// Material 3 controls on Android wrap a role node that covers them, so a plain tap() finds no point it may press.
export async function tapCenter(node: Locator): Promise<void> {
  await node.waitFor({ state: 'visible' });
  const box = await node.boundingBox();
  if (!box) throw new Error('tap target is not on screen');
  await node.tap({ position: { x: box.width / 2, y: box.height / 2 } });
}

export async function openTab(screen: Screen, key: string): Promise<void> {
  await tapCenter(screen.getByTestId(`tab-${key}`));
}

// The hidden input of a field on the Looks tab, scrolled into view. On iOS the keyboard of the autofocused box covers every field below groups.
export async function input(screen: Screen, id: string): Promise<Locator> {
  // A scroll that starts before the tab renders carries the top field away, so box must show first.
  await screen.getByTestId('box-input').waitFor({ state: 'visible' });
  const node = screen.getByTestId(`${id}-input`);
  await screen.scrollUntilVisible(node, { direction: 'down' });
  return node;
}

// Targets the emulator named by E2E_ANDROID_DEVICE, which adb needs when more than one runs.
function adb(...args: string[]): void {
  const serial = process.env.E2E_ANDROID_DEVICE;
  execFileSync('adb', serial ? ['-s', serial, ...args] : args);
}

// Heads-up SMS notifications cover the tab bar, so the SMS tests turn them off while they run.
export function setHeadsUp(enabled: boolean): void {
  adb('shell', 'settings', 'put', 'global', 'heads_up_notifications_enabled', enabled ? '1' : '0');
}

// The consent sheet slides up; a tap during the animation lands on nothing.
export function settle(ms = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// agent-device cannot press Backspace on a device, so Android takes a key event and iOS the number pad key.
export async function deleteLast(screen: Screen, field: Locator, platform: string): Promise<void> {
  if (platform === 'android') adb('shell', 'input', 'keyevent', '67');
  else if (platform === 'ios') await tapCenter(screen.getByText('Delete'));
  else await field.press('Backspace');
}

export function sendSms(message: string): void {
  adb('emu', 'sms', 'send', '5551234', message);
}

// The e2e runner has no clipboard API; the booted simulator's pasteboard stands in.
export function setSimulatorClipboard(text: string): void {
  const device = process.env.E2E_IOS_DEVICE ?? 'booted';
  execFileSync('xcrun', ['simctl', 'pbcopy', device], { input: text });
  const pasted = execFileSync('xcrun', ['simctl', 'pbpaste', device], { encoding: 'utf8' });
  if (pasted.trim() !== text) {
    throw new Error(
      'The simulator pasteboard holds the Mac one, synced by the Device Hub or Simulator.app window showing it. Boot the simulator with `xcrun simctl boot` and no window, then run again.',
    );
  }
}
