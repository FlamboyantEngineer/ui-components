import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-version-history`;

test.describe('Version History lab', () => {
  test('UIC-VERSION-HISTORY-1.1 UIC-VERSION-HISTORY-1.2 lists named and automatic versions', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const history = page.locator(cell('state=versions filters=shown'));
    const rows = history.getByRole('row');
    await expect(rows).toHaveCount(6);
    await expect(history.locator('.ui-version-history__label')).toHaveText([
      /^Apr 20, 2026, 10:24\sAM$/,
      'Ready for review',
      /^Apr 19, 2026, 4:42\sPM$/,
      /^Apr 19, 2026, 11:05\sAM$/,
      'First draft',
      /^Apr 14, 2026, 2:20\sPM$/,
    ]);
    await expect(rows.nth(0)).toHaveAttribute('data-current', 'true');
    await expect(rows.nth(0).locator('.ui-version-history__current')).toHaveText('Current');
    await expect(rows.nth(1)).toHaveAttribute('data-named', 'true');
    await expect(rows.nth(1).locator('.ui-version-history__attribution')).toHaveText(
      '1 hour ago by Jon Berg',
    );
    await expect(rows.nth(1).locator('.ui-version-history__summary')).toHaveText(
      'Added the cooling step',
    );
    await expect(rows.nth(5)).toHaveAttribute('aria-disabled', 'true');
    const checkbox = requireDefined(await rows.nth(1).getByRole('checkbox').boundingBox());
    const label = requireDefined(
      await rows.nth(1).locator('.ui-version-history__label').boundingBox(),
    );
    expect(checkbox.x).toBeLessThan(label.x);
  });

  test('UIC-VERSION-HISTORY-1.3 UIC-VERSION-HISTORY-1.4 views one version and compares two', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="recipe"]');
    const rows = demo.getByRole('row');
    const compare = demo.getByRole('button', { name: 'Compare' });
    await expect(compare).toBeDisabled();
    await rows.nth(2).click();
    await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(demo.locator('[data-lab-output="viewed"]')).toHaveText(
      'Rye loaf: Mix the flours, add the starter and water, and rest for an hour.',
    );
    await rows.nth(0).locator('.ui-list-view-item__checkbox').click();
    await expect(compare).toBeEnabled();
    await compare.click();
    const comparison = demo.getByLabel('Comparison');
    await expect(comparison.locator('dt')).toHaveText(['Title', 'Method', 'Tags']);
    await expect(comparison.locator('[data-side="after"] .ui-change-list__new')).toHaveText(
      'Seeded rye loaf',
    );
    await rows.nth(1).click();
    await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'false');
    await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('UIC-VERSION-HISTORY-1.5 restores a version after a confirmation', async ({ page, lab }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="recipe"]');
    const rows = demo.getByRole('row');
    await rows.nth(2).getByRole('button', { name: 'Actions for Original' }).click();
    await page.getByRole('menuitem', { name: 'Restore this version' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Restore Original?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Restore' }).click();
    await expect(dialog).toBeHidden();
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toHaveAttribute('data-current', 'true');
    await expect(rows.nth(0).locator('.ui-version-history__summary')).toHaveText(
      'Restored from Original',
    );
    await expect(rows.nth(1)).not.toHaveAttribute('data-current');
    await rows
      .nth(0)
      .getByRole('button', { name: /^Actions for/ })
      .click();
    await expect(page.getByRole('menuitem', { name: 'Restore this version' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('UIC-VERSION-HISTORY-1.6 names a version', async ({ page, lab }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="recipe"]');
    const first = demo.getByRole('row').nth(0);
    await first.getByRole('button', { name: /^Actions for/ }).click();
    await page.getByRole('menuitem', { name: 'Name this version' }).click();
    const dialog = page.getByRole('dialog', { name: 'Name this version' });
    const field = dialog.getByRole('textbox', { name: 'Version name' });
    await expect(field).toBeFocused();
    await field.fill('With seeds');
    await field.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(first.locator('.ui-version-history__label')).toHaveText('With seeds');
    await expect(first).toHaveAttribute('data-named', 'true');
  });

  test('UIC-VERSION-HISTORY-1.6 leaves a later rename open when a dismissed one settles', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="recipe"]');
    const rows = demo.getByRole('row');
    await rows
      .nth(0)
      .getByRole('button', { name: /^Actions for/ })
      .click();
    await page.getByRole('menuitem', { name: 'Name this version' }).click();
    const first = page.getByRole('dialog', { name: 'Name this version' });
    await first.getByRole('textbox', { name: 'Version name' }).fill('Slow name');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(first).toBeHidden();
    await rows
      .nth(1)
      .getByRole('button', { name: /^Actions for/ })
      .click();
    await page.getByRole('menuitem', { name: /^(Name this version|Rename version)$/ }).click();
    const second = page.getByRole('dialog');
    const field = second.getByRole('textbox', { name: 'Version name' });
    await field.fill('Typed meanwhile');
    await expect(rows.nth(0).locator('.ui-version-history__label')).toHaveText('Slow name');
    await expect(second).toBeVisible();
    await expect(field).toHaveValue('Typed meanwhile');
  });

  test('UIC-VERSION-HISTORY-1.7 filters to named versions and one person', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    await expect(
      page.locator(cell('filter=named only')).locator('.ui-version-history__label'),
    ).toHaveText(['Ready for review', 'First draft']);
    const demo = page.locator('[data-lab-demo="recipe"]');
    await demo.locator('.ui-version-history__named-only').click();
    await expect(demo.locator('.ui-version-history__label')).toHaveText([
      'Tested once',
      'Original',
    ]);
    await demo.getByRole('button', { name: 'Edited by anyone' }).click();
    await page.getByRole('menuitemradio', { name: 'Lena Ortiz' }).click();
    await expect(demo.locator('.ui-version-history__label')).toHaveText(['Tested once']);
    await demo.getByRole('button', { name: 'Edited by Lena Ortiz' }).click();
    await page.getByRole('menuitemradio', { name: 'Jon Berg' }).click();
    await expect(demo.getByRole('grid')).toHaveText('No versions match the filters.');
  });

  test('UIC-VERSION-HISTORY-1.9 shows loading, errors and no versions', async ({ page, lab }) => {
    await lab.open('version-history');
    const more = page.locator(cell('state=loading more filters=shown'));
    await expect(more).toHaveAttribute('data-loading', 'true');
    await more.locator('.ui-list-view__loader').scrollIntoViewIfNeeded();
    await expect(more.locator('.ui-list-view__loader')).toContainText('Loading');
    await expect(page.locator(cell('state=loading filters=hidden')).getByRole('status')).toHaveText(
      /^Loading/,
    );
    const error = page
      .locator(cell('state=error filters=shown'))
      .locator('.ui-version-history__error');
    await expect(error).toContainText('The versions could not be loaded.');
    await expect(error.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(page.locator(cell('state=empty filters=hidden')).getByRole('grid')).toHaveText(
      'No versions yet.',
    );
  });

  test('UIC-VERSION-HISTORY-2.1 moves through versions by keyboard and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="recipe"]');
    const grid = demo.getByRole('grid', { name: 'Recipe versions' });
    await demo.getByRole('button', { name: 'Edited by anyone' }).focus();
    await page.keyboard.press('Tab');
    const rows = grid.getByRole('row');
    await expect(rows.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(rows.nth(1).getByRole('checkbox')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(rows.nth(1).locator('.ui-attribution__time')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(
      rows.nth(1).getByRole('button', { name: 'Actions for Tested once' }),
    ).toBeFocused();
    await lab.expectAccessible();
  });
});
