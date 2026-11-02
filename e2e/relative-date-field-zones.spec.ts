import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Relative Date Field lab zones, cutoffs and open state', () => {
  test('UIC-RELATIVE-DATE-FIELD-1.2 UIC-RELATIVE-DATE-FIELD-1.3 reads days in the chosen zone', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const demo = page.locator('[data-lab-demo="zoned-now"]');
    await expect(
      demo.getByRole('button', { name: /^Tomorrow Due, read in New York/ }),
    ).toBeVisible();
    await demo.getByRole('button', { name: /^Tomorrow Due/ }).click();
    await page.getByRole('option', { name: 'Today' }).click();
    await expect(output(page, 'Zoned commit')).toHaveText('2026-04-20');
    await demo.getByRole('button', { name: 'Read in Tokyo' }).click();
    await expect(output(page, 'Zone')).toHaveText('Asia/Tokyo');
    await demo.getByRole('button', { name: /Due, read in Tokyo/ }).click();
    await page.getByRole('option', { name: 'Today' }).click();
    await expect(output(page, 'Zoned commit')).toHaveText('2026-04-21');
  });

  test('UIC-RELATIVE-DATE-FIELD-1.2 UIC-RELATIVE-DATE-FIELD-2.3 reads values as dates from the cutoff on', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const relative = matrixCell(page, 'cutoff=5');
    const absolute = matrixCell(page, 'cutoff=4');
    await expect(relative.getByRole('button').first()).not.toContainText('24');
    await expect(absolute.getByRole('button').first()).toContainText('24');
    await expect(matrixCell(page, 'cutoff=3').getByRole('button').first()).toContainText('24');
  });

  test('UIC-RELATIVE-DATE-FIELD-1.4 lets the host own the presets and shows its placeholder', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const demo = page.locator('[data-lab-demo="host-open"]');
    const listbox = page.getByRole('listbox');
    const trigger = demo.getByRole('button', { name: /Host-opened due date/ }).first();
    await demo.getByRole('button', { name: 'Open the due date', exact: true }).click();
    await expect(listbox).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(listbox).toHaveCount(0);
    await expect(output(page, 'Open requests due date')).toHaveText('close');

    await demo.getByRole('button', { name: 'Close the due date in 2 s' }).click();
    await trigger.click();
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveCount(0);
    await expect(output(page, 'Host open due date')).toHaveText('false');

    await demo.getByRole('button', { name: 'Disable the due date in 2 s' }).click();
    await trigger.click();
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveCount(0);
    await demo.getByRole('button', { name: 'Enable the due date' }).click();
    await expect(trigger).toBeEnabled();
    await expect(listbox).toHaveCount(0);

    await demo.getByRole('button', { name: 'Clear the due date' }).click();
    await expect(
      demo.getByRole('button', { name: 'No due date Host-opened due date' }),
    ).toBeVisible();
    await expect(output(page, 'Due value')).toHaveText('none');
  });

  test('UIC-RELATIVE-DATE-FIELD-1.3 opens its presets on the first render', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    await page.getByRole('button', { name: 'Mount an initially open due date' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(output(page, 'Open at first')).toHaveText('close');
  });
});
