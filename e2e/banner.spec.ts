import { expect, test } from './fixtures.js';

test.describe('Banner lab', () => {
  test('UIC-BANNER-2.1 UIC-BANNER-1.2 announces each tone with its role and glyph', async ({
    page,
    lab,
  }) => {
    await lab.open('banner');
    for (const [tone, role, live, glyph] of [
      ['neutral', 'status', 'polite', null],
      ['info', 'status', 'polite', 'info'],
      ['success', 'status', 'polite', 'success'],
      ['warning', 'status', 'polite', 'warning'],
      ['danger', 'alert', 'assertive', 'error'],
    ] as const) {
      const banner = page.locator(`[data-lab-cell="tone=${tone} content=description"] .ui-banner`);
      await expect(banner).toHaveAttribute('role', role);
      await expect(banner).toHaveAttribute('aria-live', live);
      await expect(banner).toHaveAttribute('aria-atomic', 'true');
      const icon = banner.locator('.ui-banner__icon');
      if (glyph) {
        await expect(icon).toHaveAttribute('data-glyph', glyph);
        const box = await icon.boundingBox();
        expect(box?.width).toBe(16);
      } else {
        await expect(icon).toHaveCount(0);
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-BANNER-1.1 UIC-BANNER-1.3 lays out content, actions and dismiss on one row', async ({
    page,
    lab,
  }) => {
    await lab.open('banner');
    const banner = page.locator(
      '[data-lab-cell="tone=info content=actions and dismiss"] .ui-banner',
    );
    const content = await banner.locator('.ui-banner__content').boundingBox();
    const actions = await banner.locator('.ui-banner__actions').boundingBox();
    const dismiss = await banner.getByRole('button', { name: 'Dismiss' }).boundingBox();
    expect(actions?.x ?? 0).toBeGreaterThan(content?.x ?? 0);
    expect(dismiss?.x ?? 0).toBeGreaterThan(actions?.x ?? 0);
    await expect(banner.locator('.ui-banner__title')).toHaveText('Heads up');
  });

  test('UIC-BANNER-2.2 UIC-BANNER-1.3 updates one live region and dismisses by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('banner');
    const banner = page.locator('[data-lab-banner="live"]');
    await expect(banner).toHaveAttribute('role', 'status');
    await banner.evaluate((node) => node.setAttribute('data-lab-mark', 'same'));
    await page.locator('[data-lab-tone="danger"]').click();
    await expect(banner).toHaveAttribute('role', 'alert');
    await expect(banner).toHaveAttribute('aria-live', 'assertive');
    await expect(banner).toContainText('Could not save');
    await expect(banner).toHaveAttribute('data-lab-mark', 'same');
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toContainText('All changes saved');
    await expect(banner).toHaveAttribute('data-lab-mark', 'same');

    const dismiss = banner.getByRole('button', { name: 'Dismiss the save message' });
    await dismiss.focus();
    await page.keyboard.press('Enter');
    await expect(banner).toBeHidden();
    await expect(page.locator('[data-lab-output="dismissed"]')).toHaveText('1');
    await page.locator('[data-lab-action="restore"]').click();
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('data-lab-mark', 'same');
  });

  test('UIC-BANNER-3.2 UIC-ENTER-EXIT-1.2 UIC-ENTER-EXIT-1.3 enters and exits with useEnterExit', async ({
    page,
    lab,
  }) => {
    await lab.open('banner');
    // Slow the reference animations so each phase holds until the test finishes it.
    await page.addStyleTag({
      content:
        '[data-lab-demo="enter-exit"] .ui-banner { animation-duration: 60s !important; transition-duration: 60s !important; }',
    });
    const demo = page.locator('[data-lab-demo="enter-exit"]');
    const banner = demo.locator('.ui-banner');
    const finishAnimations = () =>
      banner.evaluate((node) => {
        const running = node.getAnimations();
        for (const animation of running) animation.finish();
        return running.length;
      });
    await expect(banner).toHaveCount(0);

    await demo.getByRole('button', { name: 'Show notice' }).click();
    await expect(banner).toHaveAttribute('data-entering', 'true');
    expect(await finishAnimations()).toBeGreaterThan(0);
    await expect(banner).not.toHaveAttribute('data-entering');
    await expect(banner).toHaveText('Report.pdf uploaded.');

    await banner.getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner).toHaveAttribute('data-exiting', 'true');
    await expect(banner).toBeVisible();
    expect(await finishAnimations()).toBeGreaterThan(0);
    await expect(banner).toHaveCount(0);
    await expect(demo.getByRole('button', { name: 'Show notice' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-BANNER-1.5 moves keyboard focus to a newly shown critical banner', async ({
    page,
    lab,
  }) => {
    await lab.open('banner');
    const demo = page.locator('[data-lab-demo="auto-focus"]');
    await demo.getByRole('button', { name: 'Save recipe' }).focus();
    await page.keyboard.press('Enter');
    const banner = demo.getByRole('alert');
    await expect(banner).toBeFocused();
    await expect(banner).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Tab');
    await expect(banner.getByRole('button', { name: 'Try again' })).toBeFocused();
    await lab.expectAccessible();
    await page.keyboard.press('Enter');
    await expect(banner).toHaveCount(0);
  });
});
