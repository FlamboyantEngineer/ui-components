import type { Locator } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { cellSelector, expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

const cell = (section: string, id: string) => `[data-lab-section="${section}"] ${cellSelector(id)}`;

test.describe('Layout lab', () => {
  test('UIC-LAYOUT-1.1 UIC-LAYOUT-2.1 stacks children in a column with the reference gaps', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    for (const [space, gap] of [
      ['none', 0],
      ['xs', 4],
      ['sm', 6],
      ['md', 8],
      ['2xl', 16],
      ['3xl', 24],
    ] as const) {
      const items = page.locator(`${cell('Stack', `space=${space} align=stretch`)} .ui-stack > *`);
      const first = await box(items.nth(0));
      const second = await box(items.nth(1));
      expect(second.x).toBe(first.x);
      expect(second.width).toBe(first.width);
      expect(Math.round(second.y - (first.y + first.height))).toBe(gap);
    }
    const start = page.locator(`${cell('Stack', 'space=2xl align=start')} .ui-stack > *`);
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
    const three = page.locator(`${cell('Grid', 'columns=3 space=2xl')} .ui-grid > *`);
    const [a, b, c, d] = await Promise.all([0, 1, 2, 3].map((index) => box(three.nth(index))));
    expect(requireDefined(a).y).toBe(requireDefined(b).y);
    expect(requireDefined(b).y).toBe(requireDefined(c).y);
    expect(requireDefined(d).x).toBe(requireDefined(a).x);
    expect(requireDefined(d).y).toBeGreaterThan(requireDefined(a).y);
    expect(Math.round(requireDefined(b).x - (requireDefined(a).x + requireDefined(a).width))).toBe(
      16,
    );

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
    const gutter = page.locator(cell('Page', 'width=full gutter=3xl'));
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
      page.getByRole('toolbar', { name: 'Fruit actions toolbar surface' }).getByRole('button', {
        name: 'Peel',
      }),
    ).toBeFocused();

    const group = page.getByRole('group', { name: 'Fruit actions group plain' });
    await group.getByRole('button', { name: 'Peel' }).focus();
    await page.keyboard.press('Tab');
    await expect(group.getByRole('button', { name: 'Slice' })).toBeFocused();
    const surface = await page
      .getByRole('group', { name: 'Fruit actions group surface' })
      .evaluate((node) => getComputedStyle(node.parentElement ?? node).borderTopStyle);
    expect(surface).toBe('solid');
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

  test('UIC-LAYOUT-2.6 places grid items by span and offset', async ({ page, lab }) => {
    await lab.open('layout');
    const grid = (id: string) => page.locator(`${cell('Grid items', id)} .ui-grid`);
    const sized = (id: string) => grid(id).locator('[data-lab-item="sized"]');
    const column = async (id: string) => {
      const rect = await box(grid(id));
      return { x: rect.x, unit: (rect.width + 4) / 12 };
    };
    for (const [span, offset] of [
      [2, 0],
      [4, 3],
      [6, 6],
    ] as const) {
      const id = `span=${span} offset=${offset}`;
      const { x, unit } = await column(id);
      const item = await box(sized(id));
      expect(Math.round(item.x - x)).toBe(Math.round(offset * unit));
      expect(Math.round(item.width)).toBe(Math.round(span * unit - 4));
    }
    const full = await box(sized('span=full offset=0'));
    expect(Math.round(full.width)).toBe(Math.round((await box(grid('span=full offset=0'))).width));
    const next = await box(grid('span=6 offset=6').locator('.ui-grid-item').nth(1));
    expect(next.y).toBeGreaterThan((await box(sized('span=6 offset=6'))).y);
  });

  test('UIC-LAYOUT-2.7 draws dividers centred in the gaps', async ({ page, lab }) => {
    await lab.open('layout');
    const stack = page.locator(`${cell('Dividers', 'primitive=stack space=2xl')} .ui-stack`);
    const children = stack.locator(':scope > *');
    await expect(stack.locator('.ui-stack__divider')).toHaveCount(2);
    const [first, divider, second] = await Promise.all([0, 1, 2].map((i) => box(children.nth(i))));
    expect(Math.round(requireDefined(divider).height)).toBe(1);
    expect(
      Math.round(
        requireDefined(divider).y - (requireDefined(first).y + requireDefined(first).height),
      ),
    ).toBe(16);
    expect(
      Math.round(
        requireDefined(second).y - (requireDefined(divider).y + requireDefined(divider).height),
      ),
    ).toBe(16);
    const cluster = page.locator(`${cell('Dividers', 'primitive=cluster space=md')} .ui-cluster`);
    const rule = await box(cluster.locator('.ui-cluster__divider').first());
    expect(Math.round(rule.width)).toBe(1);
    await expect(cluster.locator('.ui-cluster__divider').first()).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  test('UIC-LAYOUT-3.5 sizes aspect-ratio boxes from their width', async ({ page, lab }) => {
    await lab.open('layout');
    for (const [ratio, factor] of [
      ['1-1', 1],
      ['16-9', 9 / 16],
      ['9-16', 16 / 9],
      ['4-3', 3 / 4],
    ] as const) {
      const rect = await box(
        page.locator(`${cell('Aspect ratio', `ratio=${ratio}`)} .ui-aspect-ratio`),
      );
      expect(rect.width).toBe(120);
      expect(Math.abs(rect.height - 120 * factor)).toBeLessThanOrEqual(1);
    }
  });

  test('UIC-LAYOUT-3.6 UIC-LAYOUT-3.7 lays toolbar groups out along the row with separators across it', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const section = 'Toolbar orientation and groups';
    const horizontal = page.locator(cell(section, 'orientation=horizontal role=toolbar'));
    const peel = await box(horizontal.getByRole('button', { name: 'Peel' }));
    const juice = await box(horizontal.getByRole('button', { name: 'Juice' }));
    expect(Math.round(juice.y)).toBe(Math.round(peel.y));
    const rule = await box(horizontal.getByRole('separator'));
    expect(rule.width).toBe(1);
    expect(rule.x).toBeGreaterThan(peel.x + peel.width);

    const vertical = page.locator(cell(section, 'orientation=vertical role=toolbar'));
    const toolbar = vertical.getByRole('toolbar');
    await expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    const top = await box(vertical.getByRole('button', { name: 'Peel' }));
    const below = await box(vertical.getByRole('button', { name: 'Slice' }));
    expect(below.y).toBeGreaterThan(top.y + top.height - 1);
    await vertical.getByRole('button', { name: 'Peel' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('button', { name: 'Slice' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('button', { name: 'Juice' })).toBeFocused();
    expect(Math.round((await box(vertical.locator('.ui-toolbar-row__separator'))).height)).toBe(1);
    await lab.expectAccessible();
  });

  test('UIC-LAYOUT-3.8 UIC-SCROLL-STRIP-2.1 draws the scroll buttons as ghost chevrons over the fades', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const scroll = page.locator(cell('Toolbar overflow', 'overflow=scroll'));
    const row = scroll.locator('.ui-toolbar-row');
    const end = row.locator('.ui-toolbar-row__scroll-button[data-edge="end"]');
    await expect(end).toHaveAttribute('data-variant', 'ghost');
    await expect(end).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(end).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
    await end.hover();
    await expect(end).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await end.click();
    const start = row.locator('.ui-toolbar-row__scroll-button[data-edge="start"]');
    await expect(start).toBeVisible();
    // The start fade covers the tools behind the chevron: its solid half paints the canvas there.
    const fade = row.locator('.ui-toolbar-row__fade[data-edge="start"]');
    const [fadeLayer, toolLayer] = await Promise.all([
      fade.evaluate((node) => getComputedStyle(node).zIndex),
      scroll
        .getByRole('button', { name: 'Delete' })
        .evaluate((node) => getComputedStyle(node).zIndex),
    ]);
    expect(fadeLayer).toBe('1');
    expect(toolLayer).not.toBe('1');
    await expect(start).toHaveAccessibleName('Scroll backward');
  });

  test('UIC-LAYOUT-3.8 wraps tools and groups, scrolls them, or keeps one clipped row', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const section = 'Toolbar overflow';
    const wrap = page.locator(cell(section, 'overflow=wrap'));
    const wrapped = wrap.locator('.ui-toolbar-row');
    await expect(wrapped).toHaveAttribute('data-overflow', 'wrap');
    const undo = await box(wrap.getByRole('button', { name: 'Undo' }));
    const scale = await box(wrap.getByRole('button', { name: 'Scale servings' }));
    expect(scale.y).toBeGreaterThan(undo.y + undo.height - 1);
    expect((await box(wrapped)).width).toBeLessThanOrEqual(240);

    const scroll = page.locator(cell(section, 'overflow=scroll'));
    const strip = scroll.getByRole('toolbar', { name: 'Recipe tools, scroll' });
    await expect(strip).toHaveClass(/ui-toolbar-row__strip/);
    const first = await box(scroll.getByRole('button', { name: 'Undo' }));
    const last = await box(scroll.getByRole('button', { name: 'Scale servings' }));
    expect(Math.round(last.y)).toBe(Math.round(first.y));
    expect(await strip.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await expect(scroll.locator('.ui-toolbar-row')).toHaveAttribute('data-overflow-end', 'true');
    await expect(scroll.locator('.ui-toolbar-row__scroll-button[data-edge="end"]')).toBeVisible();
    await scroll.getByRole('button', { name: 'Undo' }).focus();
    for (let step = 0; step < 6; step += 1) await page.keyboard.press('ArrowRight');
    await expect(scroll.getByRole('button', { name: 'Scale servings' })).toBeFocused();
    await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);

    const none = page.locator(cell(section, 'overflow=none'));
    await expect(none.locator('.ui-toolbar-row')).toHaveAttribute('data-wrap', 'nowrap');
    const one = await box(none.getByRole('button', { name: 'Undo' }));
    const end = await box(none.getByRole('button', { name: 'Add step' }));
    expect(Math.round(end.y)).toBe(Math.round(one.y));
    await lab.expectAccessible('[data-lab-section="Toolbar overflow"]');
  });

  test('UIC-LAYOUT-2.7 UIC-LAYOUT-3.3 UIC-LAYOUT-3.8 keeps drafts and focus while the presentation changes', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const demo = page.locator('[data-lab-case="presentation"]');
    const note = demo.getByRole('textbox', { name: 'Second note' });
    await note.fill('stack draft');
    await demo.getByRole('button', { name: 'Show dividers' }).click();
    await expect(demo.locator('.ui-stack__divider')).toHaveCount(1);
    await expect(note).toHaveValue('stack draft');
    const search = demo.getByRole('textbox', { name: 'Search' });
    await search.fill('toolbar draft');
    const tools = demo.getByRole('toolbar', { name: 'Search tools' });
    const cycle = demo.getByRole('button', { name: /^Overflow:/ });
    await cycle.click();
    await expect(cycle).toHaveText('Overflow: scroll');
    await expect(tools).toHaveCSS('overflow-x', 'auto');
    await expect(demo.locator('.ui-toolbar-row[data-overflow-end]')).toHaveCount(1);
    await search.focus();
    await demo.getByRole('button', { name: 'Vertical' }).click();
    await cycle.click();
    await demo.getByRole('button', { name: 'Horizontal' }).click();
    await expect(search).toHaveValue('toolbar draft');
    await search.focus();
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    await expect(search).toHaveValue('toolbar draft!');
    // The arrows move the caret inside the field, and leave for the next tool only from its end.
    await page.keyboard.press('ArrowLeft');
    await expect(search).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expect(tools.getByRole('button', { name: 'Duplicate' })).toBeFocused();
    await demo.getByRole('button', { name: 'Hide dividers' }).click();
    await expect(note).toHaveValue('stack draft');
  });

  test('UIC-LAYOUT-3.10 joins an attached group into one run', async ({ page, lab }) => {
    await lab.open('layout');
    const section = 'Attached toolbar groups';
    const attached = page.locator(cell(section, 'density=attached orientation=horizontal'));
    const out = await box(attached.getByRole('button', { name: 'Zoom out' }));
    const reset = await box(attached.getByRole('button', { name: 'Reset zoom' }));
    expect(Math.round(reset.x)).toBe(Math.round(out.x + out.width - 1));
    const spaced = page.locator(cell(section, 'density=default orientation=horizontal'));
    const apart = await box(spaced.getByRole('button', { name: 'Zoom out' }));
    const next = await box(spaced.getByRole('button', { name: 'Reset zoom' }));
    expect(next.x).toBeGreaterThan(apart.x + apart.width);
    const column = page.locator(cell(section, 'density=attached orientation=vertical'));
    const top = await box(column.getByRole('button', { name: 'Zoom out' }));
    const below = await box(column.getByRole('button', { name: 'Reset zoom' }));
    expect(Math.round(below.y)).toBe(Math.round(top.y + top.height - 1));
    await attached.getByRole('button', { name: 'Zoom out' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(attached.getByRole('button', { name: 'Reset zoom' })).toBeFocused();
    await lab.expectAccessible('[data-lab-section="Attached toolbar groups"]');
  });

  test('UIC-LAYOUT-3.9 keeps a pending toolbar in place, unpainted and inert', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const demo = page.locator('[data-lab-demo="pending"]');
    const row = demo.locator('.ui-toolbar-row');
    const text = demo.locator('[data-lab-output="editor"]');
    await expect(row).toHaveAttribute('data-pending', 'true');
    await expect(row).toHaveCSS('visibility', 'hidden');
    // Playwright reports no box for an unpainted element, so measure it in the page.
    expect(await row.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(20);
    // The text's place in its frame, which scrolling the page does not change.
    const offset = () =>
      text.evaluate((node) => {
        if (!node.parentElement) throw new Error('The text has no frame.');
        return node.getBoundingClientRect().top - node.parentElement.getBoundingClientRect().top;
      });
    const before = await offset();
    await expect(demo.getByRole('button', { name: 'Undo' })).toHaveCount(0);
    await demo.getByRole('button', { name: 'Start editor' }).click();
    await expect(row).not.toHaveAttribute('data-pending');
    await expect(row).toHaveCSS('visibility', 'visible');
    expect(await offset()).toBe(before);
    await demo.getByRole('button', { name: 'Undo' }).focus();
    await expect(demo.getByRole('button', { name: 'Undo' })).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="pending"]');
  });

  test('UIC-LAYOUT-1.2 renders primitives as semantic elements with their native props', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const section = page.getByRole('region', { name: 'Harvest plan' });
    await expect(section).toHaveClass(/ui-stack/);
    const nav = section.getByRole('navigation', { name: 'Harvest pages' });
    await expect(nav).toHaveClass(/ui-cluster/);
    await expect(nav.getByRole('link')).toHaveCount(2);
    const list = section.locator('[data-lab-semantic="list"]');
    expect(await list.evaluate((node) => node.tagName)).toBe('UL');
    await expect(list.getByRole('listitem')).toHaveCount(2);
    const terms = section.locator('[data-lab-semantic="terms"]');
    expect(
      await terms.evaluate((node) => [...node.children].map((child) => child.tagName)),
    ).toEqual(['DT', 'DD']);
    await lab.expectAccessible();
  });

  test('UIC-LAYOUT-2.1 UIC-LAYOUT-2.2 aligns grid cells, pads the grid and spaces inline fields and status bars', async ({
    page,
    lab,
  }) => {
    await lab.open('layout');
    const grid = (align: string, gutter: string) =>
      page.locator(`${cell('Grid', `align=${align} gutter=${gutter}`)} .ui-grid`);
    const short = (align: string) => grid(align, 'none').locator(':scope > *').nth(1);
    const tall = await box(grid('start', 'none').locator(':scope > *').first());
    expect((await box(short('stretch'))).height).toBe(tall.height);
    expect((await box(short('start'))).y).toBe(tall.y);
    expect((await box(short('end'))).y + (await box(short('end'))).height).toBeCloseTo(
      (await box(grid('end', 'none').locator(':scope > *').first())).y + tall.height,
      0,
    );
    await expect(grid('center', 'md')).toHaveAttribute('data-gutter', 'md');
    const padded = await box(grid('start', '2xl'));
    const first = await box(grid('start', '2xl').locator(':scope > *').first());
    expect(first.x - padded.x).toBeGreaterThan(8);

    const inline = (space: string, align: string, justify: string) =>
      page.locator(
        `${cell('Inline field', `space=${space} align=${align} justify=${justify}`)} .ui-inline-field`,
      );
    const gap = async (space: string) => {
      const field = inline(space, 'center', 'start');
      const [caption, control] = [
        await box(field.locator('span')),
        await box(field.locator('textarea')),
      ];
      return control.x - (caption.x + caption.width);
    };
    expect(await gap('xl')).toBeGreaterThan(await gap('xs'));
    const between = inline('md', 'center', 'between');
    expect(
      (await box(between.locator('textarea'))).x + (await box(between.locator('textarea'))).width,
    ).toBeCloseTo((await box(between)).x + (await box(between)).width, 0);
    await expect(inline('md', 'baseline', 'start')).toHaveAttribute('data-align', 'baseline');

    const status = (space: string) =>
      page.locator(`${cell('Status bar', `space=${space}`)} .ui-status-bar`);
    const statusGap = async (space: string) => {
      const items = status(space).locator('span');
      const [a, b] = [await box(items.nth(0)), await box(items.nth(1))];
      return b.x - (a.x + a.width);
    };
    expect(await statusGap('xl')).toBeGreaterThan(await statusGap('xs'));
    expect(await statusGap('none')).toBeLessThan(1);
  });
});
