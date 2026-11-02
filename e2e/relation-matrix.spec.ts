import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const cell = (matrix: Locator, row: number, column: number) =>
  matrix.locator(`[role="row"][aria-rowindex="${row + 2}"] > [aria-colindex="${column + 2}"]`);

test.describe('Relation Matrix lab', () => {
  test('UIC-RELATION-MATRIX-1.1 UIC-RELATION-MATRIX-1.2 UIC-RELATION-MATRIX-1.3 UIC-RELATION-MATRIX-1.4 UIC-RELATION-MATRIX-4.1 shows counts, coverage gaps and marks', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const matrix = matrixCell(page, 'cells=read only labels=rotated').getByRole('grid', {
      name: 'Coverage, rotated, read only',
    });
    await expect(matrix.getByRole('columnheader')).toHaveCount(5);
    await expect(matrix.getByRole('rowheader')).toHaveCount(4);
    await expect(matrix.getByRole('rowheader').first()).toContainText('1 relation');
    const uncovered = matrix.getByRole('rowheader').nth(3);
    await expect(uncovered).toHaveAttribute('data-uncovered', 'true');
    await expect(uncovered).toContainText('No relations');
    await expect(matrix.getByRole('columnheader').nth(4)).toHaveAttribute('data-uncovered', 'true');
    await expect(cell(matrix, 0, 0)).toHaveAttribute('data-tone', 'success');
    await expect(cell(matrix, 0, 0)).toHaveText('Verifies');
    await expect(cell(matrix, 2, 2)).toHaveAttribute('data-tone', 'danger');
    await expect(matrix).toHaveAttribute('data-column-labels', 'rotated');
    const truncated = matrixCell(page, 'cells=read only labels=truncated').getByRole('grid');
    await expect(truncated).toHaveAttribute('data-column-labels', 'truncated');
    const header = truncated.getByRole('columnheader').nth(1);
    await header.focus();
    await expect(page.getByRole('tooltip')).toHaveText('Test 1: Passkey happy path');
    await lab.expectAccessible();
  });

  test('UIC-RELATION-MATRIX-2.4 UIC-RELATION-MATRIX-2.5 edits relations, rows and columns from context menus', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'editable');
    const matrix = section.getByRole('grid', { name: 'Editable requirements by test' });
    const output = section.locator('[data-lab-output]');
    const rowHeader = (index: number) => matrix.getByRole('rowheader').nth(index);
    // An empty cell: set Blocked, drawn with a cross.
    await cell(matrix, 0, 1).click({ button: 'right' });
    const menu = page.getByRole('menu', {
      name: 'Relation of Requirement 1: Sign in with a passkey and Test 2: Expired reset link',
    });
    await expect(menu.getByRole('menuitem', { name: 'Remove relation' })).toBeDisabled();
    await menu.getByRole('menuitemcheckbox', { name: 'Blocked' }).click();
    await expect(cell(matrix, 0, 1)).toHaveAttribute('data-kind', 'blocked');
    await expect(cell(matrix, 0, 1).locator('[data-glyph="close"]')).toBeVisible();
    await expect(rowHeader(0)).toContainText('2 relations');
    await expect(cell(matrix, 0, 1)).toBeFocused();
    // From the keyboard: change it, then remove it.
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitemcheckbox', { name: 'Partly verifies' }).click();
    await expect(cell(matrix, 0, 1)).toHaveAttribute('data-kind', 'partial');
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Remove relation' }).click();
    await expect(cell(matrix, 0, 1)).not.toHaveAttribute('data-related');
    await expect(rowHeader(0)).toContainText('1 relation');
    await expect(output).toHaveText('req-1 × test-2: removed');

    // Rows: the first cannot move up; move it down, insert one above, then remove it.
    await rowHeader(0).click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
    await page.getByRole('menuitem', { name: 'Move down' }).click();
    await expect(rowHeader(1)).toContainText('Requirement 1');
    await expect(rowHeader(1)).toBeFocused();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Insert above' }).click();
    await expect(rowHeader(1)).toContainText('New requirement 1');
    await expect(rowHeader(1)).toContainText('No relations');
    await rowHeader(2).click({ button: 'right' });
    await page
      .getByRole('menuitem', { name: 'Remove Requirement 1: Sign in with a passkey' })
      .click();
    await expect(matrix.getByRole('rowheader')).toHaveCount(4);
    await expect(matrix.getByRole('columnheader').nth(1)).toContainText('No relations');
    await expect(matrix.locator('[tabindex="0"]')).toBeFocused();

    // Columns: insert one to the right of the first, then the last cannot move right.
    const columnHeader = (index: number) => matrix.getByRole('columnheader').nth(index + 1);
    await columnHeader(0).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Insert right' }).click();
    await expect(columnHeader(1)).toContainText('New test 2');
    await columnHeader(4).click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Move right' })).toBeDisabled();
    await page.getByRole('menuitem', { name: 'Move left' }).click();
    await expect(columnHeader(3)).toContainText('Test 4');
    await expect(output).toHaveText('column test-4: move-before');
  });

  test('UIC-RELATION-MATRIX-2.5 offers only the header actions given', async ({ page, lab }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'axis-subsets');
    const choose = (name: string) => section.getByRole('radio', { name }).click();
    const firstRow = () => section.getByRole('rowheader').first();
    const items = () => page.getByRole('menu').getByRole('menuitem');

    await firstRow().click({ button: 'right' });
    await expect(items()).toHaveText(['Move up', 'Move down']);
    await page.getByRole('menuitem', { name: 'Move down' }).click();
    await expect(section.locator('[data-lab-output]')).toHaveText('row req-1: move-after');

    await choose('Insert and remove');
    await firstRow().click({ button: 'right' });
    await expect(items()).toHaveText(['Insert above', 'Insert below', /^Remove /]);
    await page.getByRole('menuitem', { name: 'Insert below' }).click();
    await expect(section.locator('[data-lab-output]')).toHaveText('row req-1: insert-after');

    await choose('None');
    await firstRow().click({ button: 'right' });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(section.locator('[data-lab-output]')).toHaveText('No change yet');
  });

  test('UIC-RELATION-MATRIX-3.1 keeps headers and cells in line at a taller row height', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'large');
    await section.getByRole('radio', { name: '48 pixels' }).click();
    const matrix = section.getByRole('grid', { name: 'Large matrix' });
    await matrix.evaluate((node) => {
      node.scrollTop = 48 * 1000;
    });
    const row = matrix.locator('[role="row"][aria-rowindex="1003"]');
    await expect(row).toBeVisible();
    const header = await row.getByRole('rowheader').boundingBox();
    const first = await row.locator('[aria-colindex="2"]').boundingBox();
    expect(Math.round(header?.height ?? 0)).toBe(48);
    expect(Math.abs((first?.y ?? 0) - (header?.y ?? 0))).toBeLessThan(1);
    expect(Math.round(first?.height ?? 0)).toBe(48);
    await row.locator('[aria-colindex="2"]').click();
    await page.keyboard.press('ArrowDown');
    const below = matrix.locator('[role="row"][aria-rowindex="1004"] > [aria-colindex="2"]');
    await expect(below).toBeFocused();
    const next = await below.boundingBox();
    expect(Math.round((next?.y ?? 0) - (first?.y ?? 0))).toBe(48);
  });

  test('UIC-RELATION-MATRIX-2.4 edits a cell of a windowed matrix far from the start', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const matrix = demo(page, 'large').getByRole('grid', { name: 'Large matrix' });
    await matrix.evaluate((node) => {
      node.scrollTop = 32 * 1500;
      node.scrollLeft = 72 * 300;
    });
    const target = matrix.locator('[role="row"][aria-rowindex="1503"] > [aria-colindex="303"]');
    await expect(target).toBeVisible();
    await target.click({ button: 'right' });
    await expect(
      page.getByRole('menu', { name: 'Relation of Requirement 1502 and Test 302' }),
    ).toBeVisible();
    await page.getByRole('menuitemcheckbox', { name: 'Blocked' }).click();
    await expect(target).toHaveAttribute('data-kind', 'blocked');
  });

  test('UIC-RELATION-MATRIX-2.1 UIC-RELATION-MATRIX-2.2 moves by keyboard and toggles relations', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'traceability');
    const matrix = section.getByRole('grid', { name: 'Requirements by test' });
    await cell(matrix, 0, 0).click();
    await expect(section.locator('[data-lab-output]')).toHaveText('Removed Requirement 1 × Test 1');
    await expect(cell(matrix, 0, 0)).not.toHaveAttribute('data-related');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(cell(matrix, 1, 1)).toBeFocused();
    await expect(matrix.getByRole('rowheader').nth(1)).toHaveAttribute('data-current', 'true');
    await expect(matrix.getByRole('columnheader').nth(2)).toHaveAttribute('data-current', 'true');
    await page.keyboard.press('Enter');
    await expect(section.locator('[data-lab-output]')).toHaveText('Removed Requirement 2 × Test 2');
    await section.getByRole('radio', { name: 'Blocked' }).click();
    await cell(matrix, 4, 4).click();
    await page.keyboard.press('Space');
    await expect(cell(matrix, 4, 4)).not.toHaveAttribute('data-related');
    await page.keyboard.press('Space');
    await expect(cell(matrix, 4, 4)).toHaveAttribute('data-tone', 'danger');
    await expect(section.locator('[data-lab-output]')).toHaveText(
      'Added Requirement 5 × Test 5 (blocked)',
    );
    await expect(matrix.getByRole('rowheader').nth(4)).not.toHaveAttribute('data-uncovered');
    await page.keyboard.press('Control+Home');
    await expect(matrix.getByRole('columnheader').first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(matrix.getByRole('columnheader').last()).toBeFocused();
  });

  test('UIC-RELATION-MATRIX-2.3 keeps acting on the focused cell as its row moves', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'sorted');
    const matrix = section.getByRole('grid', { name: 'Least covered requirements first' });
    const output = section.locator('[data-lab-output]');
    // Requirement 5 has no relation, so it comes first; adding one moves it after the other
    // requirements with one relation.
    await expect(matrix.getByRole('rowheader').first()).toContainText('Requirement 5');
    await cell(matrix, 0, 0).click();
    await expect(output).toHaveText('Added Requirement 5 × Test 1 (verifies)');
    await expect(matrix.getByRole('rowheader').nth(3)).toContainText('Requirement 5');
    const moved = cell(matrix, 3, 0);
    await expect(moved).toBeFocused();
    await expect(moved).toHaveAttribute('data-related', 'true');
    await expect(moved).toHaveAttribute('tabindex', '0');
    await expect(matrix.getByRole('rowheader').nth(3)).toHaveAttribute('data-current', 'true');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Removed Requirement 5 × Test 1');
    await expect(matrix.getByRole('rowheader').first()).toContainText('Requirement 5');
    await expect(cell(matrix, 0, 0)).toBeFocused();
    await expect(cell(matrix, 0, 0)).not.toHaveAttribute('data-related');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Added Requirement 2 × Test 1 (verifies)');
  });

  test('UIC-RELATION-MATRIX-3.1 windows both axes of a large matrix', async ({ page, lab }) => {
    await lab.open('relation-matrix');
    const matrix = demo(page, 'large').getByRole('grid', { name: 'Large matrix' });
    await expect(matrix).toHaveAttribute('data-virtualized', 'true');
    await expect(matrix).toHaveAttribute('aria-rowcount', '2001');
    await expect(cell(matrix, 0, 0)).toBeVisible();
    expect(await matrix.locator('[role="row"]').count()).toBeLessThan(40);
    expect(await matrix.getByRole('columnheader').count()).toBeLessThan(30);
    await cell(matrix, 0, 0).click();
    await page.keyboard.press('Control+End');
    const last = cell(matrix, 1999, 399);
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await expect(
      matrix.getByRole('rowheader').filter({ hasText: 'Requirement 2000' }),
    ).toBeVisible();
    await expect(matrix.getByRole('columnheader').filter({ hasText: 'Test 400' })).toBeVisible();
    // The first row is out of view and no longer focused, so it is not rendered.
    await expect(matrix.getByRole('rowheader').filter({ hasText: /^Requirement 1\D/ })).toHaveCount(
      0,
    );
    await page.keyboard.press('PageUp');
    await expect(cell(matrix, 1999, 399)).not.toBeFocused();
    await expect(matrix.locator(':focus')).toHaveAttribute('aria-colindex', '401');
    await matrix.evaluate((element) => element.scrollTo({ top: 32 * 1000 }));
    await expect(
      matrix.getByRole('rowheader').filter({ hasText: 'Requirement 1001' }),
    ).toBeVisible();
    expect(await matrix.locator('[role="row"]').count()).toBeLessThan(40);
  });

  test('UIC-RELATION-MATRIX-3.1 windows from the scroll position when windowing turns on', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const section = demo(page, 'switched');
    const matrix = section.getByRole('grid', { name: 'Switched matrix' });
    await matrix.scrollIntoViewIfNeeded();
    await cell(matrix, 0, 0).click();
    await matrix.evaluate((element) => element.scrollTo({ top: 1600, left: 2000 }));
    const headersInView = () =>
      matrix.evaluate((element) => {
        const view = element.getBoundingClientRect();
        return [...element.querySelectorAll('[role="rowheader"]')].filter((header) => {
          const box = header.getBoundingClientRect();
          return box.bottom > view.top + 1 && box.top < view.bottom - 1;
        }).length;
      });
    expect(await headersInView()).toBeGreaterThan(1);
    await section.getByRole('button', { name: 'Window rows and columns' }).click();
    await expect(matrix).toHaveAttribute('data-virtualized', 'true');
    expect(await headersInView()).toBeGreaterThan(1);
    expect(await matrix.locator('[role="row"]').count()).toBeLessThan(40);
    expect(await matrix.locator('[tabindex="0"]').count()).toBe(1);
    await expect(cell(matrix, 0, 0)).toHaveAttribute('tabindex', '0');
    await section.getByRole('button', { name: 'Render every row and column' }).click();
    await expect(matrix).not.toHaveAttribute('data-virtualized');
    expect(await headersInView()).toBeGreaterThan(1);
    await lab.expectAccessible();
  });
});
