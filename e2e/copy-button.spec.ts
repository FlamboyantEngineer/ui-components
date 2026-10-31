import { expect, test, controlHeight } from './fixtures.js';

test.describe('Copy Button lab', () => {
  test('UIC-COPY-BUTTON-1.4 draws every variant, size and state', async ({ page, lab }) => {
    await lab.open('copy-button');
    const button = (state: string, variant: string, size: string) =>
      page.locator(
        `[data-lab-cell="state=${state} variant=${variant} size=${size}"] .ui-copy-button__button`,
      );
    await expect(button('rest', 'ghost', 'md')).toHaveClass(/ui-button/);
    await expect(button('rest', 'secondary', 'sm')).toHaveAttribute('data-variant', 'secondary');
    await expect(button('disabled', 'ghost', 'lg')).toBeDisabled();
    const sizes = await Promise.all(
      ['xs', 'sm', 'md', 'lg'].map(
        async (size) => (await button('rest', 'ghost', size).boundingBox())?.height,
      ),
    );
    expect(sizes).toEqual(
      await Promise.all(
        (['xs', 'sm', 'md', 'lg'] as const).map((size) => controlHeight(page, size)),
      ),
    );
    await lab.expectAccessible();
  });

  test('UIC-COPY-BUTTON-1.1 UIC-COPY-BUTTON-1.3 copies by keyboard, confirms and announces for the timeout', async ({
    page,
    lab,
    baseURL,
  }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL ?? 'http://127.0.0.1/').origin,
    });
    await page.clock.install();
    await lab.open('copy-button');
    await page.clock.pauseAt(Date.now() + 1000);
    const demo = page.locator('[data-lab-demo="copy"]');
    const root = demo.locator('.ui-copy-button');
    const button = demo.getByRole('button', { name: 'Copy the order number' });
    const status = root.locator('.ui-copy-button__status');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveText('');
    await expect(button.locator('.ui-button__icon')).toHaveAttribute('data-glyph', 'copy');

    await button.focus();
    await page.keyboard.press('Enter');
    await expect(root).toHaveAttribute('data-copied', 'true');
    await expect(status).toHaveText('Copied');
    await expect(button).toHaveAccessibleName('Copy the order number');
    await expect(button.locator('.ui-button__icon')).toHaveAttribute('data-glyph', 'check');
    await expect(demo.locator('[data-lab-output="outcome"]')).toHaveText('Last copy: copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ORD-2026-0417');
    await expect(button).toBeFocused();

    await page.clock.runFor(1999);
    await expect(root).toHaveAttribute('data-copied', 'true');
    await page.clock.runFor(1);
    await expect(root).not.toHaveAttribute('data-copied');
    await expect(status).toHaveText('');
    await expect(button.locator('.ui-button__icon')).toHaveAttribute('data-glyph', 'copy');

    // Axe times itself with timers, so the clock runs again before checking the copied state.
    await page.clock.resume();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Copied');
    await lab.expectAccessible();
  });

  test('UIC-CLIPBOARD-2.1 preserves latest feedback and reset across pending writes', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('copy-button');
    await page.clock.pauseAt(Date.now() + 1000);
    const demo = page.locator('[data-lab-demo="feedback"]');
    const status = demo.getByRole('status');
    await demo.getByRole('button', { name: 'Start earlier copy' }).click();
    await demo.getByRole('button', { name: 'Copy latest' }).click();
    await expect(status).toHaveText('Feedback: copied');
    await demo.getByRole('button', { name: 'Refuse earlier copy' }).click();
    await expect(status).toHaveText('Feedback: copied');
    await demo.getByRole('button', { name: 'Start earlier copy' }).click();
    await demo.getByRole('button', { name: 'Reset feedback' }).click();
    await demo.getByRole('button', { name: 'Refuse earlier copy' }).click();
    await expect(status).toHaveText('Feedback: idle');
  });
});
