import { expect, test } from './fixtures.js';

test.describe('Button lab', () => {
  test('UIC-BUTTON-1.2 UIC-BUTTON-1.3 draws every variant at four block sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const cells = page.locator('table[data-lab-matrix="variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(9 * 4);
    for (const [size, height] of [
      ['xs', 22],
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
    ] as const) {
      const box = await page
        .locator(`[data-lab-cell="variant=secondary size=${size}"] .ui-button`)
        .boundingBox();
      expect(box?.height).toBe(height);
    }
  });

  test('UIC-BUTTON-1.1 UIC-BUTTON-2.4 activates by keyboard and shows keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const button = page.locator('[data-lab-cell="variant=primary size=md"] .ui-button');
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toHaveAttribute('data-focus-visible', 'true');
    await button.hover();
    await expect(button).toHaveAttribute('data-hovered', 'true');
  });

  test('UIC-BUTTON-2.1 keeps a focusable disabled button in the tab order', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const disabled = page.locator('[data-lab-cell="variant=primary state=disabled"] .ui-button');
    const focusable = page.locator(
      '[data-lab-cell="variant=primary state=focusable disabled"] .ui-button',
    );
    await expect(disabled).toHaveAttribute('disabled', '');
    await expect(focusable).not.toHaveAttribute('disabled');
    await expect(focusable).toHaveAttribute('aria-disabled', 'true');
    const selected = page.locator('[data-lab-cell="variant=primary state=selected"] .ui-button');
    await selected.focus();
    await page.keyboard.press('Tab');
    await expect(focusable).toBeFocused();
    await lab.expectAccessible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-BUTTON-1.7 shows the hint and shortcut in the tooltip and publishes aria-keyshortcuts in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('button', { theme });
      const cell = (hint: string, state: string) =>
        page.locator(`[data-lab-cell="hint=${hint} state=${state}"] .ui-button`);
      const both = cell('tooltip and shortcut', 'default');
      await expect(both).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+S');
      await expect(cell('tooltip', 'default')).not.toHaveAttribute('aria-keyshortcuts');
      await cell('shortcut', 'pending').focus();
      await page.keyboard.press('Tab');
      await expect(both).toBeFocused();
      const tooltip = page.getByRole('tooltip', { name: /Save every change/ });
      await expect(tooltip).toBeVisible();
      await expect(tooltip.locator('.ui-shortcut__key')).toHaveText(['Ctrl', 'Shift', 'S']);
      await expect(both).toHaveAccessibleDescription('Save every change Control Shift S');
      await expect(tooltip).toHaveText(/^Save every change Ctrl\+Shift\+S/);
      await lab.expectAccessible();

      await page.keyboard.press('Control+Shift+S');
      await expect(both).toBeFocused();
      await expect(both).not.toHaveAttribute('data-pending');
      const alone = cell('shortcut', 'focusable disabled');
      await alone.focus();
      await expect(page.getByRole('tooltip', { name: 'Control Shift S' })).toBeVisible();
    });
  }
});
