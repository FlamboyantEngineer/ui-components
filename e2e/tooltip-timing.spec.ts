import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Tooltip lab timing', () => {
  test('UIC-TOOLTIP-1.3 keeps the hint for its close delay after the pointer leaves', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const area = demo(page, 'close-delay');
    const save = area.getByRole('button', { name: 'Save' });
    await save.hover();
    await expect(page.getByRole('tooltip', { name: 'Saved to the orchard log' })).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(output(page, 'Close delay open')).toHaveText('true');
    await expect(output(page, 'Close delay open')).toHaveText('false', { timeout: 4000 });
    await expect(output(page, 'Stayed after leaving')).toHaveText(/^1[25]\d0 ms$|^1500 ms$/);

    const field = area.getByRole('textbox', { name: 'Close delay (ms)' });
    await field.fill('0');
    await field.press('Enter');
    await save.hover();
    await expect(output(page, 'Close delay open')).toHaveText('true');
    await page.mouse.move(0, 0);
    await expect(output(page, 'Close delay open')).toHaveText('false');
    await expect(output(page, 'Stayed after leaving')).toHaveText(/^(0|250) ms$/);
  });

  test('UIC-TOOLTIP-1.3 closes on a press only when shouldCloseOnPress allows it', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    for (const [name, staysOpen] of [
      ['Press closes', false],
      ['Press keeps open', true],
    ] as const) {
      const button = page.getByRole('button', { name, exact: true });
      await button.hover();
      await expect(output(page, `${name} open`)).toHaveText('true');
      await button.click();
      await expect(output(page, `${name} presses`)).toHaveText('1');
      await expect(output(page, `${name} open`)).toHaveText(String(staysOpen));
      await page.mouse.move(0, 0);
      await expect(output(page, `${name} open`)).toHaveText('false', { timeout: 4000 });

      await button.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(output(page, `${name} open`)).toHaveText('true');
      await page.keyboard.press('Enter');
      await expect(output(page, `${name} presses`)).toHaveText('2');
      await expect(output(page, `${name} open`)).toHaveText(String(staysOpen));
      await page.keyboard.press('Escape');
    }
  });
});
