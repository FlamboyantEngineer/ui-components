import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, name: string) => page.locator(`[data-lab="${name}"]`);

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error('no box');
  return found;
}

async function scrollTo(root: Locator, top: number | 'end') {
  await root
    .locator('.ui-table__scroll')
    .evaluate((node, to) => node.scrollTo({ top: to === 'end' ? node.scrollHeight : to }), top);
}

test.describe('Virtualized table layout', () => {
  test('UIC-TABLE-8.7 UIC-TABLE-7.3 lowers the column headers and rows below the group row', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-groups');
    const grid = root.getByRole('grid', { name: 'Readings, virtualized' });
    const group = await box(grid.getByRole('columnheader', { name: 'Range' }));
    const low = await box(grid.getByRole('columnheader', { name: /^Low/ }));
    const high = await box(grid.getByRole('columnheader', { name: /^High/ }));
    const first = await box(grid.getByRole('row', { name: /Reading 1\b/ }).first());
    expect(group.height).toBe(36);
    expect(low.y).toBeCloseTo(group.y + 36, 0);
    expect(low.x).toBeCloseTo(group.x, 0);
    expect(high.x + high.width).toBeCloseTo(group.x + group.width, 0);
    expect(first.y).toBeCloseTo(low.y + 36, 0);
  });

  test('UIC-TABLE-12.1 UIC-TABLE-7.3 keeps the summary in the document and under its columns', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-groups');
    const grid = root.getByRole('grid', { name: 'Readings, virtualized' });
    const summary = grid.getByRole('row', { name: 'Summary' });
    await expect(summary).toHaveCount(1);
    await expect(summary).not.toBeInViewport();
    await expect(summary.locator('.ui-table__footer-cell')).toHaveText([
      '',
      '2000 readings',
      '',
      '0',
      '99',
    ]);
    await scrollTo(root, 20_000);
    await expect(summary).toHaveCount(1);
    await scrollTo(root, 'end');
    await root.scrollIntoViewIfNeeded();
    await expect(grid.getByRole('rowheader', { name: 'Reading 2000' })).toBeInViewport();
    await expect(summary).toBeInViewport();
    const last = await box(grid.getByRole('row', { name: /Reading 2000/ }));
    const footer = await box(summary);
    expect(footer.y).toBeCloseTo(last.y + last.height, 0);
    const name = await box(grid.getByRole('columnheader', { name: /^Name/ }));
    const total = await box(summary.locator('.ui-table__footer-cell').nth(1));
    expect(total.x).toBeCloseTo(name.x, 0);
    expect(total.width).toBeCloseTo(name.width, 0);
  });

  test('UIC-TABLE-12.1 UIC-TABLE-4.1 moves the summary cells with a resized column', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-groups');
    const grid = root.getByRole('grid', { name: 'Readings, virtualized' });
    const header = grid.getByRole('columnheader', { name: /^Name/ });
    await header.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    for (let step = 0; step < 4; step += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await scrollTo(root, 'end');
    const summary = grid.getByRole('row', { name: 'Summary' });
    await expect(summary).toBeInViewport();
    const name = await box(header);
    const site = await box(grid.getByRole('columnheader', { name: /^Site/ }));
    const cells = summary.locator('.ui-table__footer-cell');
    expect((await box(cells.nth(1))).width).toBeCloseTo(name.width, 0);
    expect((await box(cells.nth(2))).x).toBeCloseTo(site.x, 0);
  });

  test('UIC-TABLE-12.1 UIC-TABLE-7.3 reaches the summary and the first row from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-groups');
    const grid = root.getByRole('grid', { name: 'Readings, virtualized' });
    await grid.getByRole('rowheader', { name: 'Reading 2', exact: true }).click();
    await page.keyboard.press('Control+End');
    const summary = grid.getByRole('row', { name: 'Summary' });
    await expect(summary.locator(':focus')).toHaveCount(1);
    await expect(summary).toBeInViewport();
    await page.keyboard.press('Control+Home');
    await expect(grid.getByRole('row', { name: /Reading 1\b/ }).first()).toBeInViewport();
    await page.keyboard.press('ArrowDown');
    await expect(grid.getByRole('row', { name: /Reading 2\b/ }).first()).toBeInViewport();
  });

  test('UIC-TABLE-2.1 UIC-TABLE-12.1 sorts and keeps the summary of every row', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-groups');
    const grid = root.getByRole('grid', { name: 'Readings, virtualized' });
    await grid.getByRole('columnheader', { name: /^High/ }).click();
    await grid.getByRole('columnheader', { name: /^High/ }).click();
    await expect(grid.getByRole('columnheader', { name: /^High/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await expect(
      grid.getByRole('row', { name: 'Summary' }).locator('.ui-table__footer-cell').nth(1),
    ).toHaveText('2000 readings');
  });
});
