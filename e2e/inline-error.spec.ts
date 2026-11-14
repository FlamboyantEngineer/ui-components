import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Inline Error lab', () => {
  test('UIC-INLINE-ERROR-1.3 flows suggested actions after the message and wraps them whole', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-error');
    for (const [width, wraps] of [
      ['280', true],
      ['480', false],
    ] as const) {
      const error = page.locator(
        `${cellSelector(`recovery=two actions width=${width}`)} .ui-inline-error`,
      );
      const message = await error.locator('.ui-inline-error__message').boundingBox();
      const retry = await error.getByRole('button', { name: 'Retry' }).boundingBox();
      const reload = await error
        .getByRole('button', { name: 'Reload the current version' })
        .boundingBox();
      // Retry sits on the message's line, right after its last word.
      expect(Math.abs((retry?.y ?? 0) - (message?.y ?? 0))).toBeLessThan(4);
      expect(retry?.x ?? 0).toBeGreaterThan((message?.x ?? 0) + (message?.width ?? 0) - 1);
      // The second link wraps onto the next line, under the message's start, only when it cannot fit.
      if (wraps) {
        expect(reload?.y ?? 0).toBeGreaterThan((retry?.y ?? 0) + (retry?.height ?? 0) - 1);
        expect(Math.abs((reload?.x ?? 0) - (message?.x ?? 0))).toBeLessThan(10);
      } else {
        expect(Math.abs((reload?.y ?? 0) - (retry?.y ?? 0))).toBeLessThan(2);
      }
      expect(await error.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      // Links are text, like the message, with no frame of their own.
      const link = error.getByRole('button', { name: 'Retry' });
      await expect(link).toHaveAttribute('data-variant', 'link');
      expect(await link.locator('svg').count()).toBe(0);
    }
    const icons = matrixCell(page, 'recovery=icons width=480');
    await expect(icons.getByRole('button', { name: 'Retry' }).locator('svg')).toHaveCount(1);
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
    // The Retry link sits beside the live message, so its label is not announced with it.
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
    expect(await spinner.evaluate((node) => getComputedStyle(node).width)).toBe('16px');
    await lab.expectAccessible();
  });
});
