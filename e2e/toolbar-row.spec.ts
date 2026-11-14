import type { Locator } from '@playwright/test';
import { cellSelector, expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

const cell = (section: string, id: string) => `[data-lab-section="${section}"] ${cellSelector(id)}`;

test.describe('Toolbar Row lab', () => {
  test('UIC-TOOLBAR-ROW-1.1 moves focus with arrows in a toolbar row and tabs through a group', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
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

  test('UIC-TOOLBAR-ROW-1.2 UIC-TOOLBAR-ROW-1.3 lays toolbar groups out along the row with separators across it', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
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

  test('UIC-TOOLBAR-ROW-1.4 UIC-SCROLL-STRIP-2.1 draws no fades when opted out, and the chevrons on the canvas without them', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
    const plain = page.locator(cell('Toolbar edge fades', 'fades=off')).locator('.ui-toolbar-row');
    await expect(plain).toHaveAttribute('data-overflow-end', 'true');
    await expect(plain.locator('.ui-toolbar-row__fade')).toHaveCount(0);
    const chevron = plain.locator('.ui-toolbar-row__scroll-button[data-edge="end"]');
    await expect(chevron).toBeVisible();
    await expect(chevron).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await lab.expectAccessible('[data-lab-section="Toolbar edge fades"]');
  });

  test('UIC-TOOLBAR-ROW-1.4 UIC-SCROLL-STRIP-2.1 draws the scroll buttons as ghost chevrons over the fades', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
    const scroll = page.locator(cell('Toolbar edge fades', 'fades=on'));
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

  test('UIC-TOOLBAR-ROW-1.4 wraps tools and groups, scrolls them, or keeps one clipped row', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
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

  test('UIC-LAYOUT-2.7 UIC-TOOLBAR-ROW-1.1 UIC-TOOLBAR-ROW-1.4 keeps drafts and focus while the presentation changes', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
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

  test('UIC-TOOLBAR-ROW-1.6 joins an attached group into one run', async ({ page, lab }) => {
    await lab.open('toolbar-row');
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

  test('UIC-TOOLBAR-ROW-1.5 keeps a pending toolbar in place, unpainted and inert', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
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
});

test('UIC-TOOLBAR-ROW-1.4 reveals focused tools without optional paging buttons', async ({
  page,
  lab,
}) => {
  await lab.open('toolbar-row');
  const demo = page.locator(cell('Scroll buttons', 'buttons=off'));
  const strip = demo.getByRole('toolbar', { name: 'Recipe tools, buttons off' });
  await expect(demo.locator('.ui-toolbar-row__scroll-button')).toHaveCount(0);
  await expect(demo.locator('.ui-toolbar-row__fade')).toHaveCount(2);
  await demo.getByRole('button', { name: 'Undo' }).focus();
  for (let step = 0; step < 6; step += 1) await page.keyboard.press('ArrowRight');
  await expect(demo.getByRole('button', { name: 'Scale servings' })).toBeFocused();
  await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(
    page.locator(cell('Scroll buttons', 'buttons=on')).locator('.ui-toolbar-row__scroll-button'),
  ).toHaveCount(2);
});
