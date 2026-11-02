import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

/** Focuses the editor and presses `key` in the same task, before the list's next frame. */
async function pressBeforeShown(page: Page, key: string): Promise<void> {
  await page.locator('[data-lab-editor="handshake"]').evaluate((node, name) => {
    (node as HTMLInputElement).focus();
    node.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
    );
  }, key);
}

test.describe('Completion List lab shown handshake', () => {
  test('UIC-COMPLETION-LIST-2.8 inserts by key only once the list is shown', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const input = page.getByRole('combobox', { name: 'Handshake city' });
    await expect(output(page, 'Requested open')).toHaveText('false');
    await pressBeforeShown(page, 'Enter');
    await expect(output(page, 'Last key')).toHaveText('Enter with no list shown, nothing inserted');
    await expect(input).toHaveValue('');
    await expect(output(page, 'Requested open')).toHaveText('true');
    await expect(output(page, 'Shown')).toHaveText('true');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(output(page, 'Last key')).toHaveText('Tab inserted London');
    await expect(input).toHaveValue('London');
    await expect(input).toBeFocused();
    await expect(output(page, 'Shown')).toHaveText('false');

    await input.blur();
    await pressBeforeShown(page, 'Tab');
    await expect(output(page, 'Last key')).toHaveText('Tab with no list shown, nothing inserted');
    await expect(input).toHaveValue('London');
  });
});
