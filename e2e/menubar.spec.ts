import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

function bar(page: Page, name = 'Editor'): Locator {
  return page.getByRole('menubar', { name });
}

function top(page: Page, name: string, barName = 'Editor'): Locator {
  return bar(page, barName).getByRole('menuitem', { name, exact: true });
}

/** Open menu popovers. */
function popovers(page: Page): Locator {
  return page.locator('.ui-menu-popover');
}

function item(page: Page, name: string | RegExp): Locator {
  return popovers(page).getByRole('menuitem', { name });
}

/** Opens the focused top-level menu with ArrowDown, pressing again until the menu shows. */
async function openWithArrowDown(page: Page, name: string): Promise<void> {
  const menu = page.getByRole('menu', { name });
  await expect(async () => {
    if (!(await menu.isVisible())) await page.keyboard.press('ArrowDown');
    await expect(menu).toBeVisible({ timeout: 1000 });
  }).toPass();
}

function isFocusInBar(page: Page, name = 'Editor'): Promise<boolean> {
  return bar(page, name).evaluate((element) => element.contains(document.activeElement));
}

test.describe('Menubar lab', () => {
  test('UIC-MENUBAR-1.1 UIC-MENUBAR-1.3 UIC-MENUBAR-1.4 is one tab stop moving along the bar', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    const file = top(page, 'File');
    await expect(file).toHaveAttribute('aria-haspopup', 'true');
    await expect(file).toHaveAttribute('tabindex', '0');
    await expect(top(page, 'Edit')).toHaveAttribute('tabindex', '-1');
    await file.focus();
    await page.keyboard.press('ArrowRight');
    await expect(top(page, 'Edit')).toBeFocused();
    await expect(top(page, 'Edit')).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('End');
    await expect(top(page, 'Help')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(file).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(top(page, 'Help')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(file).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    await expect.poll(() => isFocusInBar(page)).toBe(false);
    await page.keyboard.press('Shift+Tab');
    await expect(top(page, 'Edit')).toBeFocused();
    await expect(popovers(page)).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-MENUBAR-2.1 UIC-MENUBAR-2.3 opens from the keyboard and returns focus on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    const file = top(page, 'File');
    await file.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
    await expect(file).toHaveAttribute('aria-expanded', 'true');
    await expect(file).toHaveAttribute('data-open', 'true');
    await expect(item(page, /^New file/)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popovers(page)).toHaveCount(0);
    await expect(file).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(item(page, /^Close/)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(file).toBeFocused();
    await page.keyboard.press('Space');
    await expect(item(page, /^New file/)).toBeFocused();
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Enter');
    await expect(popovers(page)).toHaveCount(0);
    await expect(file).toBeFocused();
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('new');
  });

  test('UIC-MENUBAR-2.2 passes from one open menu to the next, around submenus', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    await top(page, 'File').focus();
    await openWithArrowDown(page, 'File');
    await page.keyboard.press('ArrowRight');
    await expect(item(page, /^Undo/)).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
    await expect(top(page, 'Edit')).toHaveAttribute('aria-expanded', 'true');
    await expect(top(page, 'File')).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, /^New file/)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, /^Guide/)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    const recent = item(page, 'Open recent');
    await expect(recent).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, 'Report.pdf')).toBeFocused();
    await expect(popovers(page)).toHaveCount(2);
    await page.keyboard.press('ArrowLeft');
    await expect(recent).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(item(page, /^Undo/)).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
    // The submenu left behind does not open again with its menu.
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, /^New file/)).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(top(page, 'Edit')).toBeFocused();
  });

  test('UIC-MENUBAR-2.4 UIC-MENUBAR-2.3 switches menus under the pointer and closes outside', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    await top(page, 'Edit').hover();
    await expect(popovers(page)).toHaveCount(0);
    await top(page, 'File').click();
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
    await top(page, 'Edit').hover();
    await expect(page.getByRole('menu', { name: 'Edit' })).toBeVisible();
    await expect(popovers(page)).toHaveCount(1);
    // Focus moves into the newly opened menu itself, which returns it to its item on Escape.
    await expect(page.getByRole('menu', { name: 'Edit' })).toBeFocused();
    await expect(top(page, 'Edit')).toHaveAttribute('data-hovered', 'true');
    await expect(top(page, 'Edit')).toHaveAttribute('tabindex', '0');
    await top(page, 'Help').hover();
    await expect(page.getByRole('menu', { name: 'Help' })).toBeVisible();
    await top(page, 'Help').click();
    await expect(popovers(page)).toHaveCount(0);
    await top(page, 'File').click();
    await item(page, 'Open recent').hover();
    await item(page, 'Recipes.csv').click();
    await expect(popovers(page)).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('recipes');
    await expect(top(page, 'File')).toBeFocused();
    await top(page, 'Edit').click();
    await page.mouse.click(600, 5);
    await expect(popovers(page)).toHaveCount(0);
  });

  test('UIC-MENUBAR-2.3 leaves the bar on Tab from an open menu', async ({ page, lab }) => {
    await lab.open('menubar');
    await top(page, 'Edit').focus();
    await page.keyboard.press('ArrowDown');
    await expect(item(page, /^Undo/)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(popovers(page)).toHaveCount(0);
    await expect.poll(() => isFocusInBar(page)).toBe(false);
    await expect
      .poll(() => page.evaluate(() => document.activeElement === document.body))
      .toBe(false);
  });

  test('UIC-MENUBAR-2.5 checks items in a section and picks one choice', async ({ page, lab }) => {
    await lab.open('menubar');
    await top(page, 'View').click();
    const grid = popovers(page).getByRole('menuitemcheckbox', { name: 'Grid' });
    await grid.click();
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('[data-lab-output="Panels"]')).toHaveText('ruler, grid');
    await popovers(page).getByRole('menuitemradio', { name: '150%' }).click();
    await expect(popovers(page)).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Zoom"]')).toHaveText('150');
    await top(page, 'Edit').click();
    const paste = item(page, /^Paste/);
    await expect(paste).toHaveAttribute('aria-disabled', 'true');
    await expect(item(page, 'Delete')).toHaveAttribute('data-tone', 'danger');
  });

  test('UIC-MENUBAR-1.2 lays out rows and columns at four sizes', async ({ page, lab }) => {
    await lab.open('menubar');
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const cell = matrixCell(page, `orientation=horizontal size=${size}`);
      const box = await cell.getByRole('menuitem', { name: 'File' }).boundingBox();
      expect(box?.height).toBe(height);
    }
    const row = matrixCell(page, 'orientation=horizontal size=md');
    const file = await row.getByRole('menuitem', { name: 'File' }).boundingBox();
    const edit = await row.getByRole('menuitem', { name: 'Edit' }).boundingBox();
    expect(Math.abs((file?.y ?? 0) - (edit?.y ?? 1))).toBeLessThan(1);
    await row.getByRole('menuitem', { name: 'File' }).click();
    const below = await popovers(page).boundingBox();
    expect(below?.y ?? 0).toBeGreaterThan((file?.y ?? 0) + (file?.height ?? 0));
    await expect(popovers(page)).toHaveAttribute('data-placement', 'bottom');
    await page.keyboard.press('Escape');
    const column = matrixCell(page, 'orientation=vertical size=lg');
    const first = await column.getByRole('menuitem', { name: 'File' }).boundingBox();
    const second = await column.getByRole('menuitem', { name: 'Edit' }).boundingBox();
    expect(second?.y ?? 0).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0) - 1);
    await column.getByRole('menuitem', { name: 'File' }).click();
    await expect(popovers(page)).toHaveAttribute('data-placement', 'right');
    await expect(popovers(page).locator('.ui-menu')).toHaveAttribute('data-size', 'lg');
  });

  test('UIC-MENUBAR-1.4 UIC-MENUBAR-2.1 UIC-MENUBAR-2.2 moves through a column', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    const sections = (name: string) => top(page, name, 'Sections');
    await sections('Fruit').focus();
    await page.keyboard.press('ArrowDown');
    await expect(sections('Cities')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, 'Lima')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(item(page, 'Oslo')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(popovers(page)).toHaveCount(0);
    await expect(sections('Cities')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(sections('Recipes')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="Vertical action"]')).toHaveText('soup');
  });

  test('UIC-MENUBAR-1.4 moves the other way in right-to-left text', async ({ page, lab }) => {
    await lab.open('menubar');
    const rtl = (name: string) => top(page, name, 'Right to left menubar');
    await rtl('File').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(rtl('Edit')).toBeFocused();
    // Open the menu before moving, so the next key moves between menus rather than along the bar;
    // the first key can land before the bar has caught up with its focus, so press until it opens.
    await openWithArrowDown(page, 'Edit');
    await page.keyboard.press('ArrowLeft');
    await expect(item(page, /^Guide/)).toBeFocused();
  });

  test('UIC-MENUBAR-1.1 passes axe in the dark theme with a menu open', async ({ page, lab }) => {
    await lab.open('menubar', { theme: 'dark' });
    await lab.expectAccessible();
    await top(page, 'View').click();
    await lab.expectAccessible('.ui-menu-popover');
  });

  test('UIC-MENUBAR-2.6 opens the other menus after the open one leaves', async ({ page, lab }) => {
    await lab.open('menubar');
    const demo = page.locator('[data-lab-demo="changing"]');
    const bar = demo.getByRole('menubar', { name: 'Changing menus' });
    await demo.getByRole('button', { name: 'Remove File in a second' }).click();
    await bar.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Open recent' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Report.pdf' })).toBeVisible();
    await expect(bar.getByRole('menuitem', { name: 'File' })).toHaveCount(0);
    await expect(page.getByRole('menu')).toHaveCount(0);
    const edit = bar.getByRole('menuitem', { name: 'Edit' });
    await expect(edit).toBeFocused();
    await edit.click();
    await expect(edit).toHaveAttribute('aria-expanded', 'true');
    await bar.getByRole('menuitem', { name: 'Help' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Guide' })).toBeVisible();
  });

  test('UIC-MENUBAR-2.2 keeps the next menu open when the bar scrolls to reveal its item', async ({
    page,
    lab,
  }) => {
    await lab.open('menubar');
    const bar = page.getByRole('menubar', { name: 'Scrolling menubar' });
    const scroller = page.locator('[data-lab-scroller="menubar"]');
    await bar.getByRole('menuitem', { name: 'File' }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(bar.getByRole('menuitem', { name: 'Help' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(await scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    await expect(item(page, /^Guide/)).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
  });
});
