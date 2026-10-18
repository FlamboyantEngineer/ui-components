import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

async function openPopover(page: Page, trigger: Locator, label: string) {
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: label });
  await expect(dialog.locator('xpath=..')).not.toHaveAttribute('data-entering', /.*/);
  return dialog;
}

test.describe('Tree Select Field lab', () => {
  test('UIC-TREE-SELECT-FIELD-1.1 UIC-TREE-SELECT-FIELD-1.4 draws every field state and display', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-select-field');
    const cell = (id: string) => page.locator(`[data-lab-cell="${id}"]`);
    await expect(
      cell('state=resting layout=label-control').locator('.ui-tree-select-field__value'),
    ).toHaveText('Oslo');
    await expect(
      cell('state=required layout=label-control').locator('.ui-tree-select-field__value'),
    ).toHaveAttribute('data-placeholder', 'true');
    await expect(
      cell('mode=single display=path').locator('.ui-tree-select-field__value'),
    ).toHaveText('Europe/Norway/Bergen');
    await expect(
      cell('mode=multiple display=label').locator('.ui-tree-select-field__chip'),
    ).toHaveText(['Portugal', 'Quito']);
    await expect(
      cell('mode=multiple display=path').locator('.ui-tree-select-field__chip'),
    ).toHaveText(['Europe/Portugal', 'Americas/Ecuador/Quito']);
    await expect(
      cell('state=disabled layout=label-control').getByRole('button').first(),
    ).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-TREE-SELECT-FIELD-1.2 UIC-TREE-SELECT-FIELD-1.3 UIC-TREE-SELECT-FIELD-2.1 searches, chooses from the keyboard and clears', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-select-field');
    const single = field(page, 'single');
    const trigger = single.locator('.ui-tree-select-field__trigger');
    const dialog = await openPopover(page, trigger, 'Office');
    await expect(dialog.getByRole('searchbox', { name: 'Filter office' })).toBeFocused();
    await page.keyboard.type('lis');
    await expect(dialog.getByRole('row')).toHaveText(['Europe', 'Portugal', 'Lisbon']);
    await page.keyboard.press('ArrowDown');
    await expect(dialog.getByRole('row', { name: 'Europe' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, 'single')).toHaveText('lisbon');
    await expect(single.locator('.ui-tree-select-field__value')).toHaveText(
      'Europe/Portugal/Lisbon',
    );
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(page.getByRole('dialog').getByRole('row', { name: 'Lisbon' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('dialog').getByRole('searchbox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await single.getByRole('button', { name: 'Clear Office' }).click();
    await expect(output(page, 'single')).toHaveText('null');
  });

  test('UIC-TREE-SELECT-FIELD-2.2 UIC-TREE-SELECT-FIELD-2.3 chooses a branch with cascading checkboxes and removes its chip', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-select-field');
    const regions = field(page, 'cascade');
    const dialog = await openPopover(
      page,
      regions.locator('.ui-tree-select-field__trigger'),
      'Regions',
    );
    await dialog
      .getByRole('row', { name: 'Europe' })
      .getByRole('button', { name: /Expand/ })
      .click();
    await dialog.getByRole('row', { name: 'Norway' }).locator('.ui-tree__checkbox').click();
    await expect(output(page, 'cascade')).toHaveText('norway, oslo, bergen, tromso');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(regions.locator('.ui-tree-select-field__chip')).toHaveText(['Norway']);
    await expect(regions.locator('.ui-tree-select-field__value')).toHaveText('1 selected');
    await regions.getByRole('button', { name: 'Remove Norway' }).click();
    await expect(output(page, 'cascade')).toHaveText('none');
    const stops = field(page, 'independent');
    const second = await openPopover(
      page,
      stops.locator('.ui-tree-select-field__trigger'),
      'Stops',
    );
    await second.getByRole('row', { name: 'Europe' }).locator('.ui-tree__checkbox').click();
    await expect(output(page, 'independent')).toHaveText('europe');
  });

  test('UIC-TREE-SELECT-FIELD-2.4 UIC-TREE-SELECT-FIELD-1.5 loads a branch lazily', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-select-field');
    const lazy = field(page, 'lazy');
    await expect(lazy.locator('.ui-tree-select-field__value')).toHaveAttribute(
      'data-missing',
      'true',
    );
    await expect(lazy.locator('.ui-tree-select-field__value')).toHaveText('vietnam');
    const dialog = await openPopover(
      page,
      lazy.locator('.ui-tree-select-field__trigger'),
      'Destination',
    );
    await dialog
      .getByRole('row', { name: 'Asia' })
      .getByRole('button', { name: /Expand/ })
      .click();
    await expect(dialog.getByRole('row', { name: 'Vietnam' })).toBeVisible();
    await expect(lazy.locator('.ui-tree-select-field__value')).toHaveText('Vietnam');
    await expect(lazy.locator('.ui-tree-select-field__value')).not.toHaveAttribute(
      'data-missing',
      /.*/,
    );
  });

  test('UIC-TREE-SELECT-FIELD-1.2 passes axe in the dark theme with the popover open', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-select-field', { theme: 'dark' });
    await openPopover(
      page,
      field(page, 'single').locator('.ui-tree-select-field__trigger'),
      'Office',
    );
    await lab.expectAccessible('.ui-tree-select-field__popover');
    await lab.expectAccessible();
  });
});
