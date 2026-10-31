import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function popovers(page: Page): Locator {
  return page.locator('.ui-menu-popover');
}

function item(page: Page, name: string | RegExp): Locator {
  return popovers(page).getByRole('menuitem', { name });
}

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

async function centre(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

test.describe('Context Menu lab', () => {
  test('UIC-CONTEXT-MENU-1.1 UIC-CONTEXT-MENU-1.4 opens at the pointer and returns focus to the target', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const target = matrixCell(page, 'target=focusable size=md').locator('[data-lab-target]');
    const { x, y } = await centre(target);
    await page.mouse.click(x, y, { button: 'right' });
    const popover = popovers(page);
    await expect(popover).toHaveAttribute('data-layer', 'context-menu');
    await expect(popover).toHaveCSS('z-index', '140');
    const box = await popover.boundingBox();
    expect(Math.abs((box?.x ?? 0) - x)).toBeLessThan(1);
    expect(Math.abs((box?.y ?? 0) - (y + 2))).toBeLessThan(1);
    await expect(item(page, /^Open/)).toBeFocused();
    await expect(page.getByRole('menu', { name: 'Context menu' })).toBeVisible();
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(popover).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('rename (md)');
    await expect(target).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-CONTEXT-MENU-1.1 stays inside the viewport near its edges', async ({ page, lab }) => {
    await page.setViewportSize({ width: 700, height: 500 });
    await lab.open('context-menu');
    const target = matrixCell(page, 'target=text size=lg').locator('[data-lab-target]');
    await target.evaluate((node) => node.scrollIntoView({ block: 'end' }));
    const { box } = await centre(target);
    const x = box.x + box.width - 4;
    const y = box.y + box.height - 4;
    await page.mouse.click(x, y, { button: 'right' });
    const menu = await popovers(page).boundingBox();
    if (!menu) throw new Error('menu not rendered');
    expect(menu.y + menu.height).toBeLessThanOrEqual(500);
    expect(menu.x + menu.width).toBeLessThanOrEqual(700);
    expect(menu.y + menu.height).toBeLessThanOrEqual(y);
    await expect(popovers(page)).toHaveAttribute('data-placement', 'top');
  });

  test('UIC-CONTEXT-MENU-1.2 opens below the focused target from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const target = matrixCell(page, 'target=focusable size=sm').locator('[data-lab-target]');
    await target.focus();
    await page.keyboard.press('Shift+F10');
    await expect(item(page, /^Open/)).toBeFocused();
    const targetBox = await target.boundingBox();
    const menu = await popovers(page).boundingBox();
    expect(
      Math.abs((menu?.y ?? 0) - ((targetBox?.y ?? 0) + (targetBox?.height ?? 0) + 4)),
    ).toBeLessThan(1);
    await expect(popovers(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(target).toBeFocused();
    await page.keyboard.press('ContextMenu');
    await expect(item(page, /^Open/)).toBeFocused();
    await expect(popovers(page)).toHaveCount(1);
  });

  test('UIC-CONTEXT-MENU-1.3 opens at a resting touch', async ({ page, lab }) => {
    await lab.open('context-menu');
    const target = matrixCell(page, 'target=text size=md').locator('[data-lab-target]');
    const { x, y } = await centre(target);
    const touch = { pointerType: 'touch', pointerId: 9, isPrimary: true, clientX: x, clientY: y };
    await target.dispatchEvent('pointerdown', touch);
    await expect(popovers(page)).toHaveCount(1, { timeout: 2000 });
    const box = await popovers(page).boundingBox();
    expect(Math.abs((box?.x ?? 0) - x)).toBeLessThan(1);
    await target.dispatchEvent('pointerup', touch);
    await expect(popovers(page)).toHaveCount(1);
  });

  test('UIC-CONTEXT-MENU-1.5 closes on outside presses without running an action', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const target = matrixCell(page, 'target=focusable size=md').locator('[data-lab-target]');
    const { x, y } = await centre(target);
    await page.mouse.click(x, y, { button: 'right' });
    await expect(popovers(page)).toHaveCount(1);
    await page.mouse.click(x + 400, y + 200, { button: 'right' });
    await expect(popovers(page)).toHaveCount(0);
    await page.mouse.click(x, y, { button: 'right' });
    await expect(popovers(page)).toHaveCount(1);
    await page.mouse.click(x + 400, y + 200);
    await expect(popovers(page)).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('none');
    await matrixCell(page, 'target=disabled size=md')
      .locator('[data-lab-target]')
      .click({ button: 'right' });
    await expect(popovers(page)).toHaveCount(0);
  });

  test('UIC-CONTEXT-MENU-1.1 opens only the innermost target menu', async ({ page, lab }) => {
    await lab.open('context-menu');
    await page.locator('[data-lab-inner]').click({ button: 'right' });
    await expect(popovers(page)).toHaveCount(1);
    await expect(page.getByRole('menu', { name: 'File' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="Nested action"]')).toHaveText('file open');
  });

  test('UIC-CONTEXT-MENU-2.2 opens through a controller at a point or below an element', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const canvas = page.locator('[data-lab-canvas]');
    await canvas.scrollIntoViewIfNeeded();
    const { box } = await centre(canvas);
    await page.mouse.click(box.x + 30, box.y + 20);
    const menu = await popovers(page).boundingBox();
    expect(Math.abs((menu?.x ?? 0) - (box.x + 30))).toBeLessThan(1);
    await expect(popovers(page)).toHaveAttribute('data-lab-controlled', '');
    await item(page, 'Pear').click();
    await expect(popovers(page)).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Controller action"]')).toHaveText('Pear');

    const button = page.locator('[data-lab-open-below]');
    await button.click();
    const buttonBox = await button.boundingBox();
    const below = await popovers(page).boundingBox();
    expect(
      Math.abs((below?.y ?? 0) - ((buttonBox?.y ?? 0) + (buttonBox?.height ?? 0) + 4)),
    ).toBeLessThan(1);
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  });

  test('UIC-CONTEXT-MENU-2.3 moves an open menu without reopening it', async ({ page, lab }) => {
    await lab.open('context-menu');
    await page.locator('[data-lab-open-move]').click();
    const menu = page.locator('.ui-menu-popover .ui-menu');
    await expect(menu).toBeVisible();
    await menu.evaluate((node) => node.setAttribute('data-lab-mark', 'first'));
    await page.keyboard.press('ArrowDown');
    await expect(item(page, 'Pear')).toBeFocused();
    await expect
      .poll(async () => (await popovers(page).boundingBox())?.x, { timeout: 3000 })
      .toBeCloseTo(240, 0);
    expect((await popovers(page).boundingBox())?.y).toBeCloseTo(362, 0);
    await expect(menu).toHaveAttribute('data-lab-mark', 'first');
    await expect(item(page, 'Pear')).toBeFocused();
  });

  test('UIC-CONTEXT-MENU-2.4 stacks the context-menu layer above the dropdown layer', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    await section(page, 'Layers').getByRole('button', { name: 'Open on two layers' }).click();
    await expect(popovers(page)).toHaveCount(2);
    await expect(page.locator('.ui-menu-popover[data-layer="dropdown"]')).toHaveCSS(
      'z-index',
      '130',
    );
    await expect(page.locator('.ui-menu-popover[data-layer="context-menu"]')).toHaveCSS(
      'z-index',
      '140',
    );
    // Each modal menu makes the other inert, which hit testing skips; lift that to read paint order.
    const top = await page.evaluate(() => {
      for (const node of document.querySelectorAll<HTMLElement>('[inert]')) node.inert = false;
      return document
        .elementFromPoint(150, 330)
        ?.closest('.ui-menu-popover')
        ?.getAttribute('data-layer');
    });
    expect(top).toBe('context-menu');
  });

  test('UIC-CONTEXT-MENU-1.6 stays accessible in the dark theme', async ({ page, lab }) => {
    await lab.open('context-menu', { theme: 'dark' });
    await lab.expectAccessible();
    await matrixCell(page, 'target=focusable size=md')
      .locator('[data-lab-target]')
      .click({ button: 'right' });
    await expect(popovers(page)).toHaveCount(1);
    await lab.expectAccessible('.ui-menu-popover');
  });
});
