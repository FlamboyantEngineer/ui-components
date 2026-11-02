import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Switch lab forms and focus', () => {
  test('UIC-SWITCH-1.3 UIC-SWITCH-1.5 validates required switches and resets a controlled one', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    const native = page.getByRole('form', { name: 'Native consent' });
    await native.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Native consent submitted')).toHaveText('not yet');
    await native.getByText('Share usage data (native)').click();
    await native.getByText('Nightly backups').click();
    await expect(output(page, 'Backups')).toHaveText('off');
    await native.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Native consent submitted')).toHaveText('consent=given');
    await native.getByRole('button', { name: 'Reset' }).click();
    await expect(output(page, 'Backups')).toHaveText('on');
    await expect(native.getByRole('switch', { name: /native/ })).not.toBeChecked();
    const aria = page.getByRole('form', { name: 'Aria consent' });
    await aria.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Aria consent submitted')).toHaveText('nothing');
  });

  test('UIC-SWITCH-1.3 focuses the native input through inputRef, never a disabled one', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    await page.getByRole('button', { name: 'Focus the input', exact: true }).click();
    await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeFocused();
    await expect(output(page, 'Focused')).toHaveText('the input');
    await page.getByRole('button', { name: 'Focus the disabled input' }).click();
    await expect(output(page, 'Focused')).toHaveText('nothing (the switch refused focus)');
    await page.getByRole('button', { name: 'Mount an autofocused switch' }).click();
    await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeFocused();
  });
});
