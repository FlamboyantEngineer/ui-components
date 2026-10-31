import { expect, test, matrixCell } from './fixtures.js';

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
    const disabled = matrixCell(page, 'recovery=disabled width=480');
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

  test('UIC-INLINE-ERROR-2.1 UIC-INLINE-ERROR-2.2 draws tones and pending checks with their urgency', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    const cell = (tone: string, state: string) =>
      matrixCell(page, `tone=${tone} state=${state}`).locator(`.ui-inline-error`);
    await expect(cell('danger', 'settled')).toHaveAttribute('role', 'alert');
    for (const [tone, glyph] of [
      ['warning', 'warning'],
      ['success', 'success'],
    ] as const) {
      const message = cell(tone, 'settled');
      await expect(message).toHaveAttribute('role', 'status');
      await expect(message).toHaveAttribute('aria-live', 'polite');
      await expect(message.locator('.ui-inline-error__icon')).toHaveAttribute('data-glyph', glyph);
    }
    const colour = (tone: string) =>
      cell(tone, 'settled').evaluate((node) => getComputedStyle(node).color);
    expect(
      new Set([await colour('danger'), await colour('warning'), await colour('success')]).size,
    ).toBe(3);
    const pending = cell('danger', 'pending');
    await expect(pending).toHaveAttribute('role', 'status');
    await expect(pending).toHaveAttribute('data-pending', 'true');
    const spinner = pending.locator('.ui-inline-error__spinner');
    await expect(spinner).toBeVisible();
    expect(await spinner.evaluate((node) => getComputedStyle(node).width)).toBe('14px');
    await lab.expectAccessible();
  });
});
