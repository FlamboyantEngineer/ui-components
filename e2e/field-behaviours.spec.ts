import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

// The field labs that show the field base's behaviours on their own field.
const LABS = [
  'expression-field',
  'period-field',
  'rating-field',
  'snippet-field',
  'time-zone-field',
];

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="behaviour-${name}"]`);

test.describe('Field behaviours on each field', () => {
  for (const name of LABS) {
    test(`UIC-FIELD-4.2 UIC-FIELD-3.9 UIC-FIELD-6.4 the ${name} lab restores, reports an owner error and opens the menu`, async ({
      page,
      lab,
    }) => {
      await lab.open(name);
      const restore = demo(page, 'restore').getByRole('button', { name: 'Restore Saved value' });
      await expect(restore).toBeVisible();
      await restore.click();
      await expect(restore).toHaveCount(0);

      await expect(demo(page, 'owner-error')).toContainText('Another record uses this value');
      await expect(
        demo(page, 'help').getByRole('button', { name: 'Help for With help' }),
      ).toBeVisible();
      await expect(
        demo(page, 'help-in-menu').getByRole('button', { name: 'Help for Help in the menu' }),
      ).toHaveCount(0);

      const menuCase = demo(page, 'menu');
      await menuCase.getByText('With a menu').click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Copy value' }).click();
      await expect(menuCase.locator('[data-lab-output="menu"]')).toHaveText('copy');
    });
  }
});
