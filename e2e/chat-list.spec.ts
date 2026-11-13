import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

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

  test('UIC-CHAT-LIST-1.4 UIC-CHAT-LIST-1.5 selects by keyboard with the arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const log = page.locator('[data-lab-log="inbox"]');
    await expect(log).toHaveText('Open: Lisbon trip');
    await inbox(page).getByRole('searchbox', { name: 'Search conversations' }).focus();
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
    await page.keyboard.press('Space');
    await expect(log).toHaveText('Open: Recipe swap');
  });

  test('UIC-CHAT-LIST-2.1 opens a row context menu by secondary click, keys and touch, and returns focus to the row', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const log = page.locator('[data-lab-log="inbox"]');
    const recipe = row(page, 'Recipe swap');
    await recipe.scrollIntoViewIfNeeded();
    const box = await recipe.boundingBox();
    if (!box) throw new Error('no row');
    const at = { x: box.x + 40, y: box.y + box.height / 2 };
    await page.mouse.click(at.x, at.y, { button: 'right' });
    const menu = page.getByRole('menu', { name: 'Actions for Recipe swap' });
    await expect(menu).toBeVisible();
    await expect(recipe).toHaveAttribute('data-menu-open', 'true');
    const popover = await page.locator('.ui-menu-popover').boundingBox();
    expect(Math.abs((popover?.x ?? 0) - at.x)).toBeLessThan(2);
    await expect(menu.getByRole('menuitem').and(page.locator(':focus'))).toHaveCount(1);
    await expect(recipe).toHaveAttribute('data-muted', 'true');
    await menu.getByRole('menuitem', { name: 'Unmute' }).click();
    await expect(menu).toHaveCount(0);
    await expect(recipe).not.toHaveAttribute('data-muted');
    await expect(recipe).toBeFocused();
    await expect(recipe).not.toHaveAttribute('data-menu-open');
    await expect(log).toHaveText('Open: Lisbon trip');
    for (const key of ['Shift+F10', 'ContextMenu']) {
      await page.keyboard.press(key);
      await expect(menu).toBeVisible();
      const below = await page.locator('.ui-menu-popover').boundingBox();
      expect(below?.y ?? 0).toBeGreaterThanOrEqual(box.y + box.height - 2);
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
      await expect(recipe).toBeFocused();
    }
    const touch = {
      pointerType: 'touch',
      pointerId: 5,
      isPrimary: true,
      clientX: at.x,
      clientY: at.y,
    };
    const ana = row(page, 'Ana Lima');
    await ana.dispatchEvent('pointerdown', touch);
    await expect(page.getByRole('menu', { name: 'Actions for Ana Lima' })).toBeVisible({
      timeout: 2000,
    });
    // Lifting the finger after the menu opened opens no conversation.
    await ana.dispatchEvent('pointerup', touch);
    await expect(page.getByRole('menu', { name: 'Actions for Ana Lima' })).toBeVisible();
    await expect(log).toHaveText('Open: Lisbon trip');
    await page.keyboard.press('Escape');
    await expect(ana).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="inbox"]');
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
    await expect(loading.locator('.ui-chat-list__skeleton')).toHaveCount(6);
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

  test('UIC-CHAT-LIST-1.8 UIC-CHAT-LIST-1.11 shapes placeholder rows like the rows they stand for', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const box = (locator: ReturnType<typeof cell>) =>
      locator.evaluate((element) => element.getBoundingClientRect().toJSON() as DOMRect);
    const titles = cell(page, 'shape=titles state=isLoading');
    const placeholders = titles.locator('.ui-chat-list__skeleton');
    await expect(placeholders).toHaveCount(6);
    expect((await box(placeholders.first())).height).toBeGreaterThanOrEqual(34);
    const lineWidth = (index: number) =>
      placeholders
        .nth(index)
        .locator('.ui-skeleton-text__line')
        .evaluate((element) => element.getBoundingClientRect().width);
    expect(await lineWidth(0)).not.toBe(await lineWidth(1));
    const avatars = cell(page, 'shape=avatars state=isLoading').locator('.ui-chat-list__skeleton');
    const avatar = await box(avatars.first().locator('.ui-chat-list__skeleton-start'));
    expect(avatar.width).toBe(avatar.height);
    await expect(avatars.first().locator('.ui-skeleton-text__line')).toHaveCount(2);
    const more = cell(page, 'shape=icons state=isLoadingMore');
    await expect(more).toHaveAttribute('data-loading-more', 'true');
    await expect(more.getByRole('row')).toHaveCount(3);
    await expect(more.locator('.ui-chat-list__skeleton')).toHaveCount(2);
    const loadMore = more.getByRole('button', { name: 'Loading' });
    await expect(loadMore).toHaveAttribute('data-pending', 'true');
    const label = await box(loadMore.locator('.ui-button__label'));
    const spinner = await box(loadMore.locator('.ui-button__spinner'));
    expect(spinner.left).toBeGreaterThanOrEqual(label.right);
    await expect(loadMore.locator('.ui-button__label')).toHaveCSS('opacity', '1');
    await lab.expectAccessible();
  });

  test('UIC-CHAT-LIST-1.8 UIC-CHAT-LIST-1.11 shows placeholder rows while a slow host loads', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const slow = page.locator('[data-lab-demo="slow-history"]');
    const list = slow.locator('.ui-chat-list');
    await page.getByRole('button', { name: 'Reload the history' }).click();
    await expect(list).toHaveAttribute('data-loading', 'true');
    await expect(list.locator('.ui-chat-list__skeleton')).toHaveCount(6);
    await expect(list).not.toHaveAttribute('data-loading');
    await expect(list.getByRole('row')).toHaveCount(10);
    await list.getByRole('button', { name: 'Load more' }).click();
    await expect(list).toHaveAttribute('data-loading-more', 'true');
    await expect(list.locator('.ui-chat-list__skeleton')).toHaveCount(2);
    await expect(list.getByRole('status')).toHaveText('Loading more conversations');
    await expect(list.getByRole('button', { name: 'Loading' })).toBeFocused();
    await expect(list.getByRole('row')).toHaveCount(20);
    await expect(list).not.toHaveAttribute('data-loading-more');
    await expect(list.locator('.ui-chat-list__skeleton')).toHaveCount(0);
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

test.describe('Chat List history', () => {
  const history = (page: Page) => page.locator('[data-lab-demo="history"]');
  const recents = (page: Page) => history(page).getByRole('grid', { name: 'Recents' });

  test('UIC-CHAT-LIST-1.2 UIC-CHAT-LIST-1.12 draws titles under a heading with marks, activity and a context menu', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    await expect(history(page).getByRole('searchbox')).toHaveCount(0);
    await expect(history(page).locator('.ui-chat-list__heading')).toHaveText('Recents');
    const rows = recents(page).getByRole('row');
    await expect(rows).toHaveCount(10);
    await expect(rows.nth(1)).toHaveAccessibleName('Sourdough starter schedule');
    await expect(rows.nth(0).locator('.ui-chat-list__avatar')).toHaveCount(0);
    await expect(rows.nth(0)).toHaveAccessibleName(
      'Planning a vegetable garden, Earlier versions, Working',
    );
    await expect(rows.nth(0).locator('.ui-chat-list__activity-dot')).toHaveCount(3);
    await expect(rows.nth(2).getByRole('img', { name: 'Earlier versions' })).toBeVisible();
    await expect(history(page).getByRole('button', { name: /^More for/ })).toHaveCount(0);
    // A title alone keeps the row to one line, its mark at the row's end.
    const box = await rows.nth(3).evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      row: element.getBoundingClientRect().right,
      mark: (element.querySelector('.ui-chat-list__status') as HTMLElement).getBoundingClientRect()
        .right,
    }));
    expect(box.height).toBeLessThan(40);
    expect(box.row - box.mark).toBeLessThan(16);
    await rows.nth(1).focus();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(
      recents(page).getByRole('row', { name: 'Sourdough starter schedule' }),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-CHAT-LIST-1.11 fades the last rows only with showEdgeFades and loads the next page', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const list = history(page).locator('.ui-chat-list');
    await expect(list).toHaveAttribute('data-has-more', 'true');
    await expect(list).not.toHaveAttribute('data-edge-fades');
    const rows = recents(page).getByRole('row');
    const opacity = (index: number) =>
      rows.nth(index).evaluate((element) => Number(getComputedStyle(element).opacity));
    expect(await opacity(9)).toBe(1);
    await page.getByText('Fade the last rows', { exact: true }).click();
    await expect(list).toHaveAttribute('data-edge-fades', 'true');
    expect(await opacity(0)).toBe(1);
    expect(await opacity(8)).toBeLessThan(1);
    expect(await opacity(9)).toBeLessThan(await opacity(8));
    await history(page).getByRole('button', { name: 'Load more' }).click();
    await expect(rows).toHaveCount(20);
    await expect(list).not.toHaveAttribute('data-has-more');
    await expect(history(page).getByRole('button', { name: 'Load more' })).toHaveCount(0);
    expect(await opacity(19)).toBe(1);
  });

  test('UIC-CHAT-LIST-1.7 starts a conversation from the New chat row', async ({ page, lab }) => {
    await lab.open('chat-list');
    await history(page).getByRole('button', { name: 'New chat' }).click();
    const first = recents(page).getByRole('row').first();
    await expect(first).toHaveAccessibleName('New chat');
    await expect(first).toHaveAttribute('aria-selected', 'true');
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
