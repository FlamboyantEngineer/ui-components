import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Field lab custom controls', () => {
  test('UIC-FIELD-8.1 UIC-FIELD-2.3 UIC-FIELD-1.11 builds a control with a value contract that commits on leaving', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const demo = page.locator('[data-lab-demo="custom-control"]');
    const root = demo.locator('.ui-field');
    await expect(demo.getByText('A value is required.')).toBeVisible();
    const minutes = demo.getByRole('spinbutton', { name: 'Minutes before' });
    await minutes.fill('45');
    await expect(output(page, 'Reminder value')).toHaveText('off (45 min kept)');
    await expect(root).not.toHaveAttribute('data-dirty');
    const toggle = demo.getByRole('switch', { name: 'Reminder' });
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(output(page, 'Reminder value')).toHaveText('on, 45 min');
    await expect(root).toHaveAttribute('data-dirty', 'true');
    await expect(demo.getByText('A value is required.')).toHaveCount(0);
    await toggle.focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menu', { name: 'Reminder actions' })).toBeVisible();
    await page.keyboard.press('Escape');
    await minutes.focus();
    await expect(output(page, 'Reminder commits')).toHaveText('none');
    await page.getByRole('heading', { name: 'A custom control' }).click();
    await expect(output(page, 'Reminder commits')).toHaveText('on, 45 min');
  });

  test('UIC-FIELD-5.1 leaves the history to a control that keeps its own', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const demo = page.locator('[data-lab-demo="own-history"]');
    await demo.getByRole('button', { name: 'Add a visitor' }).click();
    await demo.getByRole('button', { name: 'Add a visitor' }).click();
    await expect(output(page, 'Tally history')).toHaveText('0, 1');
    await expect(output(page, 'Field can undo')).toHaveText('false');
    await demo.getByRole('button', { name: 'Step the tally back' }).click();
    await expect(output(page, 'Tally history')).toHaveText('0');
    await expect(demo.locator('output').first()).toHaveText('1');
  });

  test('UIC-FIELD-1.13 UIC-FIELD-4.2 marks previous values in each change layout', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const inline = matrixCell(page, 'marker=text layout=inline');
    await expect(inline.locator('del')).toHaveText('Blue');
    await inline.getByRole('button', { name: 'Restore the earlier colour' }).click();
    await expect(inline.getByRole('textbox')).toHaveValue('Blue');
    await expect(output(page, 'Restored inline text')).toHaveText('1');

    const stacked = matrixCell(page, 'marker=icon layout=stacked');
    const marker = await stacked.locator('del').boundingBox();
    const input = await stacked.getByRole('textbox').boundingBox();
    expect(marker && input && marker.y + marker.height <= input.y + 1).toBe(true);

    const hidden = matrixCell(page, 'marker=text layout=hidden');
    await expect(hidden.locator('del')).toHaveCount(0);
    await hidden.getByRole('button', { name: 'Restore Colour, hidden, text' }).click();
    await expect(hidden.getByRole('textbox')).toHaveValue('Blue');

    await expect(
      matrixCell(page, 'marker=locked layout=inline').getByRole('button', {
        name: 'Restore the earlier colour',
      }),
    ).toBeDisabled();
  });

  test('UIC-FIELD-3.9 UIC-FIELD-3.11 clears each name error with its part and blocks on a draft', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const demo = page.locator('[data-lab-demo="error-sources"]');
    const submit = demo.getByRole('button', { name: 'Submit prices' });
    await demo.getByRole('button', { name: 'Load server errors' }).click();
    const messages = demo.locator('.ui-field__message');
    await expect(messages).toHaveText('The lowest price is under the floor.');
    await expect(output(page, 'Price blockers')).toHaveText('The lowest price is under the floor.');
    await submit.click();
    await expect(output(page, 'Prices submitted')).toHaveText('not yet');
    await demo.getByRole('textbox', { name: 'Lowest price' }).fill('12');
    await expect(messages).toHaveText('Too high for this shop.');
    await expect(output(page, 'Price blockers')).toHaveText('Too high for this shop.');
    await demo.getByRole('textbox', { name: 'Highest price' }).fill('lots');
    await expect(output(page, 'Accepted range')).toHaveText('12 to 40');
    await expect(output(page, 'Price blockers')).toContainText('Enter whole numbers.');
    await demo.getByRole('textbox', { name: 'Highest price' }).fill('50');
    await expect(output(page, 'Price blockers')).toHaveText('none');
    await submit.click();
    await expect(output(page, 'Prices submitted')).toHaveText('low=12, high=50');
  });
});
