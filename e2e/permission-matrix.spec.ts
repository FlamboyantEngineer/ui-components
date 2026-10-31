import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
/** Presses a checkbox through its label, which the drawn box covers. */
const toggle = (scope: Locator, name: string) =>
  scope
    .locator('label', { has: scope.page().getByRole('checkbox', { name, exact: true }) })
    .click();

test.describe('Permission Matrix lab', () => {
  test('UIC-PERMISSION-MATRIX-1.1 UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-1.3 UIC-PERMISSION-MATRIX-2.2 UIC-PERMISSION-MATRIX-2.4 UIC-PERMISSION-MATRIX-3.1 shows groups, inherited, read-only and dirty cells', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const cell = (state: string) => page.locator(`[data-lab-cell="${state}"]`);
    await expect(cell('grants=saved layout=flat').locator('.ui-table__group-row')).toHaveCount(0);
    const grouped = cell('grants=saved layout=grouped');
    await expect(grouped.locator('.ui-table__group-label')).toHaveText(['Recipes', 'Photos']);
    await expect(grouped.getByRole('columnheader').nth(1)).toHaveText('Administrator, Read only');
    await expect(
      grouped.getByRole('checkbox', { name: 'Read recipes for Administrator' }),
    ).toHaveAttribute('aria-readonly', 'true');
    const inherited = cell('grants=inherited layout=grouped').getByRole('checkbox', {
      name: 'Read recipes for Guest, inherited',
    });
    await expect(inherited).toHaveJSProperty('indeterminate', true);
    for (const layout of ['flat', 'grouped']) {
      await expect(
        cell(`grants=dirty layout=${layout}`).locator('.ui-permission-matrix__grant[data-dirty]'),
      ).toHaveCount(1);
    }
    await lab.expectAccessible();
  });

  test('UIC-PERMISSION-MATRIX-2.1 UIC-PERMISSION-MATRIX-2.3 UIC-PERMISSION-MATRIX-2.4 edits grants and saves them', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const editor = demo(page, 'editor');
    const output = editor.locator('[data-lab-output]');
    await toggle(editor, 'Delete photos for Editor');
    await expect(output).toHaveText('Granted Delete photos for Editor');
    await expect(editor.locator('.ui-permission-matrix__grant[data-dirty]')).toHaveCount(1);
    await toggle(editor, 'All Settings for Reviewer');
    await expect(output).toHaveText('Granted Edit site settings, Invite members for Reviewer');
    await expect(editor.getByRole('checkbox', { name: 'All Settings for Reviewer' })).toBeChecked();
    await expect(editor.locator('.ui-permission-matrix__grant[data-dirty]')).toHaveCount(3);
    await toggle(editor, 'Upload photos for Reviewer, inherited');
    await expect(
      editor.getByRole('checkbox', { name: 'Upload photos for Reviewer' }),
    ).toBeChecked();
    await editor.getByRole('button', { name: 'Save' }).click();
    await expect(output).toHaveText('Saved 16 grants');
    await expect(editor.locator('.ui-permission-matrix__grant[data-dirty]')).toHaveCount(0);
  });

  test('UIC-PERMISSION-MATRIX-3.1 moves between checkboxes and toggles them from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const editor = demo(page, 'editor');
    await toggle(editor, 'Read recipes for Editor');
    await expect(editor.getByRole('checkbox', { name: 'Read recipes for Editor' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(editor.getByRole('checkbox', { name: 'Read recipes for Reviewer' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    const write = editor.getByRole('checkbox', { name: 'Write recipes for Reviewer' });
    await expect(write).toBeFocused();
    await page.keyboard.press('Space');
    await expect(write).toBeChecked();
    await expect(editor.locator('[data-lab-output]')).toHaveText(
      'Granted Write recipes for Reviewer',
    );
  });

  test('UIC-PERMISSION-MATRIX-1.5 keeps the focused checkbox on its role when the roles reorder', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const editor = demo(page, 'editor');
    await editor.getByRole('button', { name: 'Reverse roles in 1.5 seconds' }).click();
    await toggle(editor, 'Write recipes for Reviewer');
    const write = editor.getByRole('checkbox', { name: 'Write recipes for Reviewer' });
    await expect(write).toBeFocused();
    await expect(editor.getByRole('columnheader').nth(1)).toHaveText('Guest');
    await expect(write).toBeFocused();
    await page.keyboard.press('Space');
    await expect(write).not.toBeChecked();
    await expect(editor.locator('[data-lab-output]')).toHaveText(
      'Revoked Write recipes for Reviewer',
    );
  });

  test('UIC-PERMISSION-MATRIX-1.7 renders a window of 600 permissions and grants in it', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const root = demo(page, 'virtualized');
    const grid = root.getByRole('treegrid', { name: 'Many permissions' });
    await expect(root.locator('.ui-table')).toHaveAttribute('data-virtualized', 'true');
    const first = root.getByRole('checkbox', { name: 'Recipes task 1 for Editor', exact: true });
    await toggle(root, 'Recipes task 1 for Editor');
    await expect(first).toBeChecked();
    expect(await grid.getByRole('row').count()).toBeLessThan(60);
    await root
      .locator('.ui-table__scroll')
      .evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await root.scrollIntoViewIfNeeded();
    await expect(grid.getByRole('rowheader', { name: 'Settings task 600' })).toBeInViewport();
    // The focused row stays rendered; the others leave the document.
    await expect(grid.getByRole('rowheader', { name: 'Recipes task 4', exact: true })).toHaveCount(
      0,
    );
    expect(await grid.getByRole('row').count()).toBeLessThan(60);
    await lab.expectAccessible('[data-lab-demo="virtualized"]');
  });
});
