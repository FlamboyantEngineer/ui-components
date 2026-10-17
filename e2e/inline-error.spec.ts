import { expect, test } from './fixtures.js';

test.describe('Inline Error lab', () => {
  test('UIC-INLINE-ERROR-1.3 moves recovery below a narrow message without overflowing', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    for (const [width, below] of [
      ['280', true],
      ['480', false],
    ] as const) {
      const error = page.locator(
        `[data-lab-cell="recovery=long label width=${width}"] .ui-inline-error`,
      );
      const message = await error.locator('.ui-inline-error__message').boundingBox();
      const retry = await error
        .getByRole('button', { name: 'Reload the current versions' })
        .boundingBox();
      const messageBottom = (message?.y ?? 0) + (message?.height ?? 0);
      if (below) expect(retry?.y ?? 0).toBeGreaterThanOrEqual(messageBottom - 1);
      else expect(retry?.y ?? 0).toBeLessThan(messageBottom);
      expect(await error.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
    const disabled = page.locator('[data-lab-cell="recovery=disabled width=480"]');
    await expect(disabled.getByRole('button', { name: 'Retry' })).toBeDisabled();
    const small = page.locator(
      '[data-lab-cell="message=small host text"] .ui-inline-error__message',
    );
    expect(await small.evaluate((node) => getComputedStyle(node).fontSize)).toBe('11px');
  });

  test('UIC-INLINE-ERROR-1.1 UIC-INLINE-ERROR-1.3 retries by keyboard from a single alert', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    const demo = page.locator('[data-lab-demo="recovery"]');
    const alert = demo.getByRole('alert');
    await expect(alert).toHaveText(/Could not load the weather for Oslo/);
    await expect(alert).toHaveAttribute('aria-live', 'assertive');
    const glyph = await alert.locator('.ui-inline-error__icon').boundingBox();
    expect(glyph?.width).toBe(16);
    const retry = alert.getByRole('button', { name: 'Retry' });
    await retry.focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="loaded"]')).toBeVisible();
    await expect(demo.locator('[data-lab-output="attempts"]')).toHaveText('1');
    await expect(demo.getByRole('alert')).toHaveCount(0);
    await lab.expectAccessible();
  });
});
