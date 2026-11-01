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
