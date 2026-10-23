import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

/** Open menu popovers (the lab also shows standalone menus). */
function popovers(page: Page): Locator {
  return page.locator('.ui-menu-popover');
}

function item(page: Page, name: string | RegExp): Locator {
  return popovers(page).getByRole('menuitem', { name });
}

/** The element drawn topmost at the centre of a box. */
async function topmostAt(page: Page, box: { x: number; y: number; width: number; height: number }) {
  return page.evaluate(
    ([x, y]) => {
      const element = document.elementFromPoint(x as number, y as number);
      return element?.closest('[data-lab-tooltip-note], [role="menuitem"], [data-lab-modal-panel]')
        ?.textContent;
    },
    [box.x + box.width / 2, box.y + box.height / 2],
  );
}

test.describe('Menu lab', () => {
  test('UIC-MENU-1.1 UIC-MENU-3.3 preserves typed IDs through keyboard selection', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const demo = page.locator('[data-lab-demo="typed-keys"]');
    const trigger = demo.getByRole('button', { name: 'Typed choices' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu', { name: 'Typed choices' });
    const numeric = menu.getByRole('menuitemcheckbox', { name: 'Numeric option' });
    const text = menu.getByRole('menuitemcheckbox', { name: 'Text option' });
    await expect(numeric).toHaveAttribute('aria-checked', 'true');
    await expect(text).toHaveAttribute('aria-checked', 'false');
    await expect(numeric).toBeFocused();
    expect(await numeric.getAttribute('id')).not.toBe(await text.getAttribute('id'));
    await page.keyboard.press('ArrowDown');
    await expect(text).toBeFocused();
    await page.keyboard.press('Space');
    await expect(text).toHaveAttribute('aria-checked', 'true');
    await expect(numeric).toHaveAttribute('aria-checked', 'true');
    await expect(demo.getByRole('status')).toHaveText('Action: string: 1');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Compact option' })).toBeFocused();
    await page.keyboard.press('Escape');
  });

  test('UIC-MENU-1.2 UIC-MENU-2.1 draws rows and icons at three sizes', async ({ page, lab }) => {
    await lab.open('menu');
    for (const [size, row, icon] of [
      ['sm', 24, 12],
      ['md', 28, 16],
      ['lg', 32, 20],
    ] as const) {
      const plain = await page
        .locator(`[data-lab-cell="item=plain size=${size}"] .ui-menu-item`)
        .boundingBox();
      expect(plain?.height).toBe(row);
      const glyph = await page
        .locator(`[data-lab-cell="item=icon size=${size}"] .ui-menu-item__icon`)
        .boundingBox();
      expect(glyph?.width).toBe(icon);
    }
    const shortcut = page.locator('[data-lab-cell="item=shortcut size=md"] .ui-menu-item');
    await expect(shortcut.locator('.ui-menu-item__shortcut')).toBeVisible();
    await expect(shortcut).toHaveAccessibleName(/^Undo\s*Control Z$/);
    await lab.expectAccessible();
  });

  test('UIC-MENU-2.3 UIC-MENU-2.4 UIC-MENU-3.3 draws tone, disabled, pending and checked items', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const cell = (state: string) =>
      page.locator(`[data-lab-cell="state=${state} size=md"] .ui-menu-item`);
    await expect(cell('danger')).toHaveAttribute('data-tone', 'danger');
    await expect(cell('disabled')).toHaveAttribute('aria-disabled', 'true');
    await expect(cell('pending')).toHaveAttribute('data-pending', 'true');
    await expect(cell('pending').locator('.ui-menu-item__spinner')).toBeVisible();
    await expect(cell('selected')).toHaveAttribute('aria-checked', 'true');
    await expect(cell('selected').locator('.ui-menu-item__check svg')).toBeVisible();
    await expect(cell('unselected').locator('.ui-menu-item__check svg')).toHaveCount(0);
    const disabledOpacity = await cell('disabled').evaluate(
      (node) => getComputedStyle(node).opacity,
    );
    expect(Number(disabledOpacity)).toBeLessThan(1);
  });

  test('UIC-MENU-4.1 UIC-MENU-1.3 UIC-MENU-4.5 UIC-MENU-4.2 navigates menus and submenus by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const trigger = section(page, 'Opened from a button, items as data').getByRole('button', {
      name: 'File',
    });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu', { name: 'File' });
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(item(page, /^New file/)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    // The disabled item is passed over.
    const exportItem = item(page, 'Export as');
    await expect(exportItem).toBeFocused();
    await expect(exportItem).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('ArrowRight');
    const pdf = item(page, 'Report.pdf');
    await expect(pdf).toBeFocused();
    const itemBox = await exportItem.boundingBox();
    const submenuBox = await page
      .locator('.ui-menu-popover[data-trigger="SubmenuTrigger"]')
      .boundingBox();
    expect(submenuBox?.x).toBeGreaterThan((itemBox?.x ?? 0) + (itemBox?.width ?? 0) - 12);
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expect(item(page, 'PNG')).toBeFocused();
    await expect(popovers(page)).toHaveCount(3);
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, 'Image')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(exportItem).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('UIC-MENU-1.4 UIC-MENU-4.2 runs an action once by pointer and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Opened from a button, items as data');
    const trigger = area.getByRole('button', { name: 'File' });
    await trigger.click();
    await item(page, 'Recent (none)').click({ force: true });
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
    await expect(area.locator('[data-lab-output="File action"]')).toHaveText('none');
    await item(page, 'Export as').hover();
    await item(page, 'Table.csv').click();
    await expect(popovers(page)).toHaveCount(0);
    await expect(area.locator('[data-lab-output="File action"]')).toHaveText('csv');
    await expect(trigger).toBeFocused();
  });

  test('UIC-MENU-2.5 UIC-MENU-4.3 publishes item states and places the popover under its trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const trigger = section(page, 'Composed with JSX').getByRole('button', {
      name: 'Edit actions',
    });
    await trigger.click();
    const popover = popovers(page);
    await expect(popover).toHaveAttribute('data-placement', 'bottom');
    await expect(popover).toHaveAttribute('data-layer', 'dropdown');
    const triggerBox = await trigger.boundingBox();
    const popoverBox = await popover.boundingBox();
    const gap = (popoverBox?.y ?? 0) - ((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0));
    expect(Math.abs(gap - 4)).toBeLessThan(1);
    expect(Math.abs((popoverBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(1);
    const copy = item(page, /^Copy/);
    await copy.hover();
    await expect(copy).toHaveAttribute('data-hovered', 'true');
    await page.mouse.down();
    await expect(copy).toHaveAttribute('data-pressed', 'true');
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect(popover.getByRole('group', { name: 'Clipboard' })).toBeVisible();
    await lab.expectAccessible('.ui-menu-popover');
    await page.mouse.click(5, 300);
    await expect(popover).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-MENU-3.3 keeps a multiple-choice menu open and closes after a single choice', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Selection');
    await area.getByRole('button', { name: 'View' }).click();
    const kind = popovers(page).getByRole('menuitemcheckbox', { name: 'Kind' });
    await kind.click();
    await expect(kind).toHaveAttribute('aria-checked', 'true');
    await expect(area.locator('[data-lab-output="Columns"]')).toHaveText('size, kind');
    await popovers(page).getByRole('menuitemradio', { name: 'Date' }).click();
    await expect(popovers(page)).toHaveCount(0);
    await expect(area.locator('[data-lab-output="Sort"]')).toHaveText('date');
  });

  test('UIC-MENU-4.3 fits a long menu to the viewport and scrolls it', async ({ page, lab }) => {
    await page.setViewportSize({ width: 800, height: 500 });
    await lab.open('menu');
    const trigger = section(page, 'Long menu').getByRole('button', { name: 'Cities' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const popover = popovers(page);
    const box = await popover.boundingBox();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(500 - 8 + 1);
    expect(box?.y ?? -1).toBeGreaterThanOrEqual(8 - 1);
    expect(await popover.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await page.keyboard.press('End');
    const last = item(page, 'Turin 45');
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
  });

  test('UIC-MENU-4.4 stacks a menu above the modal layer and below the tooltip layer', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    await section(page, 'Layering').getByRole('button', { name: 'Layered menu' }).click();
    await expect(popovers(page)).toHaveCSS('z-index', '130');
    const note = await page.locator('[data-lab-tooltip-note]').boundingBox();
    if (!note) throw new Error('tooltip note not rendered');
    expect(await topmostAt(page, note)).toBe('Tooltip layer');
    const first = await item(page, 'First action').boundingBox();
    const panel = await page.locator('[data-lab-modal-panel]').boundingBox();
    if (!first || !panel) throw new Error('menu or panel not rendered');
    expect(first.y).toBeLessThan(panel.y + panel.height);
    expect(await topmostAt(page, first)).toBe('First action');
  });

  test('UIC-MENU-1.1 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('menu', { stylesheet: 'none' });
    const area = section(page, 'Opened from a button, items as data');
    await area.getByRole('button', { name: 'File' }).click();
    await expect(item(page, 'Export as')).toBeVisible();
    await expect(popovers(page).getByRole('separator')).toHaveCount(1);
    await expect(area.locator('[data-lab-output="File action"]')).toHaveText('none');
    await item(page, /^Open…/).click();
    await expect(area.locator('[data-lab-output="File action"]')).toHaveText('open');
    await expect(popovers(page)).toHaveCount(0);
  });

  test('UIC-MENU-4.1 UIC-MENU-1.4 selects an item by dragging from the trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Opened from a button, items as data');
    const trigger = area.getByRole('button', { name: 'File' });
    await trigger.hover();
    await page.mouse.down();
    const entry = item(page, /^New file/);
    await expect(entry).toBeVisible();
    const box = await entry.boundingBox();
    if (!box) throw new Error('menu item not rendered');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(area.locator('[data-lab-output="File action"]')).toHaveText('new');
    await expect(popovers(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-MENU-2.1 UIC-MENU-2.3 stays accessible in the dark theme', async ({ page, lab }) => {
    await lab.open('menu', { theme: 'dark' });
    await lab.expectAccessible();
    await section(page, 'Composed with JSX').getByRole('button', { name: 'Edit actions' }).click();
    await expect(popovers(page)).toHaveCount(1);
    await lab.expectAccessible('.ui-menu-popover');
  });

  test('UIC-MENU-5.1 filters a menu from its search field', async ({ page, lab }) => {
    await lab.open('menu');
    const area = section(page, 'Filterable menu');
    await area.getByRole('button', { name: 'Move to' }).click();
    const search = popovers(page).getByRole('searchbox', { name: 'Search' });
    await expect(search).toBeFocused();
    await page.keyboard.type('li');
    await expect(popovers(page).getByRole('menuitem')).toHaveText([
      'Lima 2',
      'Lima 11',
      'Lima 20',
      'Lima 29',
      'Lima 38',
    ]);
    await expect(search).toBeFocused();
    await expect(item(page, /^Lima 2$/)).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(item(page, /^Lima 11$/)).toHaveAttribute('data-focused', 'true');
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Enter');
    await expect(popovers(page)).toHaveCount(0);
    await expect(area.locator('[data-lab-output="Move action"]')).toHaveText('city-11');
    const cellSearch = page.locator('[data-lab-cell="state=no match size=md"] .ui-menu__empty');
    await expect(cellSearch).toHaveText('No results');
  });

  test('UIC-MENU-5.4 marks the typed text in the matching labels', async ({ page, lab }) => {
    await lab.open('menu');
    await section(page, 'Highlighted matches')
      .getByRole('button', { name: 'Highlighted cities' })
      .click();
    await page.keyboard.type('qu');
    const marks = popovers(page).locator('mark.ui-text-match');
    await expect(marks).toHaveText(['Qu', 'Qu', 'Qu', 'Qu', 'Qu']);
    await expect(item(page, /^Quito 5$/)).toHaveAccessibleName('Quito 5');
    await lab.expectAccessible('.ui-menu-popover');
  });

  test('UIC-MENU-5.2 loads more entries as the end of the menu comes into view', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('menu');
    await page.clock.pauseAt(Date.now() + 1000);
    const area = section(page, 'Loading more');
    await area.getByRole('button', { name: 'Paged cities' }).click();
    await expect(item(page, /^Paris 1$/)).toBeVisible();
    await popovers(page).evaluate((popover) => {
      popover.scrollTop = popover.scrollHeight;
    });
    const loading = popovers(page).locator('.ui-menu__load-more');
    await expect(loading).toBeVisible();
    await expect(loading).toHaveText('Loading');
    await expect(loading.locator('.ui-menu__load-more-spinner')).toBeVisible();
    await page.clock.runFor(500);
    await expect(area.locator('[data-lab-output="Loaded"]')).toHaveText('40');
    await expect(item(page, /^Quito 23$/)).toBeAttached();
    await page.clock.resume();
    await expect(
      page.locator('[data-lab-cell="state=loading size=md"] .ui-menu__load-more'),
    ).toHaveText('Loading');
  });

  test('UIC-MENU-5.3 renders a long menu virtualized', async ({ page, lab }) => {
    await lab.open('menu');
    const trigger = section(page, 'Virtualized menu').getByRole('button', { name: '5000 cities' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu', { name: '5000 cities' });
    await expect(item(page, /^Paris 1$/)).toBeFocused();
    expect(await menu.getByRole('menuitem').count()).toBeLessThan(100);
    await expect(item(page, /^Paris 1$/)).toHaveAttribute('aria-setsize', '5000');
    await page.keyboard.press('End');
    await expect(item(page, /^Quito 5000$/)).toBeFocused();
    await expect(item(page, /^Quito 5000$/)).toHaveAttribute('aria-posinset', '5000');
    expect(await menu.getByRole('menuitem').count()).toBeLessThan(100);
    await expect(menu).toHaveAttribute('data-virtualized', 'true');
    await lab.expectAccessible('.ui-menu-popover');
  });

  test('UIC-MENU-5.3 sizes virtualized rows from rowHeight and loads more as they scroll', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Virtualized and loading more');
    await area.getByRole('button', { name: 'Tall rows' }).click();
    const first = item(page, /^Paris 1$/);
    await expect(first).toBeVisible();
    const second = await item(page, /^Lima 2$/).boundingBox();
    expect((second?.y ?? 0) - ((await first.boundingBox())?.y ?? 0)).toBe(40);
    await expect(first).toHaveAttribute('aria-setsize', '200');
    await first.focus();
    await page.keyboard.press('End');
    await expect(item(page, /^Lima 200$/)).toBeFocused();
    await expect(area.locator('[data-lab-output="Loaded"]')).toHaveText('400');
    await expect(item(page, /^Lima 200$/)).toHaveAttribute('aria-setsize', '400');
  });
});
