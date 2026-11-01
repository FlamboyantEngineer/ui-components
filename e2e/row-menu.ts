import type { Locator, Page } from '@playwright/test';
import { expect } from './fixtures.js';

/**
 * Reaches a row's menu button from the keyboard with `reach`, opens its menu with Enter and with
 * Space, closes it with Escape, then picks its Pin item, and expects focus back on the button each
 * time, not on its row.
 */
export async function expectRowMenuReturnsFocus(
  page: Page,
  button: Locator,
  reach: () => Promise<void>,
) {
  for (const key of ['Enter', 'Space']) {
    await reach();
    await expect(button).toBeFocused();
    await page.keyboard.press(key);
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Pin' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(button).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Pin' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(button).toBeFocused();
}
