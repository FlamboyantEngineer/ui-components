import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="editing"]');
const output = (page: Page) => demo(page).locator('[data-lab-output]');
const event = (page: Page, title: string) =>
  demo(page).getByRole('button', { name: new RegExp(`^${title},`) });
const editor = (page: Page) => page.getByRole('dialog', { name: 'Edit event' });

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

  test('UIC-CALENDAR-VIEW-5.2 edits the title and times, refusing a range that ends first', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await event(page, 'Planning').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const dialog = editor(page);
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('Planning');
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toBeFocused();
    await lab.expectAccessible('[role="dialog"]');
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Quarterly planning');
    // An end before the start disables Save.
    await dialog.getByRole('spinbutton', { name: 'hour, End Date, When' }).fill('8');
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await dialog.getByRole('spinbutton', { name: 'hour, End Date, When' }).fill('11');
    await dialog.getByRole('spinbutton', { name: 'day, Start Date, When' }).fill('17');
    await dialog.getByRole('spinbutton', { name: 'day, End Date, When' }).fill('17');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(output(page)).toHaveText(
      'Saved Quarterly planning: 2026-03-17T09:00 to 2026-03-17T11:30',
    );
    // Focus returns to the moved event, on its new day.
    await expect(event(page, 'Quarterly planning')).toBeFocused();
    await expect(
      demo(page).getByRole('gridcell', { name: /^Tuesday, March 17, 2026/ }),
    ).toContainText('Quarterly planning');

    // Cancel and Escape keep the event.
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await editor(page).getByRole('textbox', { name: 'Title' }).fill('Discarded');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(editor(page)).toBeHidden();
    await expect(event(page, 'Quarterly planning')).toBeFocused();
    // The host heard Edit, and no save.
    await expect(output(page)).toHaveText('edit on Quarterly planning');
  });

  test('UIC-CALENDAR-VIEW-5.2 makes an event all-day in the week view and edits from +n more', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await demo(page).getByRole('radio', { name: 'Week' }).click();
    await event(page, 'Design review').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await editor(page).getByText('All day').click();
    await expect(
      editor(page).getByRole('spinbutton', { name: 'day, Start Date, When' }),
    ).toHaveText('18');
    await editor(page).getByRole('button', { name: 'Save' }).click();
    await expect(output(page)).toHaveText('Saved Design review: 2026-03-18 to 2026-03-18');
    await expect(event(page, 'Design review')).toHaveAttribute('data-all-day', 'true');

    await demo(page).getByRole('radio', { name: 'Month' }).click();
    await demo(page).getByRole('button', { name: /more$/ }).first().click();
    const list = page.locator('.ui-calendar-view__more-list');
    await list.getByRole('button', { name: /^Supplier call,/ }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(editor(page).getByRole('textbox', { name: 'Title' })).toHaveValue('Supplier call');
    await editor(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(list.getByRole('button', { name: /^Supplier call,/ })).toBeFocused();
  });

  test('UIC-CALENDAR-VIEW-5.2 makes an event ending at midnight all-day on its one day', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await event(page, 'Evening backup').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await editor(page).getByText('All day').click();
    await expect(editor(page).getByRole('spinbutton', { name: 'day, End Date, When' })).toHaveText(
      '23',
    );
    await editor(page).getByRole('button', { name: 'Save' }).click();
    await expect(output(page)).toHaveText('Saved Evening backup: 2026-03-23 to 2026-03-23');
  });

  test('UIC-CALENDAR-VIEW-5.2 closes the editor when its event is removed', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await demo(page).getByRole('radio', { name: 'Week' }).click();
    await demo(page).getByRole('button', { name: 'Remove Design review in two seconds' }).click();
    await event(page, 'Design review').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(editor(page)).toBeVisible();
    await expect(editor(page)).toBeHidden();
    await expect(
      demo(page).getByRole('gridcell', { name: /^Wednesday, March 18, 2026/ }),
    ).toBeFocused();
    await expect(output(page)).toHaveText('edit on Design review');
  });

  test('UIC-CALENDAR-VIEW-2.2 UIC-CALENDAR-VIEW-5.2 opens the editor on a single click and saves', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    await event(page, 'Dentist').click();
    const dialog = editor(page);
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('Dentist');
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Dentist check-up');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(output(page)).toHaveText(
      'Saved Dentist check-up: 2026-03-27T08:30 to 2026-03-27T09:15',
    );
    await expect(event(page, 'Dentist check-up')).toBeFocused();

    // A click in a crowded day's list opens it too; a locked event opens nothing.
    await demo(page).getByRole('button', { name: /more$/ }).first().click();
    const list = page.locator('.ui-calendar-view__more-list');
    await list.getByRole('button', { name: /^Supplier call,/ }).click();
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('Supplier call');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(list.getByRole('button', { name: /^Supplier call,/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await event(page, 'Release 2\\.4 \\(locked\\)').click();
    await expect(dialog).toHaveCount(0);
  });
});
