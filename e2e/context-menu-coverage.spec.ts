import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const box = async (page: Page, selector: string) => {
  const rect = await page.locator(selector).boundingBox();
  if (!rect) throw new Error(`${selector} not rendered`);
  return rect;
};

test.describe('Context Menu lab coverage', () => {
  test('UIC-CONTEXT-MENU-1.1 UIC-CONTEXT-MENU-1.2 opens inside text controls only with opensInsideText', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const area = demo(page, 'inside-text');
    const menu = page.getByRole('menu', { name: 'Note menu' });
    await area.getByRole('textbox', { name: 'Title' }).click({ button: 'right' });
    await expect(menu).toHaveCount(0);
    await page.keyboard.press('Escape');
    await area.locator('[data-lab-target="text"] > span').click({ button: 'right' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await area.getByText('Open inside text controls').click();
    for (const name of ['Title', 'Body', 'Caption']) {
      await area.getByRole('textbox', { name }).click({ button: 'right' });
      await expect(menu).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
    }
    await area.getByRole('textbox', { name: 'Body' }).focus();
    await page.keyboard.press('Shift+F10');
    await menu.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(area.locator('[data-lab-output="inside-text"]')).toHaveText(
      'opensInsideText: true; last action: copy',
    );
  });

  test('UIC-CONTEXT-MENU-1.2 places a keyboard-opened menu against its target at the given placement', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const target = demo(page, 'placed').locator('[data-lab-target="placed"]');
    await target.focus();
    await page.keyboard.press('Shift+F10');
    const menu = page.getByRole('menu', { name: 'Crate menu' });
    await expect(menu).toBeVisible();
    const anchor = await box(page, '[data-lab-target="placed"]');
    const popover = await menu.boundingBox();
    expect(popover).not.toBeNull();
    if (popover) {
      expect(popover.y + popover.height).toBeLessThanOrEqual(anchor.y + 1);
      expect(Math.abs(popover.x + popover.width - (anchor.x + anchor.width))).toBeLessThan(2);
    }
  });

  test('UIC-CONTEXT-MENU-2.1 UIC-CONTEXT-MENU-2.3 closes a point menu when its owner scrolls and reports an outside controller', async ({
    page,
    lab,
  }) => {
    await lab.open('context-menu');
    const owner = demo(page, 'scroll-owner');
    await owner.getByRole('button', { name: 'Open at the row' }).click();
    await expect(page.getByRole('menu', { name: 'Row menu' })).toBeVisible();
    await expect(owner.locator('[data-lab-output="scroll-owner"]')).toHaveText('Open: true');
    const scroller = await box(page, '[data-lab-scroller]');
    await page.mouse.move(scroller.x + scroller.width / 2, scroller.y + 10);
    await page.mouse.wheel(0, 60);
    await expect(page.getByRole('menu', { name: 'Row menu' })).toHaveCount(0);
    await expect(owner.locator('[data-lab-output="scroll-owner"]')).toHaveText('Open: false');

    const external = demo(page, 'external-controller');
    const readout = external.locator('[data-lab-output="external-controller"]');
    await expect(readout).toHaveText('isOpen: false; anchor: none');
    await external.getByRole('button', { name: 'Open, move and close' }).click();
    await expect(readout).toHaveText('isOpen: true; anchor: pears');
    await expect(page.getByRole('menu', { name: 'Fruit menu' })).toBeVisible();
    await expect(readout).toHaveText('isOpen: true; anchor: plums');
    const plums = await box(page, '[data-lab-anchor="plums"]');
    const menu = await page.getByRole('menu', { name: 'Fruit menu' }).boundingBox();
    expect(menu?.x ?? 0).toBeGreaterThanOrEqual(plums.x + plums.width - 1);
    await expect(readout).toHaveText('isOpen: false; anchor: none');
    await expect(external.locator('[data-lab-output="external-steps"]')).toHaveText(
      'Steps: open at pears, open at plums, closed',
    );
    await lab.expectAccessible('[data-lab-demo="external-controller"]');
  });
});
