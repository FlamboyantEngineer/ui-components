import { expect, test } from './fixtures.js';

test.describe('Timeline lab', () => {
  test('UIC-TIMELINE-1.1 UIC-TIMELINE-1.3 UIC-TIMELINE-1.5 lays out every zoom level on the scale', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const cells = page.locator('table[data-lab-matrix="scale mode"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 4);
    const day = page.locator('[data-lab-cell="scale=day mode=fixed"]');
    await expect(day.locator('.ui-timeline')).toHaveAttribute('data-scale', 'day');
    const shopping = await day.getByRole('button', { name: 'Shopping' }).boundingBox();
    const stew = await day.getByRole('button', { name: 'Slow stew' }).boundingBox();
    expect(Math.round(shopping?.width ?? 0)).toBe(5 * 32);
    expect(Math.round(stew?.width ?? 0)).toBe(14 * 32);
    await expect(day.locator('[data-tier="major"] .ui-timeline__scale-cell')).toHaveText([
      'March 2026',
    ]);
    const quarter = page.locator('[data-lab-cell="scale=quarter mode=fixed"]');
    await expect(quarter.locator('[data-tier="minor"] .ui-timeline__scale-cell')).toHaveText([
      'Q1',
      'Q2',
      'Q3',
      'Q4',
    ]);
    const progress = day.locator(
      '.ui-timeline__item[aria-label="Chopping"] .ui-timeline__progress',
    );
    expect(Math.round((await progress.boundingBox())?.width ?? 0)).toBe(5 * 16 - 1);
    await lab.expectAccessible();
  });

  test('UIC-TIMELINE-1.7 UIC-TIMELINE-1.8 UIC-TIMELINE-4.2 draws connectors, today and descriptions', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await expect(plan.locator('.ui-timeline__connector')).toHaveCount(9);
    await expect(plan.locator('.ui-timeline__connector[data-conflict]')).toHaveCount(1);
    const today = await plan.locator('.ui-timeline__today').boundingBox();
    const quotes = await plan.getByRole('button', { name: 'Collect quotes' }).boundingBox();
    expect(today!.x).toBeGreaterThan(quotes!.x + quotes!.width);
    const rewire = plan.getByRole('button', { name: 'Rewire' });
    await expect(rewire).toHaveAttribute('data-conflict', 'true');
    await expect(rewire).toHaveAccessibleDescription(
      'Mar 19, 2026 to Mar 27, 2026. Depends on Strip kitchen. Starts before an item it depends on ends. Arrow keys move it; Shift and arrow keys change its end',
    );
    await expect(plan.getByRole('group', { name: 'Electrical' })).toContainText('Rewire');
  });

  test('UIC-TIMELINE-2.1 moves and resizes a bar by dragging', async ({ page, lab }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const bar = plan.getByRole('button', { name: 'Strip kitchen' });
    await bar.scrollIntoViewIfNeeded();
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, { steps: 5 });
    await expect(bar).toHaveAttribute('data-dragging', 'true');
    await page.mouse.up();
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Strip kitchen: Mar 18, 2026 to Mar 22, 2026',
    );
    await expect(bar).not.toHaveAttribute('data-dragging');
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 0');
    const moved = (await bar.boundingBox())!;
    expect(Math.round(moved.x - box.x)).toBe(32);
    await page.mouse.move(moved.x + moved.width - 2, moved.y + moved.height / 2);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width + 30, moved.y + moved.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Strip kitchen: Mar 18, 2026 to Mar 24, 2026',
    );
  });

  test('UIC-TIMELINE-2.2 UIC-TIMELINE-2.4 edits by keyboard and selects items', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const rewire = plan.getByRole('button', { name: 'Rewire' });
    await rewire.focus();
    await page.keyboard.press('ArrowRight');
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Rewire: Mar 26, 2026 to Apr 3, 2026',
    );
    await expect(rewire).not.toHaveAttribute('data-conflict');
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Rewire: Mar 26, 2026 to Mar 27, 2026',
    );
    await expect(rewire).toBeFocused();
    await page.keyboard.press('Enter');
    await plan.getByRole('button', { name: 'Paint walls' }).click();
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 2');
    await expect(rewire).toHaveAttribute('data-selected', 'true');
  });

  test('UIC-TIMELINE-1.4 UIC-TIMELINE-1.9 collapses groups and keeps the scale and names pinned', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await plan.getByRole('radio', { name: 'Day' }).click();
    await expect(plan.locator('.ui-timeline')).toHaveAttribute('data-scale', 'day');
    const viewport = plan.locator('.ui-timeline__viewport');
    const header = plan.locator('.ui-timeline__header');
    const list = plan.locator('.ui-timeline__list');
    const before = { header: (await header.boundingBox())!, list: (await list.boundingBox())! };
    await viewport.evaluate((node) => node.scrollTo({ left: 600, top: 120 }));
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const after = { header: (await header.boundingBox())!, list: (await list.boundingBox())! };
    expect(after.header.y).toBeCloseTo(before.header.y, 0);
    expect(after.list.x).toBeCloseTo(before.list.x, 0);
    await viewport.evaluate((node) => node.scrollTo({ left: 0, top: 0 }));
    await expect(plan.locator('.ui-timeline__row')).toHaveCount(11);
    await plan.getByRole('button', { name: 'Build', exact: true }).click();
    await expect(plan.locator('.ui-timeline__row')).toHaveCount(7);
    await expect(plan.getByRole('button', { name: 'Rewire' })).toHaveCount(0);
    await expect(plan.locator('.ui-timeline__connector')).toHaveCount(3);
  });

  test('UIC-TIMELINE-3.1 UIC-TIMELINE-4.1 switches to the table view', async ({ page, lab }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await plan.getByRole('radio', { name: 'Table' }).click();
    await expect(plan.locator('.ui-timeline')).toHaveAttribute('data-view', 'table');
    const table = plan.getByRole('grid', { name: 'Kitchen renovation' });
    await expect(table.getByRole('rowheader')).toHaveCount(9);
    await expect(table.getByRole('row').nth(1)).toContainText('Measure rooms');
    await expect(table.getByRole('row').nth(1)).toContainText('100%');
    await table.getByRole('row').nth(2).locator('.ui-table__checkbox').click();
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 1');
    await lab.expectAccessible('[data-lab-demo="plan"]');
  });
});
