import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

for (const mode of ['date', 'date-time'] as const) {
  test(`UIC-DATE-TIME-FIELD-2.1 lets the host own the ${mode} popup`, async ({ page, lab }) => {
    await lab.open('date-time-field');
    const name = `${mode} field`;
    const demo = page.locator(`[data-lab-demo="host-open-${mode}"]`);
    const dialog = page.getByRole('dialog');
    const trigger = demo.getByRole('button', { name: /Calendar/ });
    await demo.getByRole('button', { name: `Open the ${name}`, exact: true }).click();
    await expect(dialog.getByRole('grid', { name: /April 2026/ })).toBeVisible();
    if (mode === 'date-time') {
      await expect(dialog.getByRole('listbox', { name: 'Hours' })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, `Open requests ${name}`)).toHaveText('close');
    await expect(output(page, `Host open ${name}`)).toHaveText('false');

    await demo.getByRole('button', { name: `Close the ${name} in 2 s` }).click();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(output(page, `Open requests ${name}`)).toHaveText('close, open');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, `Host open ${name}`)).toHaveText('false');

    await trigger.click();
    await dialog.getByRole('gridcell', { name: /15/ }).first().click();
    await expect(output(page, `Value ${mode}`)).toContainText('2026-04-15');

    await demo.getByRole('button', { name: `Disable the ${name} in 2 s` }).click();
    if (mode === 'date') await expect(dialog).toHaveCount(0);
    else await page.keyboard.press('Escape');
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(output(page, `Host open ${name}`)).toHaveText('true');
    await demo.getByRole('button', { name: `Enable the ${name}` }).click();
    await expect(dialog).toBeVisible();
  });

  test(`UIC-DATE-TIME-FIELD-2.1 opens the ${mode} popup on its first render`, async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    await page.getByRole('button', { name: `Mount an initially open ${mode} field` }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('grid', { name: /April 2026/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, `Open at first ${mode}`)).toHaveText('close');
  });
}

test('UIC-DATE-TIME-FIELD-4.1 keeps whole hours at hour granularity', async ({ page, lab }) => {
  await lab.open('date-time-field');
  const delivery = page.locator('[data-lab-field="hour-date-time"]');
  await expect(delivery.getByRole('spinbutton', { name: /^hour/ })).toHaveText('14');
  await expect(delivery.getByRole('spinbutton', { name: /minute/i })).toHaveCount(0);
  await delivery.getByRole('button', { name: /Calendar/ }).click();
  const hours = page.getByRole('dialog').getByRole('listbox', { name: 'Hours' });
  await expect(page.getByRole('dialog').getByRole('listbox', { name: 'Minutes' })).toHaveCount(0);
  await expect(hours.getByRole('option', { name: '07' })).toHaveAttribute('aria-disabled', 'true');
  await hours.getByRole('option', { name: '16' }).click();
  await expect(output(page, 'Delivery hour committed')).toHaveText('2026-04-13T16:00');
  await page.keyboard.press('Escape');

  const opening = page.locator('[data-lab-field="hour-time"]');
  await expect(opening.getByRole('spinbutton', { name: /minute/i })).toHaveCount(0);
  const hour = opening.getByRole('spinbutton', { name: /^hour/ });
  await hour.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Tab');
  await expect(output(page, 'Opening hour committed')).toHaveText('11:00');
});
