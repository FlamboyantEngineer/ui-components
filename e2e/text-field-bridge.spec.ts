import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Text Field lab input types and editor bridge', () => {
  test('UIC-TEXT-FIELD-1.1 renders native inputs of each type', async ({ page, lab }) => {
    await lab.open('text-field');
    await expect(page.getByRole('searchbox', { name: 'Search (type search)' })).toHaveValue('tea');
    await expect(page.getByRole('textbox', { name: 'Phone (type tel)' })).toHaveAttribute(
      'type',
      'tel',
    );
    const pin = page.getByLabel('PIN (type password, no reveal)');
    await expect(pin).toHaveAttribute('type', 'password');
    await expect(page.locator('[data-lab-field="type-password"]').getByRole('button')).toHaveCount(
      0,
    );
  });

  test('UIC-TEXT-FIELD-6.1 UIC-TEXT-FIELD-6.2 bridges text area events and its ref', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const note = page.getByRole('textbox', { name: 'Margin note' });
    await note.pressSequentially('ok');
    await expect(output(page, 'Note')).toHaveText('ok');
    await expect(output(page, 'Note events')).toHaveText('beforeinput o · beforeinput k');
    await page.getByRole('button', { name: 'Select the note' }).click();
    await expect(note).toBeFocused();
    await expect(output(page, 'Note selection')).toHaveText('textarea 0-2');
    await page.getByRole('button', { name: 'Clear the events' }).click();
    await expect(output(page, 'Note events')).toHaveText('none');
  });
});
