import { expect, test } from './fixtures.js';

test.describe('Display Options lab', () => {
  test('UIC-DISPLAY-OPTIONS-1.1 UIC-DISPLAY-OPTIONS-1.3 UIC-DISPLAY-OPTIONS-1.4 groups and sorts a table', async ({
    page,
    lab,
  }) => {
    await lab.open('display-options');
    await expect(
      page.locator('[data-lab-cell="state=disabled label=custom"]').getByRole('button'),
    ).toBeDisabled();
    const demo = page.locator('[data-lab-demo="recipes"]');
    const table = demo.locator('[data-lab-output="table"]');
    await demo.getByRole('button', { name: 'Display' }).click();
    const dialog = page.getByRole('dialog', { name: 'Display options' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Group by/ }).click();
    await page.getByRole('option', { name: 'Cuisine' }).click();
    await expect(table.locator('th[scope="rowgroup"]')).toHaveText([
      'Japanese',
      'Italian',
      'Nordic',
    ]);
    await dialog.getByRole('radio', { name: 'Descending' }).click();
    await expect(table.locator('tbody').first().locator('td').first()).toHaveText(
      'Seeded rye loaf',
    );
    await dialog.getByRole('button', { name: /Sort by/ }).click();
    await page.getByRole('option', { name: 'Default order' }).click();
    await expect(dialog.getByRole('radio', { name: 'Descending' })).toBeDisabled();
    await expect(demo.locator('[data-lab-output="value"]')).toContainText('"sort":null');
  });

  test('UIC-DISPLAY-OPTIONS-1.5 shows, hides and reorders properties', async ({ page, lab }) => {
    await lab.open('display-options');
    const demo = page.locator('[data-lab-demo="recipes"]');
    const headers = demo.locator('[data-lab-output="table"] thead th');
    await expect(headers).toHaveText(['Title', 'Cuisine', 'Cooking time']);
    await demo.getByRole('button', { name: 'Display' }).click();
    const list = page.getByRole('grid', { name: 'Shown properties' });
    const rows = list.getByRole('row');
    await expect(rows).toHaveText(['Title', 'Cuisine', 'Cooking time', 'Author']);
    await rows.nth(3).locator('.ui-display-options__visibility').click();
    await expect(headers).toHaveText(['Title', 'Cuisine', 'Cooking time', 'Author']);
    await rows.nth(1).locator('.ui-display-options__visibility').click();
    await expect(headers).toHaveText(['Title', 'Cooking time', 'Author']);
    await expect(rows).toHaveText(['Title', 'Cooking time', 'Author', 'Cuisine']);
    await rows.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(rows.nth(0).locator('.ui-list-view-item__drag-handle')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list.locator('.ui-list-view__drop-indicator[data-drop-target]')).toHaveCount(1);
    // Spots beside the dragged row would move nothing, so the first spot offered is after the next.
    await page.keyboard.press('Enter');
    await expect(headers).toHaveText(['Cooking time', 'Title', 'Author']);
  });

  test('UIC-DISPLAY-OPTIONS-1.6 UIC-DISPLAY-OPTIONS-2.1 changes the density and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('display-options');
    const demo = page.locator('[data-lab-demo="recipes"]');
    const trigger = demo.getByRole('button', { name: 'Display' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Display options' });
    const density = dialog.getByRole('radiogroup', { name: 'Density' });
    await density.getByRole('radio', { name: 'Compact' }).click();
    await expect(demo.locator('[data-lab-output="table"]')).toHaveAttribute(
      'data-density',
      'compact',
    );
    await expect(dialog.locator('[data-entering]')).toHaveCount(0);
    await lab.expectAccessible('.ui-display-options__popover');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await lab.expectAccessible();
    await lab.open('display-options', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
