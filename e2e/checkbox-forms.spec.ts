import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Checkbox lab forms and focus', () => {
  test('UIC-CHECKBOX-1.6 submits named values and resets each box as it started', async ({
    page,
    lab,
  }) => {
    await lab.open('checkbox');
    const form = page.getByRole('form', { name: 'Preferences' });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Preferences submitted')).toHaveText('terms=accepted');
    await form.getByText('Keep me signed in').click();
    await form.getByText('Weekly updates').click();
    await form.getByText('All columns').click();
    await expect(output(page, 'Controlled')).toHaveText('updates true, columns true');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Preferences submitted')).toHaveText('updates=weekly, columns=all');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(form.getByRole('checkbox', { name: 'Keep me signed in' })).toBeChecked();
    await expect(form.getByRole('checkbox', { name: 'Weekly updates' })).not.toBeChecked();
    await expect(output(page, 'Controlled')).toHaveText('updates false, columns false');
  });

  test('UIC-CHECKBOX-1.3 blocks a native required submit and lets an aria one through', async ({
    page,
    lab,
  }) => {
    await lab.open('checkbox');
    await page
      .getByRole('form', { name: 'Native terms' })
      .getByRole('button', { name: 'Submit' })
      .click();
    await expect(output(page, 'Native terms submitted')).toHaveText('not yet');
    const aria = page.getByRole('form', { name: 'Aria terms' });
    await aria.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Aria terms submitted')).toHaveText('nothing');
    await expect(aria.getByRole('checkbox', { name: /aria/ })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  test('UIC-CHECKBOX-1.3 focuses the native input through inputRef and on mount', async ({
    page,
    lab,
  }) => {
    await lab.open('checkbox');
    await page.getByRole('button', { name: 'Focus the input' }).click();
    await expect(page.getByRole('checkbox', { name: 'Archive when done' })).toBeFocused();
    await expect(output(page, 'Focused element')).toHaveText('input');
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox', { name: 'Archive when done' })).toBeChecked();
    await page.getByRole('button', { name: 'Mount an autofocused box' }).click();
    await expect(page.getByRole('checkbox', { name: 'Notify me' })).toBeFocused();
  });
});
