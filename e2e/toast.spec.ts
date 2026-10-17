import { expect, test } from './fixtures.js';

test.describe('Toast lab', () => {
  test('UIC-TOAST-2.3 UIC-TOAST-3.1 draws every tone and content in place', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    const cells = page.locator('table[data-lab-matrix="tone content"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 4);
    for (const tone of ['info', 'success', 'warning', 'error']) {
      const toast = page.locator(`[data-lab-cell="tone=${tone} content=description"] .ui-toast`);
      await expect(toast).toHaveAttribute('data-tone', tone);
      await expect(toast.locator('.ui-toast__icon')).toHaveAttribute('data-glyph', tone);
    }
    await expect(page.locator('.ui-toast-region')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-TOAST-1.1 UIC-TOAST-2.1 UIC-TOAST-2.2 pushes toasts into a landmark without moving focus', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    const pushInfo = page.locator('[data-lab-push="info"]');
    await pushInfo.focus();
    await page.keyboard.press('Enter');
    const region = page.locator('.ui-toast-region');
    await expect(page.getByRole('region', { name: /^1 notification/ })).toBeVisible();
    await expect(pushInfo).toBeFocused();
    const viewport = page.viewportSize();
    const box = await region.boundingBox();
    expect(Math.round((box?.x ?? 0) + (box?.width ?? 0))).toBe((viewport?.width ?? 0) - 16);
    await page.locator('[data-lab-push="error"]').click();
    await expect(page.getByRole('region', { name: /^2 notifications/ })).toBeVisible();
    const titles = region.locator('.ui-toast__title');
    await expect(titles).toHaveText(['Upload failed', 'Draft saved']);
    await expect(
      region.getByRole('alertdialog', { name: 'Upload failed' }).locator('.ui-toast__content'),
    ).toHaveAttribute('role', 'alert');
    await expect(
      region.getByRole('alertdialog', { name: 'Draft saved' }).locator('.ui-toast__content'),
    ).toHaveAttribute('role', 'status');
    await lab.expectAccessible('.ui-toast-region');
  });

  test('UIC-TOAST-3.3 UIC-TOAST-3.4 runs the action or dismisses', async ({ page, lab }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="action"]').click();
    const region = page.locator('.ui-toast-region');
    await region.getByRole('button', { name: 'Undo' }).click();
    await expect(region.getByRole('alertdialog')).toHaveCount(0);
    await page.locator('[data-lab-push="replace"]').click();
    await page.locator('[data-lab-push="replace"]').click();
    await expect(region.locator('.ui-toast__title')).toHaveText(['Uploading 2 of 3']);
    await region.getByRole('button', { name: 'Dismiss' }).click();
    await expect(region.getByRole('alertdialog')).toHaveCount(0);
  });

  test('UIC-TOAST-1.2 closes short-lived toasts unless the region is hovered', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="short"]').click();
    const toast = page.getByRole('alertdialog', { name: 'Copied' });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 5000 });

    await page.locator('[data-lab-push="short"]').click();
    await page.getByRole('alertdialog', { name: 'Copied' }).hover();
    await page.waitForTimeout(2500);
    await expect(page.getByRole('alertdialog', { name: 'Copied' })).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByRole('alertdialog', { name: 'Copied' })).toHaveCount(0, {
      timeout: 5000,
    });
  });
});
