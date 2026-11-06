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

/** The rendered body rows' tops and heights, in order, relative to the scroll area. */
async function rowBoxes(root: Locator) {
  return root.locator('.ui-table__scroll').evaluate((scroll) => {
    const top = scroll.getBoundingClientRect().top;
    return [...scroll.querySelectorAll('.ui-table__body [role="row"]')]
      .map((row) => {
        const box = row.parentElement?.getBoundingClientRect() ?? row.getBoundingClientRect();
        return { name: row.textContent, top: box.top - top, height: box.height };
      })
      .sort((a, b) => a.top - b.top);
  });
}

function expectStacked(rows: { top: number; height: number }[]) {
  expect(rows.length).toBeGreaterThan(3);
  for (const [index, row] of rows.entries()) {
    const next = rows[index + 1];
    if (next) expect(next.top).toBeCloseTo(row.top + row.height, 0);
  }
}

const notesRow = (root: Locator, name: string) =>
  root.getByRole('row', { name: `Expand ${name}`, exact: true });

test.describe('Virtualized measured rows', () => {
  test('UIC-TABLE-7.5 gives wrapped rows their height and stacks rows without gaps', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    await expect(root.locator('.ui-table')).toHaveAttribute('data-measured-rows', 'true');
    const one = await box(notesRow(root, 'Note 1'));
    const three = await box(notesRow(root, 'Note 3'));
    expect(three.height).toBeGreaterThan(one.height);
    expectStacked(await rowBoxes(root));
    for (const top of [4000, 15_000, 'end'] as const) {
      await scrollTo(root, top);
      await expect.poll(async () => (await rowBoxes(root)).length).toBeGreaterThan(3);
      expectStacked(await rowBoxes(root));
    }
    await expect(notesRow(root, 'Note 1000')).toBeVisible();
    const last = await box(notesRow(root, 'Note 1000'));
    const summary = await box(root.getByRole('row', { name: 'Summary' }));
    expect(summary.y).toBeCloseTo(last.y + last.height, 0);
  });

  test('UIC-TABLE-7.5 UIC-TABLE-9.2 measures an opened detail row', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    await root.getByRole('button', { name: 'Expand Note 2' }).click();
    const detail = root.getByText(/^Note 2 details/);
    await expect(detail).toBeVisible();
    const rows = await rowBoxes(root);
    expectStacked(rows);
    const opened = rows.find((row) => row.name?.startsWith('Note 2 details'));
    expect(opened?.height).toBeGreaterThan(40);
  });

  test('UIC-TABLE-7.5 measures rows again after a resize and new content', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    const before = (await box(notesRow(root, 'Note 2'))).height;
    const header = root.getByRole('columnheader', { name: /^Note/ });
    await header.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    for (let step = 0; step < 60; step += 1) await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => (await box(notesRow(root, 'Note 2'))).height)
      .toBeGreaterThan(before);
    expectStacked(await rowBoxes(root));
    const resized = (await box(notesRow(root, 'Note 2'))).height;
    await page.getByRole('button', { name: 'Lengthen the notes' }).click();
    await expect
      .poll(async () => (await box(notesRow(root, 'Note 2'))).height)
      .toBeGreaterThan(resized);
    expectStacked(await rowBoxes(root));
  });

  test('UIC-TABLE-7.5 keeps measured heights when the reader scrolls back', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    const three = (await box(notesRow(root, 'Note 3'))).height;
    for (const top of [2000, 12_000, 0] as const) {
      await scrollTo(root, top);
      await expect.poll(async () => (await rowBoxes(root)).length).toBeGreaterThan(3);
    }
    await expect(notesRow(root, 'Note 3')).toBeVisible();
    expect((await box(notesRow(root, 'Note 3'))).height).toBe(three);
    expectStacked(await rowBoxes(root));
  });

  test('UIC-TABLE-7.5 switches between fixed and measured rows', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    await page.getByRole('button', { name: 'Use fixed rows' }).click();
    await expect(root.locator('.ui-table')).not.toHaveAttribute('data-measured-rows');
    await expect.poll(async () => (await box(notesRow(root, 'Note 3'))).height).toBe(40);
    await page.getByRole('button', { name: 'Use measured rows' }).click();
    await expect.poll(async () => (await box(notesRow(root, 'Note 3'))).height).toBeGreaterThan(40);
    expectStacked(await rowBoxes(root));
  });

  test('UIC-TABLE-7.5 UIC-TABLE-12.1 moves through measured rows from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized-measured');
    await root.scrollIntoViewIfNeeded();
    await root.getByRole('gridcell', { name: 'One line' }).first().click();
    for (let step = 0; step < 12; step += 1) await page.keyboard.press('ArrowDown');
    await expect(notesRow(root, 'Note 13')).toBeInViewport();
    await page.keyboard.press('Control+End');
    const summary = root.getByRole('row', { name: 'Summary' });
    await expect(summary.locator(':focus')).toHaveCount(1);
    await expect(summary).toBeInViewport();
    await page.keyboard.press('ArrowUp');
    await expect(notesRow(root, 'Note 1000')).toBeInViewport();
  });
});
