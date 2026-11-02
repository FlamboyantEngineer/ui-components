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
