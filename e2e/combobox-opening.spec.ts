import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Combobox lab opening rules, known options and required picks', () => {
  test('UIC-COMBOBOX-2.3 UIC-COMBOBOX-2.6 opens by trigger rule and suppresses an empty list', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const listbox = page.getByRole('listbox');

    const manual = page.getByRole('combobox', { name: 'Fruit, manual, empty shown' });
    await manual.fill('ap');
    await expect(listbox).toHaveCount(0);
    await expect(output(page, 'Opened manual shown')).toHaveText('none');
    await manual.press('ArrowDown');
    await expect(listbox).toBeVisible();
    await expect(output(page, 'Opened manual shown')).toHaveText('open');
    await manual.press('Escape');

    const shown = page.getByRole('combobox', { name: 'Fruit, input, empty shown' });
    await shown.fill('zz');
    await expect(listbox).toBeVisible();
    await expect(output(page, 'Opened input shown')).toHaveText('open');
    await shown.press('Escape');

    const suppressed = page.getByRole('combobox', { name: 'Fruit, input, empty suppressed' });
    await suppressed.fill('zz');
    await expect(listbox).toHaveCount(0);
    await expect(output(page, 'Opened input suppressed')).toHaveText('none');
    await suppressed.fill('ch');
    await expect(listbox.getByRole('option', { name: 'Cherry' })).toBeVisible();
    await suppressed.press('Escape');

    await page.getByRole('combobox', { name: 'Fruit, focus, empty shown' }).focus();
    await expect(listbox).toBeVisible();
    await expect(output(page, 'Opened focus shown')).toHaveText('open');
  });

  test('UIC-COMBOBOX-5.6 opens on its first render with defaultOpen', async ({ page, lab }) => {
    await lab.open('combobox');
    await page.getByRole('button', { name: 'Mount an initially open combobox' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: /Apple/ })).toBeVisible();
    await page.getByRole('combobox', { name: 'Fruit, open at first' }).press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(output(page, 'Opened at first')).toHaveText('closed');
  });

  test('UIC-COMBOBOX-3.7 names chosen ids from knownOptions without suggesting them', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const demo = page.locator('[data-lab-demo="known-options"]');
    await expect(demo.getByRole('combobox', { name: 'Saved type', exact: true })).toHaveValue(
      'Ledger',
    );
    await expect(demo.getByText('Ledger', { exact: true })).toHaveCount(1);
    await expect(demo.getByText('Archive', { exact: true })).toHaveCount(1);
    await demo.getByRole('combobox', { name: 'Saved types', exact: true }).press('ArrowDown');
    const list = page.getByRole('listbox');
    await expect(list.getByRole('option')).toHaveText(['Notes', 'Links', 'Events', 'Folders']);
    await expect(output(page, 'Known several')).toHaveText('ledger, archive');
  });

  test('UIC-COMBOBOX-3.6 blocks a required pick in a form until one is chosen', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const form = page.getByRole('form', { name: 'Fruit order' });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Fruit order submitted')).toHaveText('not yet');
    const input = form.getByRole('combobox', { name: 'Fruit to order' });
    await input.fill('Ban');
    await page.getByRole('option', { name: 'Banana' }).click();
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Fruit order submitted')).toHaveText('fruit=banana');
  });
});
