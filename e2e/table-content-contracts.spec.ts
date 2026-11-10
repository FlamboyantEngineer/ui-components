import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const width = async (cell: Locator) => (await cell.boundingBox())?.width ?? 0;

async function dragHandle(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('The source and target must have layout boxes');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + Math.min(160, to.width / 2), to.y + to.height - 4, { steps: 8 });
  await page.mouse.up();
}

for (const virtualized of [false, true]) {
  test(`UIC-TABLE-4.5 content tracks fit headers and cells, grow and shrink, and leave flexible space (${virtualized ? 'virtualized' : 'standard'})`, async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab="content-widths"]');
    if (virtualized)
      await demo.getByRole('button', { name: 'Use virtualized layout', exact: true }).click();
    const grid = demo.getByRole('grid', { name: 'Content widths', exact: true });
    if (virtualized) await expect(demo.locator('.ui-table')).toHaveAttribute('data-virtualized');
    const name = grid.getByRole('columnheader', { name: /^(?:Name|A descriptive item name)/ });
    const note = grid.getByRole('columnheader', { name: 'Note', exact: true });
    await expect(name).toHaveAttribute('data-sizing', 'content');
    await expect(note).toHaveAttribute('data-sizing', 'flex');
    await expect.poll(() => width(name)).toBeGreaterThanOrEqual(80);
    const initial = await width(name);
    const initialFlexible = await width(note);
    expect(initialFlexible).toBeGreaterThan(initial + 100);
    await demo.getByRole('button', { name: 'Change content', exact: true }).click();
    await expect.poll(() => width(name)).toBeGreaterThan(initial + 100);
    await expect.poll(() => width(name)).toBeLessThanOrEqual(361);
    await expect.poll(() => width(note)).toBeLessThan(initialFlexible - 100);
    await demo.getByRole('button', { name: 'Change content', exact: true }).click();
    await expect.poll(() => width(name)).toBeLessThan(initial + 2);
    await demo.getByRole('button', { name: 'Change header', exact: true }).click();
    await expect.poll(() => width(name)).toBeGreaterThan(initial + 40);
    await expect(demo.getByRole('status', { name: 'Content column resize' })).toHaveText(
      'Not resized',
    );
    await lab.expectAccessible('[data-lab="content-widths"]');
  });
}

for (const virtualized of [false, true]) {
  test(`UIC-TABLE-4.5 content tracks keep their layout width under an ancestor scale or zoom (${virtualized ? 'virtualized' : 'standard'})`, async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab="content-widths"]');
    if (virtualized)
      await demo.getByRole('button', { name: 'Use virtualized layout', exact: true }).click();
    const name = demo.getByRole('columnheader', { name: /^Name/ });
    const layoutWidth = () => name.evaluate((cell) => (cell as HTMLElement).offsetWidth);
    await expect.poll(layoutWidth).toBeGreaterThanOrEqual(80);
    const settled = await layoutWidth();
    for (const [label, factor] of [
      ['Scale 0.5', 0.5],
      ['Scale 2', 2],
      ['Zoom 1.5', 1.5],
    ] as const) {
      await demo.getByRole('radio', { name: label }).click();
      // Measured again under the scale, as after a content change, the track keeps its width.
      await demo.getByRole('button', { name: 'Change content', exact: true }).click();
      await expect.poll(layoutWidth).toBeGreaterThan(settled + 100);
      await demo.getByRole('button', { name: 'Change content', exact: true }).click();
      await expect.poll(layoutWidth).toBe(settled);
      expect(Math.abs((await width(name)) - settled * factor)).toBeLessThan(2);
    }
    await demo.getByRole('radio', { name: 'Scale 1' }).click();
    await expect.poll(layoutWidth).toBe(settled);
  });
}

test('UIC-TABLE-4.3 UIC-TABLE-4.5 a resized content track stays fixed after updates and remounting', async ({
  page,
  lab,
}) => {
  await lab.open('table');
  const demo = page.locator('[data-lab="content-widths"]');
  const header = () => demo.getByRole('columnheader', { name: /^Name/ });
  await header().focus();
  await page.keyboard.press('ArrowRight');
  await expect(demo.getByRole('slider', { name: /^Resize Name/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(header()).toHaveAttribute('data-sizing', 'fixed');
  const resized = await width(header());
  await demo.getByRole('button', { name: 'Change content', exact: true }).click();
  await expect.poll(() => width(header())).toBe(resized);
  await demo.getByRole('button', { name: 'Unmount content table', exact: true }).click();
  await demo.getByRole('button', { name: 'Mount content table', exact: true }).click();
  await expect(header()).toHaveAttribute('data-sizing', 'fixed');
  await expect.poll(() => width(header())).toBe(resized);
});

test('UIC-TABLE-5.7 grouped pointer and keyboard moves stay inside the leaf group and preserve identities', async ({
  page,
  lab,
}) => {
  // This whole-lab flow can outlast the default budget on a loaded machine.
  test.slow();
  await lab.open('table');
  const demo = page.locator('[data-lab="grouped-reorder"]');
  const grid = demo.getByRole('treegrid', {
    name: 'Entries, reordered within groups',
    exact: true,
  });
  const moved = demo.getByRole('status', { name: 'Grouped move' });
  const row = (name: string) =>
    grid.getByRole('row').filter({
      has: page.getByRole('button', { name: `Drag ${name}`, exact: true }),
    });
  const pear = () => row('Pear');
  await expect(grid.getByRole('button', { name: 'Drag Basil', exact: true })).toHaveCount(0);
  await expect(grid.locator('.ui-table__group-row .ui-table__drag-handle')).toHaveCount(0);
  await dragHandle(page, grid.getByRole('button', { name: 'Drag Pear', exact: true }), row('Lime'));
  await expect(moved).toHaveText('pear after lime');
  await expect
    .poll(() =>
      grid
        .locator('.ui-table__row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-entry'))),
    )
    .toEqual(['lime', 'pear', 'basil', 'mint']);
  await expect(pear()).toHaveAttribute('data-entry', 'pear');
  await pear().focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(moved).toHaveText('pear after lime');
  await dragHandle(page, grid.getByRole('button', { name: 'Drag Pear', exact: true }), row('Mint'));
  await expect(moved).toHaveText('pear after lime');
  const handle = grid.getByRole('button', { name: 'Drag Pear', exact: true });
  await handle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(moved).toHaveText('pear after lime');
  await handle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(moved).toHaveText('pear before lime');
  await expect
    .poll(() =>
      grid
        .locator('.ui-table__row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-entry'))),
    )
    .toEqual(['pear', 'lime', 'basil', 'mint']);
  await lab.expectAccessible('[data-lab="grouped-reorder"]');
});
