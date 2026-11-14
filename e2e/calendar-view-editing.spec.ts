import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="editing"]');
const output = (page: Page) => demo(page).locator('[data-lab-output]');
const event = (page: Page, title: string) =>
  demo(page).getByRole('button', { name: new RegExp(`^${title},`) });

async function menuItems(page: Page, name: string) {
  const menu = page.getByRole('menu', { name });
  await menu.waitFor();
  return menu.getByRole('menuitem').allTextContents();
}

test.describe('Calendar View event editing', () => {
  test('UIC-CALENDAR-VIEW-5.1 opens the event menu by pointer and keyboard on the exact event', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await event(page, 'Dentist').click({ button: 'right' });
    expect(await menuItems(page, 'Dentist actions')).toEqual(['Edit', 'Duplicate', 'Delete']);
    await lab.expectAccessible('[role="menu"]');
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(output(page)).toHaveText('duplicate on Dentist');
    await expect(event(page, 'Dentist \\(copy\\)')).toBeVisible();
    await event(page, 'Dentist \\(copy\\)').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(event(page, 'Dentist \\(copy\\)')).toHaveCount(0);

    // A locked event offers only the host's entries.
    await event(page, 'Release 2\\.4 \\(locked\\)').click({ button: 'right' });
    expect(await menuItems(page, 'Release 2.4 (locked) actions')).toEqual(['Duplicate', 'Delete']);
    await page.keyboard.press('Escape');

    // The keyboard opens it below the focused event; Escape gives focus back.
    await event(page, 'Planning').focus();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menu', { name: 'Planning actions' }).waitFor();
    const box = await event(page, 'Planning').boundingBox();
    const menuBox = await page.getByRole('menu', { name: 'Planning actions' }).boundingBox();
    expect(menuBox?.y).toBeGreaterThanOrEqual((box?.y ?? 0) + (box?.height ?? 0) - 1);
    await page.keyboard.press('Escape');
    await expect(event(page, 'Planning')).toBeFocused();
    await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  });
});
