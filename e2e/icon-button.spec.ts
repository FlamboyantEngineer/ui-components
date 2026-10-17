import { expect, test } from './fixtures.js';

test.describe('Icon Button lab', () => {
  test('UIC-ICON-BUTTON-1.1 UIC-ICON-BUTTON-1.2 draws named square buttons at four sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-button');
    for (const [size, edge] of [
      ['xs', 22],
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
    ] as const) {
      const button = page
        .locator(`[data-lab-cell="variant=ghost size=${size}"]`)
        .getByRole('button', {
          name: 'More actions',
        });
      const box = await button.boundingBox();
      expect(box?.width).toBe(edge);
      expect(box?.height).toBe(edge);
    }
  });

  test('UIC-ICON-BUTTON-1.3 shows pending and selected states accessibly', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-button');
    await expect(
      page.locator('[data-lab-cell="variant=ghost state=pending"] .ui-icon-button__spinner'),
    ).toBeVisible();
    await expect(
      page.locator('[data-lab-cell="variant=ghost state=selected"] .ui-icon-button'),
    ).toHaveAttribute('aria-pressed', 'true');
    await lab.expectAccessible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-ICON-BUTTON-1.6 names the command before its shortcut in the tooltip in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('icon-button', { theme });
      const undo = page.locator('[data-lab-cell="hint=shortcut size=md"] .ui-icon-button');
      await expect(undo).toHaveAttribute('aria-keyshortcuts', 'Control+Z');
      // React Aria opens a tooltip on keyboard focus, so arrive with Tab.
      await page.locator('[data-lab-cell="hint=shortcut size=sm"] .ui-icon-button').focus();
      await page.keyboard.press('Tab');
      await expect(undo).toBeFocused();
      const tooltip = page.getByRole('tooltip', { name: 'Undo Control Z' });
      await expect(tooltip).toBeVisible();
      await expect(tooltip.locator('.ui-shortcut__key')).toHaveText(['Ctrl', 'Z']);
      await expect(undo).toHaveAccessibleName('Undo');
      await lab.expectAccessible();
      await page
        .locator('[data-lab-cell="hint=tooltip and shortcut size=md"] .ui-icon-button')
        .focus();
      await expect(
        page.getByRole('tooltip', { name: 'Undo the last edit Control Z' }),
      ).toBeVisible();
    });
  }

  test('UIC-ICON-BUTTON-1.7 names the button with a tooltip that repeats its label', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-button');
    const demo = page.locator('[data-lab-demo="tooltip-name"]');
    const rename = demo.getByRole('button', { name: 'Rename' });
    const remove = demo.getByRole('button', { name: 'Delete' });
    await remove.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(rename).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText('Rename');
    await expect(rename).not.toHaveAttribute('aria-describedby');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveText('Delete the selected rows');
    await expect(remove).toHaveAccessibleDescription('Delete the selected rows');
    await lab.expectAccessible();
  });

  test('UIC-ICON-BUTTON-1.8 toggles its state and renders an icon link', async ({ page, lab }) => {
    await lab.open('icon-button');
    const demo = page.locator('[data-lab-demo="toggle-link"]');
    const toggle = demo.getByRole('button', { name: 'Show hidden files' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('data-selected', 'true');
    const link = demo.getByRole('link', { name: 'Open help' });
    await expect(link).toHaveAttribute('href', '#help');
    await expect(link).toHaveClass(/ui-icon-button/);
  });
});
