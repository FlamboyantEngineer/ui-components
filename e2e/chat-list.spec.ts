import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const inbox = (page: Page) => page.locator('[data-lab-demo="inbox"]');
const grid = (page: Page) => inbox(page).getByRole('grid', { name: 'Conversations' });
const row = (page: Page, title: string) =>
  grid(page).getByRole('row', { name: new RegExp(`^${title}`) });
const cell = (page: Page, id: string) => matrixCell(page, id).locator(`.ui-chat-list`);

test.describe('Chat List lab', () => {
  test('UIC-CHAT-LIST-1.1 UIC-CHAT-LIST-1.2 UIC-CHAT-LIST-1.3 draws named rows with unread counts, muted marks and presence', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    await expect(
      inbox(page).getByRole('searchbox', { name: 'Search conversations' }),
    ).toBeVisible();
    await expect(inbox(page).getByRole('button', { name: 'New chat' })).toBeVisible();
    await expect(row(page, 'Ana Lima')).toHaveAccessibleName(
      'Ana Lima, Active, 2 unread messages, 4 minutes ago I can meet you at the river at noon.',
    );
    await expect(row(page, 'Recipe swap')).toHaveAttribute('data-muted', 'true');
    await expect(row(page, 'Recipe swap').locator('.ui-chat-list__unread')).toContainText('99+');
    await expect(row(page, 'Ana Lima').locator('.ui-avatar')).toHaveAttribute(
      'data-status',
      'active',
    );
    const preview = row(page, 'Lisbon trip').locator('.ui-chat-list__preview');
    expect(await preview.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    const muted = cell(page, 'kind=group state=muted-unread');
    await expect(muted.getByRole('row')).toHaveAttribute('data-unread', 'true');
    await expect(muted.getByRole('img', { name: 'Muted' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-CHAT-LIST-1.4 UIC-CHAT-LIST-1.5 selects by keyboard and reaches a row menu with the arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const log = page.locator('[data-lab-log="inbox"]');
    await expect(log).toHaveText('Open: Lisbon trip');
    await inbox(page).getByRole('button', { name: 'New chat' }).focus();
    await page.keyboard.press('Tab');
    await expect(row(page, 'Lisbon trip')).toBeFocused();
    await expect(row(page, 'Lisbon trip')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(row(page, 'Travel helper')).toBeFocused();
    await expect(log).toHaveText('Open: Lisbon trip');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(row(page, 'Ana Lima')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(log).toHaveText('Open: Ana Lima');
    await expect(row(page, 'Ana Lima')).toHaveAttribute('aria-selected', 'true');
    await expect(row(page, 'Ana Lima')).not.toHaveAttribute('data-unread');
    await page.keyboard.press('End');
    await expect(grid(page).getByRole('row').last()).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(row(page, 'Recipe swap')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    const more = page.getByRole('button', { name: 'More for Recipe swap' });
    await expect(more).toBeFocused();
    // Enter and Space open the menu after moving through the rows, and Escape returns to the button.
    for (const key of ['Enter', 'Space']) {
      await page.keyboard.press(key);
      await expect(page.getByRole('menu')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toHaveCount(0);
      await expect(more).toBeFocused();
    }
    await expect(log).toHaveText('Open: Ana Lima');
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Unmute' }).click();
    await expect(row(page, 'Recipe swap')).not.toHaveAttribute('data-muted');
    // The changed conversation redraws its row, and focus returns to the menu's button.
    await expect(more).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(row(page, 'Recipe swap')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(log).toHaveText('Open: Recipe swap');
  });

  test('UIC-CHAT-LIST-1.5 opens a row menu with Enter and Space and returns focus to its button', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const log = page.locator('[data-lab-log="inbox"]');
    const more = page.getByRole('button', { name: 'More for Recipe swap' });
    for (const key of ['Enter', 'Space']) {
      await row(page, 'Recipe swap').focus();
      await page.keyboard.press('ArrowRight');
      await expect(more).toBeFocused();
      await page.keyboard.press(key);
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible();
      await expect(menu.getByRole('menuitem').and(page.locator(':focus'))).toHaveCount(1);
      await expect(log).toHaveText('Open: Lisbon trip');
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
      await expect(more).toBeFocused();
    }
    // An action from the keyboard leaves the row's selection alone, and focus on the menu's button.
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /mute/i })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(row(page, 'Recipe swap')).not.toHaveAttribute('data-muted');
    await expect(more).toBeFocused();
    await expect(log).toHaveText('Open: Lisbon trip');
    // Up and Down on the button move between rows, as everywhere in the list.
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(row(page, 'Recipe swap')).not.toBeFocused();
  });

  test('UIC-CHAT-LIST-1.6 UIC-CHAT-LIST-1.9 searches by title and last message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const search = inbox(page).getByRole('searchbox', { name: 'Search conversations' });
    await search.fill('cafe');
    await expect(grid(page).getByRole('row')).toHaveCount(1);
    await expect(row(page, 'Lisbon trip').locator('mark')).toHaveText('café');
    await search.fill('garden');
    await expect(grid(page).getByRole('row')).toHaveCount(7);
    await search.fill('nothing like this');
    await expect(grid(page).getByRole('row')).toHaveText('No matching conversations');
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(row(page, 'Ana Lima')).toBeVisible();
    const hostSearch = page.locator('[data-lab-demo="host-search"]');
    await hostSearch.getByRole('searchbox').fill('book');
    await expect(hostSearch.getByRole('row')).toHaveCount(7);
    await expect(hostSearch.getByRole('row').first().locator('mark')).toHaveText('Book');
  });

  test('UIC-CHAT-LIST-1.8 UIC-CHAT-LIST-1.9 shows loading, empty and selected states', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const loading = cell(page, 'state=loading');
    await expect(loading).toHaveAttribute('data-loading', 'true');
    await expect(loading.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(loading.locator('.ui-chat-list__skeleton')).toHaveCount(4);
    await expect(loading.getByRole('status')).toHaveText('Loading conversations');
    await expect(cell(page, 'state=empty').locator('.ui-chat-list__empty')).toHaveText(
      'No conversations yet',
    );
    await expect(cell(page, 'state=custom-empty').locator('.ui-chat-list__empty')).toHaveText(
      'Say hello to your team.',
    );
    await expect(
      cell(page, 'state=selected').getByRole('row', { name: /^Lisbon trip/ }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('UIC-CHAT-LIST-1.6 UIC-CHAT-LIST-1.7 keeps the search and New chat inside a narrow list', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    for (const state of ['loading', 'empty', 'custom-empty', 'selected']) {
      const list = cell(page, `state=${state}`);
      const bounds = await list.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const header = element.querySelector('.ui-chat-list__header') as HTMLElement;
        const parts = [...header.children].map((part) => part.getBoundingClientRect());
        return {
          right: box.right,
          partsRight: Math.max(...parts.map((part) => part.right)),
          overflows: header.scrollWidth > header.clientWidth,
        };
      });
      expect(bounds.overflows, state).toBe(false);
      expect(bounds.partsRight, state).toBeLessThanOrEqual(bounds.right);
    }
  });
});

test('UIC-CHAT-LIST-1.3 reads the time with the caller fallback in the row and its name', async ({
  page,
  lab,
}) => {
  await lab.open('chat-list');
  const days = matrixCell(page, 'fallback=default').getByRole('row');
  await expect(days).toHaveAccessibleName('Museum visit, 4 days ago');
  const date = matrixCell(page, 'fallback=fallbackAfterDays 2').getByRole('row');
  await expect(date.locator('.ui-chat-list__time')).toHaveText('Apr 16, 2026, 9:00 AM');
  await expect(date).toHaveAccessibleName('Museum visit, Apr 16, 2026, 9:00 AM');
});
