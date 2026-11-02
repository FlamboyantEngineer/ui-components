import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

/** Waits until no drawer is still sliding in, so keys and swipes reach a settled drawer. */
const settled = (page: Page) => expect(page.locator('.ui-drawer[data-entering]')).toHaveCount(0);

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box;
}

test.describe('Drawer lab coverage', () => {
  test('UIC-DRAWER-1.1 UIC-DRAWER-2.2 opens on mount and guards outside presses', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const mount = demo(page, 'default-open');
    await mount.getByRole('button', { name: 'Mount the drawers' }).click();
    const welcome = page.getByRole('dialog', { name: 'Welcome' });
    await expect(welcome).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Tips' })).toHaveCount(0);
    await settled(page);
    await page.keyboard.press('Escape');
    await expect(welcome).toHaveCount(0);
    await expect(mount.locator('[data-lab-output="default-open"]')).toHaveText(
      'Events: drawer closed',
    );

    const guarded = demo(page, 'guarded');
    await guarded.getByRole('button', { name: 'Edit the label' }).click();
    const drawer = page.getByRole('dialog', { name: 'Label' });
    await settled(page);
    await drawer.getByText('The label has unsaved changes').click();
    await page.mouse.click(100, viewport.height - 100);
    await expect(drawer).toBeVisible();
    await expect(guarded.locator('[data-lab-output="guarded"]')).toHaveText(
      'Last outside press: refused; closed 0 times',
    );
    await drawer.getByText('The label has unsaved changes').click();
    await page.mouse.click(100, viewport.height - 100);
    await expect(drawer).toHaveCount(0);
    await expect(guarded.locator('[data-lab-output="guarded"]')).toHaveText(
      'Last outside press: allowed; closed 1 times',
    );
  });

  test('UIC-DRAWER-1.2 keeps left and right physical while start and end follow a right-to-left page', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const sides = demo(page, 'physical');
    for (const [position, side] of [
      ['left', 'left'],
      ['right', 'right'],
      ['start', 'right'],
      ['end', 'left'],
    ] as const) {
      await sides.getByRole('button', { name: position, exact: true }).click();
      const panel = page.locator(`[data-lab-drawer="rtl-${position}"] .ui-drawer__panel`);
      await expect(page.getByRole('dialog', { name: `From ${position}` })).toBeVisible();
      await expect(async () => {
        const box = await boxOf(panel);
        if (side === 'left') expect(box.x).toBeLessThan(1);
        else expect(box.x + box.width).toBeGreaterThan(viewport.width - 1);
      }).toPass();
      await settled(page);
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
    }
  });

  test('UIC-DRAWER-2.3 dismisses only by a swipe in the chosen direction', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const swipes = demo(page, 'swipe-directions');
    const output = swipes.locator('[data-lab-output="swipe-directions"]');
    const drawer = page.locator('[data-lab-drawer="swipe-direction"]');
    // A negative wheel delta drags the panel right or down.
    for (const [direction, swipe, dismisses] of [
      ['right', { x: -viewport.width, y: 0 }, true],
      ['left', { x: -viewport.width, y: 0 }, false],
      ['vertical', { x: -viewport.width, y: 0 }, false],
      ['vertical', { x: 0, y: -viewport.height }, true],
    ] as const) {
      await swipes.getByRole('button', { name: direction, exact: true }).click();
      await swipes.getByRole('button', { name: 'Open the basket' }).click();
      await expect(drawer).toHaveAttribute('data-swipe-direction', direction);
      await settled(page);
      const panel = await boxOf(drawer.locator('.ui-drawer__panel'));
      await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height / 2);
      await page.mouse.wheel(swipe.x, swipe.y);
      if (dismisses) {
        await expect(drawer).toHaveCount(0);
        await expect(output).toHaveText(`swipeDirection ${direction}: dismissed (${direction})`);
      } else {
        await expect(drawer).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(drawer).toHaveCount(0);
      }
    }
  });
});
