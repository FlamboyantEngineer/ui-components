import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

const cell = (section: string, id: string) =>
  `[data-lab-section="${section}"] [data-lab-cell="${id}"]`;

test.describe('Layout lab', () => {
  test('UIC-LAYOUT-1.1 UIC-LAYOUT-2.1 stacks children in a column with the reference gaps', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    for (const [space, gap] of [
      ['none', 0],
      ['xs', 4],
      ['compact', 6],
      ['sm', 8],
      ['md', 16],
      ['lg', 24],
    ] as const) {
      const items = page.locator(`${cell('Stack', `space=${space} align=stretch`)} .ui-stack > *`);
      const first = await box(items.nth(0));
      const second = await box(items.nth(1));
      expect(second.x).toBe(first.x);
      expect(second.width).toBe(first.width);
      expect(Math.round(second.y - (first.y + first.height))).toBe(gap);
    }
    const start = page.locator(`${cell('Stack', 'space=md align=start')} .ui-stack > *`);
    expect((await box(start.nth(0))).width).toBeLessThan((await box(start.nth(2))).width + 40);
    await lab.expectAccessible();
  });

  test('UIC-LAYOUT-2.2 distributes, wraps and aligns cluster items', async ({ page, lab }) => {
    await lab.open('layout');
    const between = page.locator(cell('Cluster', 'justify=between wrap=nowrap'));
    const row = await box(between.locator('.ui-cluster'));
    const items = between.locator('.ui-cluster > *');
    expect(Math.round((await box(items.first())).x)).toBe(Math.round(row.x));
    const last = await box(items.last());
    expect(Math.round(last.x + last.width)).toBe(Math.round(row.x + row.width));

    const wrapping = page.locator(`${cell('Cluster', 'justify=start wrap=wrap')} .ui-cluster > *`);
    expect((await box(wrapping.nth(4))).y).toBeGreaterThan((await box(wrapping.nth(0))).y + 20);
    const single = page.locator(`${cell('Cluster', 'justify=start wrap=nowrap')} .ui-cluster > *`);
    const centres = await Promise.all(
      [0, 1, 4].map(async (index) => {
        const rect = await box(single.nth(index));
        return Math.round(rect.y + rect.height / 2);
      }),
    );
    expect(new Set(centres).size).toBe(1);

    const inline = page.locator(cell('Cluster', 'align=center flow=inline'));
    const block = page.locator(cell('Cluster', 'align=center flow=block'));
    expect(
      await inline.locator('.ui-cluster').evaluate((node) => getComputedStyle(node).display),
    ).toBe('inline-flex');
    expect((await box(inline.locator('.ui-cluster'))).x).toBeGreaterThan(
      (await box(block.locator('.ui-cluster'))).x + 20,
    );
  });

  test('UIC-LAYOUT-2.3 lays out grid columns and fits columns to the width', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const three = page.locator(`${cell('Grid', 'columns=3 space=md')} .ui-grid > *`);
    const [a, b, c, d] = await Promise.all([0, 1, 2, 3].map((index) => box(three.nth(index))));
    expect(a!.y).toBe(b!.y);
    expect(b!.y).toBe(c!.y);
    expect(d!.x).toBe(a!.x);
    expect(d!.y).toBeGreaterThan(a!.y);
    expect(Math.round(b!.x - (a!.x + a!.width))).toBe(16);

    for (const [width, columns] of [
      ['360', 2],
      ['720', 4],
    ] as const) {
      const items = page.locator(
        `${cell('Grid', `minColumnWidth=sm width=${width}`)} .ui-grid > *`,
      );
      const lefts = new Set<number>();
      for (let index = 0; index < 6; index += 1)
        lefts.add(Math.round((await box(items.nth(index))).x));
      expect(lefts.size).toBe(columns);
    }
    const xl = page.locator(`${cell('Grid', 'minColumnWidth=xl width=720')} .ui-grid > *`);
    expect((await box(xl.nth(1))).x).toBe((await box(xl.nth(0))).x);
  });

  test('UIC-LAYOUT-2.4 centres pages at their maximum width', async ({ page, lab }) => {
    await lab.open('layout');
    for (const [width, maximum] of [
      ['narrow', 720],
      ['reading', 960],
    ] as const) {
      const pageBox = await box(page.locator(`[data-lab-page="${width}"]`));
      const host = await box(page.locator(`[data-lab-page="${width}"]`).locator('..'));
      expect(pageBox.width).toBe(maximum);
      expect(
        Math.abs(pageBox.x - host.x - (host.x + host.width - pageBox.x - pageBox.width)),
      ).toBeLessThanOrEqual(1);
    }
    const full = page.locator('[data-lab-page="full"]');
    expect((await box(full)).width).toBe((await box(full.locator('..'))).width);
    const gutter = page.locator(cell('Page', 'width=full gutter=lg'));
    const pageBox = await box(gutter.locator('.ui-page'));
    const content = await box(gutter.locator('.ui-page > *'));
    expect(Math.round(content.x - pageBox.x)).toBe(24);
  });

  test('UIC-LAYOUT-2.5 grows, fills and clips', async ({ page, lab }) => {
    await lab.open('layout');
    const width = async (grow: string) =>
      (await box(page.locator(`${cell('Containment', `grow=${grow} host=400px row`)} .ui-stack`)))
        .width;
    const fixed = await box(
      page.locator(`${cell('Containment', 'grow=true host=400px row')} .ui-flex-row > span`),
    );
    expect(Math.round((await width('true')) + fixed.width)).toBe(400);
    expect(Math.round((await width('auto')) + fixed.width)).toBe(400);
    expect(await width('false')).toBeLessThan(100);
    expect(await width('none')).toBeLessThan(100);

    const filled = page.locator(`${cell('Containment', 'fill=on clip=on')} .ui-cluster`);
    expect((await box(filled)).height).toBe(56);
    expect(await filled.evaluate((node) => getComputedStyle(node).overflow)).toBe('hidden');
    const natural = page.locator(`${cell('Containment', 'fill=off clip=off')} .ui-cluster`);
    expect((await box(natural)).height).toBeGreaterThan(56);
    expect(await natural.evaluate((node) => getComputedStyle(node).overflow)).toBe('visible');
  });

  test('UIC-LAYOUT-3.1 lays out transparent wrapper children as the parent row items', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const shown = page.locator(cell('Wrappers', 'wrapper=contents state=shown'));
    const outside = await box(shown.getByText('Outside'));
    const inside = await box(shown.getByText('Inside one'));
    expect(inside.y).toBe(outside.y);
    expect(Math.round(inside.x - (outside.x + outside.width))).toBe(8);
    await expect(
      page.locator(cell('Wrappers', 'wrapper=contents state=hidden')).getByText('Inside one'),
    ).toBeHidden();
    await expect(
      page
        .locator(cell('Wrappers', 'wrapper=inline contents state=hidden'))
        .getByText('wrapped words'),
    ).toBeHidden();
  });

  test('UIC-LAYOUT-3.3 moves focus with arrows in a toolbar row and tabs through a group', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const toolbar = page.getByRole('toolbar', { name: 'Fruit actions toolbar plain' });
    await toolbar.getByRole('button', { name: 'Peel' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(toolbar.getByRole('button', { name: 'Slice' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('toolbar', { name: 'Fruit actions toolbar band' }).getByRole('button', {
        name: 'Peel',
      }),
    ).toBeFocused();

    const group = page.getByRole('group', { name: 'Fruit actions group plain' });
    await group.getByRole('button', { name: 'Peel' }).focus();
    await page.keyboard.press('Tab');
    await expect(group.getByRole('button', { name: 'Slice' })).toBeFocused();
    const band = await page
      .getByRole('group', { name: 'Fruit actions group band' })
      .evaluate((node) => getComputedStyle(node).borderTopStyle);
    expect(band).toBe('solid');
  });

  test('UIC-LAYOUT-3.4 draws the status bar with items at both ends', async ({ page, lab }) => {
    await lab.open('layout');
    const bar = page.locator(`${cell('Status bar', 'justify=between wrap=nowrap')} .ui-status-bar`);
    const barBox = await box(bar);
    const first = await box(bar.locator('span').first());
    const last = await box(bar.locator('span').last());
    expect(first.x - barBox.x).toBeLessThan(12);
    expect(barBox.x + barBox.width - (last.x + last.width)).toBeLessThan(12);
    expect(first.y).toBe(last.y);
  });

  test('UIC-LAYOUT-1.1 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('layout', { stylesheet: 'none' });
    await expect(page.locator('.ui-stack').first()).toBeVisible();
  });
});
