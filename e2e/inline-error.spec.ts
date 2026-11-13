import { cellSelector, expect, matrixCell, test } from './fixtures.js';

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
        `${cellSelector(`recovery=long label width=${width}`)} .ui-inline-error`,
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
      `${cellSelector('message=small host text')} .ui-inline-error__message`,
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
    const error = demo.locator('.ui-inline-error');
    const glyph = await error.locator('.ui-inline-error__icon').boundingBox();
    expect(glyph?.width).toBe(16);
    // The retry button sits beside the live message, so its label is not announced with it.
    const retry = error.getByRole('button', { name: 'Retry' });
    await expect(alert.getByRole('button')).toHaveCount(0);
    await retry.focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="loaded"]')).toBeVisible();
    await expect(demo.locator('[data-lab-output="attempts"]')).toHaveText('1');
    await expect(demo.getByRole('alert')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-INLINE-ERROR-1.3 hands rejected and thrown retries to onRetryError and recovers', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    const demo = page.locator('[data-lab-demo="recovery"]');
    const outcome = demo.getByRole('radiogroup', { name: 'Next retry' });
    const retry = demo.locator('.ui-inline-error').getByRole('button', { name: 'Retry' });
    const output = (name: string) => demo.locator(`[data-lab-output="${name}"]`);

    await outcome.getByRole('radio', { name: 'Rejects' }).click();
    await retry.click();
    await expect(retry).toHaveAttribute('data-pending', 'true');
    await expect(output('error')).toHaveText('The weather service timed out');
    await expect(retry).not.toHaveAttribute('data-pending', 'true');
    await expect(retry).toBeEnabled();
    await expect(output('tries')).toHaveText('1');
    await expect(output('attempts')).toHaveText('0');

    await outcome.getByRole('radio', { name: 'Throws at once' }).click();
    await retry.click();
    await expect(output('error')).toHaveText('No connection');
    await expect(output('tries')).toHaveText('2');
    await expect(retry).not.toHaveAttribute('data-pending', 'true');

    await outcome.getByRole('radio', { name: 'Succeeds' }).click();
    await retry.click();
    await expect(output('loaded')).toBeVisible();
    await expect(output('tries')).toHaveText('3');
    await expect(output('attempts')).toHaveText('1');
  });

  test('UIC-INLINE-ERROR-2.1 UIC-INLINE-ERROR-2.2 draws tones and pending checks with their urgency', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    const cell = (tone: string, state: string) =>
      matrixCell(page, `tone=${tone} state=${state}`).locator(`.ui-inline-error`);
    const live = (tone: string, state: string) =>
      cell(tone, state).locator('.ui-inline-error__message');
    await expect(live('danger', 'settled')).toHaveAttribute('role', 'alert');
    for (const [tone, glyph] of [
      ['warning', 'warning'],
      ['success', 'success'],
    ] as const) {
      await expect(live(tone, 'settled')).toHaveAttribute('role', 'status');
      await expect(live(tone, 'settled')).toHaveAttribute('aria-live', 'polite');
      await expect(cell(tone, 'settled').locator('.ui-inline-error__icon')).toHaveAttribute(
        'data-glyph',
        glyph,
      );
    }
    const colour = (tone: string) =>
      cell(tone, 'settled').evaluate((node) => getComputedStyle(node).color);
    expect(
      new Set([await colour('danger'), await colour('warning'), await colour('success')]).size,
    ).toBe(3);
    const pending = cell('danger', 'pending');
    await expect(live('danger', 'pending')).toHaveAttribute('role', 'status');
    await expect(pending).toHaveAttribute('data-pending', 'true');
    const spinner = pending.locator('.ui-inline-error__spinner');
    await expect(spinner).toBeVisible();
    expect(await spinner.evaluate((node) => getComputedStyle(node).width)).toBe('14px');
    await lab.expectAccessible();
  });
});
