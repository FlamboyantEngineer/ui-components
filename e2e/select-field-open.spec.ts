import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

for (const mode of ['list', 'tree'] as const) {
  test(`UIC-SELECT-FIELD-3.1 UIC-SELECT-FIELD-9.2 lets the host own the ${mode} open state`, async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const demo = page.locator(`[data-lab-demo="host-open-${mode}"]`);
    const popup = page.locator('.ui-select-field__popover');
    const trigger = demo.getByRole('button', { name: new RegExp(`Host-opened ${mode}`) });
    await demo.getByRole('button', { name: `Open the ${mode}`, exact: true }).click();
    await expect(output(page, `Host open ${mode}`)).toHaveText('true');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(output(page, `Open requests ${mode}`)).toHaveText('close');
    await expect(output(page, `Host open ${mode}`)).toHaveText('false');

    await demo.getByRole('button', { name: `Close the ${mode} in 2 s` }).click();
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(output(page, `Open requests ${mode}`)).toHaveText('close, open');
    await expect(popup).toBeHidden();
    await expect(output(page, `Host open ${mode}`)).toHaveText('false');

    await demo.getByRole('button', { name: `Disable the ${mode} in 2 s` }).click();
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(popup).toBeHidden();
    await expect(output(page, `Host open ${mode}`)).toHaveText('false');
    await demo.getByRole('button', { name: `Enable the ${mode}` }).click();
    await expect(trigger).toBeEnabled();
    await expect(popup).toBeHidden();
  });

  test(`UIC-SELECT-FIELD-3.1 opens the ${mode} on its first render with defaultOpen`, async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await page.getByRole('button', { name: `Mount an initially open ${mode}` }).click();
    const popup = page.locator('.ui-select-field__popover');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(output(page, `Open at first ${mode}`)).toHaveText('close');
  });
}
