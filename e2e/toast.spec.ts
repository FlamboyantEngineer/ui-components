import { expect, test } from './fixtures.js';

test.describe('Toast lab', () => {
  test('UIC-TOAST-2.3 UIC-TOAST-3.1 draws every tone and content in place', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    const cells = page.locator('table[data-lab-matrix="tone content"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 4);
    const glyphs = { info: 'info', success: 'success', warning: 'warning', danger: 'error' };
    for (const [tone, glyph] of Object.entries(glyphs)) {
      const toast = page.locator(`[data-lab-cell="tone=${tone} content=description"] .ui-toast`);
      await expect(toast).toHaveAttribute('data-tone', tone);
      await expect(toast.locator('.ui-toast__icon')).toHaveAttribute('data-glyph', glyph);
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
    await page.locator('[data-lab-push="danger"]').click();
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

  test('UIC-TOAST-1.5 UIC-TOAST-3.6 updates a pending toast in place', async ({ page, lab }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="pending"]').click();
    const toast = page.locator('.ui-toast-region .ui-toast');
    await expect(toast).toHaveAttribute('data-pending', 'true');
    await expect(toast.locator('.ui-toast__spinner')).toBeVisible();
    await expect(toast.locator('.ui-toast__icon')).toHaveCount(0);
    await toast.evaluate((node) => node.setAttribute('data-lab-mark', 'same'));
    await page.locator('[data-lab-action="advance"]').click();
    await expect(toast.locator('.ui-toast__title')).toHaveText('Uploading 2 of 3');
    await expect(toast).toHaveAttribute('data-lab-mark', 'same');
    await page.locator('[data-lab-action="advance"]').click();
    await expect(toast).toHaveAttribute('data-tone', 'success');
    await expect(toast).not.toHaveAttribute('data-pending');
    await expect(toast.getByRole('status')).toHaveText('Three files uploaded');
    await expect(toast).toHaveAttribute('data-lab-mark', 'same');
    await lab.expectAccessible('.ui-toast-region');
  });

  test('UIC-TOAST-1.6 settles a promise toast into success or error', async ({ page, lab }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="promise"]').click();
    const saving = page.getByRole('alertdialog', { name: 'Saving recipes' });
    await expect(saving).toHaveAttribute('data-pending', 'true');
    await page.locator('[data-lab-action="resolve"]').click();
    const saved = page.getByRole('alertdialog', { name: '12 recipes saved' });
    await expect(saved).toHaveAttribute('data-tone', 'success');
    await expect(saved).not.toHaveAttribute('data-pending');
    await page.locator('[data-lab-push="promise"]').click();
    await page.locator('[data-lab-action="reject"]').click();
    const failed = page.getByRole('alertdialog', { name: 'Recipes not saved' });
    await expect(failed).toHaveAttribute('data-tone', 'danger');
    await expect(failed.getByRole('alert')).toContainText('Check your connection.');
  });

  test('UIC-TOAST-4.1 UIC-ENTER-EXIT-1.3 plays the enter and exit of a toast', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    // Slow the reference motion so each phase holds until the test finishes it.
    await page.addStyleTag({
      content:
        '.ui-toast { animation-duration: 60s !important; transition-duration: 60s !important; }',
    });
    const finish = (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const running = node.getAnimations();
        for (const animation of running) animation.finish();
        return running.length;
      });
    await page.locator('[data-lab-push="action"]').click();
    const toast = page.getByRole('alertdialog', { name: 'Row deleted' });
    await expect(toast).toHaveAttribute('data-entering', 'true');
    expect(await finish('.ui-toast-region .ui-toast')).toBeGreaterThan(0);
    await expect(toast).not.toHaveAttribute('data-entering');
    await toast.getByRole('button', { name: 'Dismiss' }).click();
    await expect(toast).toHaveAttribute('data-exiting', 'true');
    await expect(toast).toBeVisible();
    expect(await finish('.ui-toast-region .ui-toast')).toBeGreaterThan(0);
    await expect(toast).toHaveCount(0);
    await expect(page.locator('.ui-toast-region')).toHaveCount(0);
  });

  test('UIC-TOAST-4.2 swipes a toast away to the right', async ({ page, lab }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="action"]').click();
    const toast = page.getByRole('alertdialog', { name: 'Row deleted' });
    await expect(toast).toHaveAttribute('data-swipe-direction', 'right');
    const title = await toast.locator('.ui-toast__title').boundingBox();
    const startX = (title?.x ?? 0) + 10;
    const y = (title?.y ?? 0) + (title?.height ?? 0) / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + 20, y, { steps: 4 });
    await expect(toast).toHaveAttribute('data-swiping', 'true');
    await page.mouse.up();
    await expect(toast).not.toHaveAttribute('data-swiping');
    await expect(toast).toBeVisible();

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + 90, y, { steps: 6 });
    await expect(toast).toHaveAttribute('style', /--ui-toast-swipe-x: 90px/);
    await page.mouse.up();
    await expect(toast).toHaveCount(0);
  });

  test('UIC-TOAST-1.2 UIC-TOAST-4.3 expands while the region holds focus, and only then', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    await page.mouse.move(0, 0);
    const pushShort = page.locator('[data-lab-push="short"]');
    const region = page.locator('.ui-toast-region');
    await pushShort.focus();
    await page.keyboard.press('Enter');
    await expect(region).toBeVisible();
    await expect(async () => {
      await page.keyboard.press('F6');
      await expect(region).toBeFocused({ timeout: 100 });
    }).toPass();
    await expect(region).toHaveAttribute('data-expanded', 'true');
    await page.waitForTimeout(2000);
    await expect(region.getByRole('alertdialog', { name: 'Copied' })).toBeVisible();

    await region.getByRole('button', { name: 'Dismiss' }).focus();
    await page.keyboard.press('Enter');
    await expect(region).toHaveCount(0);
    await pushShort.focus();
    await page.keyboard.press('Enter');
    await expect(region).toBeVisible();
    await expect(region).not.toHaveAttribute('data-expanded');
    await expect(region).toHaveCount(0, { timeout: 5000 });
  });

  test('UIC-TOAST-4.3 piles toasts and spreads them while the region is hovered', async ({
    page,
    lab,
  }) => {
    await lab.open('toast');
    await page.locator('[data-lab-push="action"]').click();
    await page.locator('[data-lab-push="replace"]').click();
    const region = page.locator('.ui-toast-region');
    const newer = region.getByRole('alertdialog', { name: 'Uploading 1 of 3' });
    const older = region.getByRole('alertdialog', { name: 'Row deleted' });
    await expect(older).toHaveAttribute('style', /--ui-toast-index: 1/);
    await expect(newer).toHaveAttribute('style', /--ui-toast-index: 0/);
    const newerHeight = (await newer.boundingBox())?.height ?? 0;
    await expect(older).toHaveAttribute('style', new RegExp(`--ui-toast-offset: ${newerHeight}px`));
    // Let the pile settle, then compare: piled toasts overlap; spread ones stack upwards.
    await expect
      .poll(async () => {
        const top = (await older.boundingBox())?.y ?? 0;
        const front = (await newer.boundingBox())?.y ?? 0;
        return front - top;
      })
      .toBeLessThan(newerHeight);
    await expect(region).not.toHaveAttribute('data-expanded');
    await newer.hover();
    await expect(region).toHaveAttribute('data-expanded', 'true');
    await expect
      .poll(async () => {
        const top = await older.boundingBox();
        const front = await newer.boundingBox();
        return (front?.y ?? 0) - ((top?.y ?? 0) + (top?.height ?? 0));
      })
      .toBeGreaterThanOrEqual(7);
    await lab.expectAccessible('.ui-toast-region');
  });
});
