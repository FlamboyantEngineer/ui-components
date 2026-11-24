import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

/** Drags a toast by its title along a screen direction, then releases it. */
async function drag(page: Page, toast: Locator, dx: number, dy: number) {
  const title = await toast.locator('.ui-toast__title').boundingBox();
  if (!title) throw new Error('not rendered');
  const x = title.x + 10;
  const y = title.y + title.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

test.describe('Toast lab coverage', () => {
  test('UIC-TOAST-3.3 UIC-TOAST-4.1 runs an action only once through its exit', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    await page.addStyleTag({
      content: `
      @keyframes held-toast-exit { from { opacity: 1 } to { opacity: 0 } }
      .ui-toast[data-exiting] { animation: held-toast-exit 1500ms linear; }
    `,
    });
    const demo = page.locator('[data-lab-demo="toast-batch"]');
    await demo.getByRole('button', { name: 'Show archive notification' }).press('Enter');
    const toast = page.getByRole('alertdialog', { name: 'File archived' });
    const undo = toast.getByRole('button', { name: 'Undo archive' });
    await undo.focus();
    await page.keyboard.press('Enter');
    await expect(toast).toHaveAttribute('data-exiting', 'true');
    await expect(undo).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(output(page, 'Undo count')).toHaveText('1');
    await expect(toast).toHaveCount(0);
    await expect(output(page, 'Archive dismissal count')).toHaveText('1');
  });

  for (const stylesheet of ['reference', 'shadcn']) {
    test(`UIC-TOAST-4.3 follows keyboard focus in an overflowing ${stylesheet} stack`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width: 390, height: 620 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await lab.open('toast', { stylesheet });
      await page.getByRole('button', { name: 'Add 18 notifications' }).press('Enter');
      const region = page.getByRole('region', { name: 'Batch notifications' });
      const oldest = region.getByRole('alertdialog', { name: 'Notification 1', exact: true });
      const dismiss = oldest.getByRole('button', { name: 'Dismiss' });
      await region.focus();
      await expect(region).toHaveAttribute('data-expanded', 'true');
      for (let index = 0; index < 36; index += 1) await page.keyboard.press('Tab');
      await expect(dismiss).toBeFocused();
      await expect(dismiss).toBeInViewport({ ratio: 1 });
      await page.keyboard.press('Enter');
      await expect(oldest).toHaveCount(0);
    });
  }

  test('UIC-TOAST-4.3 skips stack measurements for pointer events over a toast', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    await page.getByRole('button', { name: 'Add 18 notifications' }).press('Enter');
    const region = page.getByRole('region', { name: 'Batch notifications' });
    const newest = region.getByRole('alertdialog', { name: 'Notification 18' });
    await newest.hover();
    await expect(region).toHaveAttribute('data-expanded', 'true');
    const reads = await newest.evaluate((toast) => {
      const measure = Element.prototype.getBoundingClientRect;
      let reads = 0;
      Element.prototype.getBoundingClientRect = function measureToast() {
        if (this.matches('.ui-toast-region, .ui-toast')) reads += 1;
        return measure.call(this);
      };
      try {
        toast.dispatchEvent(
          new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }),
        );
        return reads;
      } finally {
        Element.prototype.getBoundingClientRect = measure;
      }
    });
    expect(reads).toBe(0);
  });

  test('UIC-TOAST-4.2 swipes in the chosen direction past the chosen threshold', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    const area = page.locator('[data-lab-demo="toast-swipe"]');
    const add = area.getByRole('button', { name: 'Add a toast' });
    const swiped = output(page, 'Swiped away');

    // end, left to right, in a list: a short drag springs back, a long one closes it.
    await add.click();
    let toast = area.locator('.ui-toast', { hasText: 'Crate 1 packed' });
    await expect(toast).toHaveAttribute('data-swipe-direction', 'right');
    await drag(page, toast, 80, 0);
    await expect(toast).toBeVisible();
    await expect(swiped).toHaveText('none');
    await drag(page, toast, 150, 0);
    await expect(toast).toHaveCount(0);
    await expect(swiped).toHaveText('crate 1');

    // end, right to left: it resolves to the left.
    await area.getByText('Right to left', { exact: true }).click();
    await add.click();
    toast = area.locator('.ui-toast', { hasText: 'Crate 2 packed' });
    await expect(toast).toHaveAttribute('data-swipe-direction', 'left');
    await drag(page, toast, -150, 0);
    await expect(swiped).toHaveText('crate 1, crate 2');

    // up, with a 40px threshold, in a region.
    await area.getByText('Right to left', { exact: true }).click();
    await area.getByRole('button', { name: 'up', exact: true }).click();
    const threshold = area.getByRole('textbox', { name: 'Swipe threshold (px)' });
    await threshold.fill('40');
    await threshold.press('Enter');
    await area.getByText('In a region', { exact: true }).click();
    await expect(output(page, 'Swipe settings')).toHaveText('up, 40px, left to right, region');
    await add.click();
    toast = page.locator('[data-lab-region="swipe"] .ui-toast', { hasText: 'Crate 3 packed' });
    await expect(toast).toHaveAttribute('data-swipe-direction', 'up');
    // A drag across the axis does nothing, and leaves no selection that would stop the next swipe.
    await drag(page, toast, 60, 0);
    await expect(toast).toBeVisible();
    await drag(page, toast, 0, -60);
    await expect(swiped).toHaveText('crate 1, crate 2, crate 3');
  });

  test('UIC-TOAST-1.5 updates keep, restart or stop the timer', async ({ page, lab }) => {
    await lab.open('toast');
    await page.mouse.move(0, 0);
    const area = page.locator('[data-lab-demo="toast-timer"]');
    const result = output(page, 'Timer result');
    const add = area.getByRole('button', { name: 'Add a 3 s toast' });

    await add.click();
    await area.getByRole('button', { name: 'Update, keep the timer' }).click();
    await expect(area.locator('.ui-toast__description')).toHaveText('Half done.');
    await expect(result).toHaveText(/^closed after (3|3\.5) s$/, { timeout: 6000 });

    await add.click();
    await page.waitForTimeout(1000);
    await area.getByRole('button', { name: 'Update, restart at 5 s' }).click();
    await expect(result).toHaveText(/^closed after (6|6\.5) s$/, { timeout: 9000 });

    await add.click();
    await area.getByRole('button', { name: 'Update, keep it open' }).click();
    await page.waitForTimeout(4000);
    await expect(result).toHaveText('open');
    await area.getByRole('button', { name: /Dismiss|Close/ }).click();
    await expect(result).toHaveText(/^closed after/);
  });
});
