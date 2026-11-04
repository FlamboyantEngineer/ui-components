import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
/** Presses a checkbox through its label, which the drawn box covers. */
const toggle = (scope: Locator, name: string) =>
  scope
    .locator('label', { has: scope.page().getByRole('checkbox', { name, exact: true }) })
    .click();

/**
 * How far each rendered checkbox's centre sits from its column's centre and from its row's
 * middle, the largest over the rendered rows, and how many checkboxes were measured.
 */
const checkboxOffsets = (root: Locator) =>
  root.evaluate((element) => {
    const columns = [...element.querySelectorAll('[role="columnheader"]')].map((header) =>
      header.getBoundingClientRect(),
    );
    let across = 0;
    let down = 0;
    let count = 0;
    for (const row of element.querySelectorAll('[role="row"]')) {
      const rowBox = row.getBoundingClientRect();
      if (rowBox.height === 0) continue;
      for (const box of row.querySelectorAll('.ui-checkbox__box')) {
        const rect = box.getBoundingClientRect();
        const centre = rect.left + rect.width / 2;
        const column = columns.find((header) => header.left <= centre && centre <= header.right);
        if (!column) continue;
        across = Math.max(across, Math.abs(centre - (column.left + column.width / 2)));
        down = Math.max(
          down,
          Math.abs(rect.top + rect.height / 2 - (rowBox.top + rowBox.height / 2)),
        );
        count += 1;
      }
    }
    return { across, down, count };
  });

const expectAligned = async (root: Locator, where: string) => {
  const offsets = await checkboxOffsets(root);
  expect(offsets.count, where).toBeGreaterThan(8);
  expect(offsets.across, where).toBeLessThan(1);
  expect(offsets.down, where).toBeLessThan(1);
};

test.describe('Permission Matrix lab', () => {
  test('UIC-PERMISSION-MATRIX-1.1 UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-1.3 UIC-PERMISSION-MATRIX-2.2 UIC-PERMISSION-MATRIX-2.4 UIC-PERMISSION-MATRIX-3.1 shows groups, inherited, read-only and dirty cells', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const cell = (state: string) => matrixCell(page, state);
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

  test('UIC-PERMISSION-MATRIX-2.4 applies a change made outside the matrix', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const editor = demo(page, 'editor');
    const output = editor.locator('[data-lab-output]');
    await editor.getByRole('button', { name: 'Grant all Photos to Guest' }).click();
    await expect(output).toHaveText(
      'Applied outside: Granted Upload photos, Delete photos for Guest',
    );
    await expect(editor.getByRole('checkbox', { name: 'All Photos for Guest' })).toBeChecked();
    await editor.getByRole('button', { name: 'Revoke all Recipes from Editor' }).click();
    await expect(output).toHaveText(
      'Applied outside: Revoked Read recipes, Write recipes, Publish recipes for Editor',
    );
    await expect(
      editor.getByRole('checkbox', { name: 'All Recipes for Editor' }),
    ).not.toBeChecked();
    // Grants the changes do not name stay.
    await expect(editor.getByRole('checkbox', { name: 'Upload photos for Editor' })).toBeChecked();
    await expect(editor.getByRole('checkbox', { name: 'Read recipes for Reviewer' })).toBeChecked();
    await expect(editor.locator('.ui-permission-matrix__grant[data-dirty]')).toHaveCount(4);
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

  test('UIC-PERMISSION-MATRIX-1.8 keeps the focused group checkbox and collapsed groups on their groups when groups reorder', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    const editor = demo(page, 'editor');
    await editor.getByRole('button', { name: /^Collapse .*Photos/ }).click();
    await expect(editor.getByRole('checkbox', { name: 'Upload photos for Editor' })).toHaveCount(0);
    await editor.getByRole('button', { name: 'Reverse groups in 1.5 seconds' }).click();
    await toggle(editor, 'All Recipes for Editor');
    const recipes = editor.getByRole('checkbox', { name: 'All Recipes for Editor' });
    await expect(recipes).toBeFocused();
    await expect(editor.locator('[data-lab-output]')).toHaveText(
      'Granted Read recipes, Write recipes, Publish recipes for Editor',
    );
    await expect(editor.getByRole('checkbox').first()).toHaveAccessibleName(
      'All Settings for Administrator',
    );
    await expect(recipes).toBeFocused();
    await expect(editor.getByRole('checkbox', { name: 'Upload photos for Editor' })).toHaveCount(0);
    await expect(
      editor.getByRole('checkbox', { name: 'Edit site settings for Editor' }),
    ).toBeVisible();
    await page.keyboard.press('Space');
    await expect(editor.locator('[data-lab-output]')).toHaveText(
      'Revoked Read recipes, Write recipes, Publish recipes for Editor',
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

  test('UIC-PERMISSION-MATRIX-1.7 centres every checkbox in its role column and row', async ({
    page,
    lab,
  }) => {
    await lab.open('permission-matrix');
    await expectAligned(demo(page, 'editor'), 'not virtualized');
    const root = demo(page, 'virtualized');
    // Grant, group and inherited (read-only role) checkboxes, checked and dirty.
    await toggle(root, 'Recipes task 1 for Editor');
    await expectAligned(root, 'virtualized');
    const scroll = root.locator('.ui-table__scroll');
    await scroll.evaluate((node) => node.scrollTo({ top: node.scrollHeight / 2 }));
    await expect(root.getByRole('rowheader', { name: /task 3\d\d$/ }).first()).toBeInViewport();
    await expectAligned(root, 'after scrolling');
    await scroll.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await expect(root.getByRole('rowheader', { name: 'Settings task 600' })).toBeVisible();
    await expectAligned(root, 'at the end');
    await root.evaluate((node) => {
      node.setAttribute('dir', 'rtl');
      (node as HTMLElement).style.width = '720px';
    });
    await expectAligned(root, 'right to left, narrower');
  });
});
