import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';
import { expectRowMenuReturnsFocus } from './row-menu.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const cards = (board: Locator, column: string) =>
  board.getByRole('grid', { name: column, exact: true }).getByRole('row');
const titles = (board: Locator) => board.locator('.ui-board__column-title').allTextContents();

test.describe('Board lab', () => {
  test('UIC-BOARD-1.1 lines every card up with its column header', async ({ page, lab }) => {
    await lab.open('board');
    const mismatches = await page.evaluate(() => {
      const found: string[] = [];
      for (const card of document.querySelectorAll('.ui-board__card')) {
        const cell = card.closest('.ui-board__cell');
        const board = card.closest('.ui-board');
        if (!cell?.parentElement || !board) continue;
        const cells = [...cell.parentElement.children].filter((child) =>
          child.classList.contains('ui-board__cell'),
        );
        const headers = [...board.querySelectorAll('.ui-board__column')].filter(
          (header) => header.closest('.ui-board') === board,
        );
        const header = headers[cells.indexOf(cell)];
        if (!header) continue;
        const a = card.getBoundingClientRect();
        const b = header.getBoundingClientRect();
        if (Math.abs(a.left - b.left) > 0.5 || Math.abs(a.right - b.right) > 0.5) {
          found.push(`${board.getAttribute('aria-label')}: ${card.textContent?.slice(0, 20)}`);
        }
      }
      return found;
    });
    expect(mismatches).toEqual([]);
    // Every lab board has cards to compare, collapsed columns, lanes and right to left included.
    expect(await page.locator('.ui-board__card').count()).toBeGreaterThan(20);
  });

  test('UIC-BOARD-1.1 returns focus to a menu button in a card as its menu closes', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'card-menus');
    await expectRowMenuReturnsFocus(
      page,
      board.getByRole('button', { name: 'More for Order seeds' }),
      async () => {
        await board.getByRole('row', { name: 'Order seeds' }).focus();
        await page.keyboard.press('ArrowRight');
      },
    );
    await expect(board.locator('[data-lab-output]')).toHaveText('pin seeds');
  });

  test('UIC-BOARD-2.3 UIC-BOARD-3.2 moves typed cards and columns without sharing focus', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'typed-board');
    await board.getByRole('row', { name: 'Text card' }).focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(cards(board, 'Numeric column')).toHaveText(['Numeric card']);
    await expect(cards(board, 'Text column')).toHaveText(['Text card']);
    await expect(board.getByRole('row', { name: 'Text card' })).toBeFocused();
    const handle = board.getByRole('button', { name: 'Move column Text column' });
    await handle.focus();
    await page.keyboard.press('Alt+ArrowLeft');
    expect(await titles(board)).toEqual(['Text column', 'Numeric column']);
    await expect(handle).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="typed-board"]');
  });

  test('UIC-BOARD-2.3 yields focus to a control the application focuses as a move settles', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'typed-board');
    const handle = board.getByRole('button', { name: 'Move column Text column' });
    // The application focuses the column handle the moment the moved card takes focus, while the
    // move's focus retries are still settling.
    await board.getByRole('row', { name: 'Text card' }).focus();
    await handle.evaluate((button: HTMLElement) => {
      const onFocusIn = (event: FocusEvent) => {
        const row = event.target as HTMLElement;
        if (row.getAttribute('role') !== 'row' || !row.textContent?.includes('Text card')) return;
        document.removeEventListener('focusin', onFocusIn, true);
        queueMicrotask(() => button.focus());
      };
      document.addEventListener('focusin', onFocusIn, true);
    });
    await page.keyboard.press('Alt+ArrowRight');
    await expect(cards(board, 'Text column')).toHaveText(['Text card']);
    await expect(handle).toBeFocused();
    // Past every retry frame, the handle keeps focus, and the next shortcut moves its column.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let frames = 10;
          const next = () => (--frames === 0 ? resolve() : requestAnimationFrame(next));
          requestAnimationFrame(next);
        }),
    );
    await expect(handle).toBeFocused();
    await page.keyboard.press('Alt+ArrowLeft');
    expect(await titles(board)).toEqual(['Text column', 'Numeric column']);
  });

  test('UIC-BOARD-1.1 UIC-BOARD-1.2 UIC-BOARD-1.4 UIC-BOARD-1.5 UIC-BOARD-4.1 shows counts, limits, empty and collapsed columns', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const cell = (state: string) => matrixCell(page, `state=${state}`);
    const board = cell('cards').getByRole('group', { name: 'Chores, cards' });
    await expect(cards(board, 'To do')).toHaveText([
      'Order seedsUrgent',
      'Repaint the fence',
      'Replace the cracked tiles',
    ]);
    await expect(board.locator('.ui-board__column-count').first()).toContainText('3 cards');
    const over = cell('over limit').locator('.ui-board__column');
    await expect(over).toHaveAttribute('data-over-limit', 'true');
    await expect(over.locator('.ui-board__column-count')).toContainText('5/2');
    await expect(over.locator('.ui-board__column-count')).toContainText(
      '5 cards, over the limit of 2',
    );
    const empty = cell('empty').getByRole('grid', { name: 'To do' });
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty.locator('.ui-board__empty')).toHaveText('No cards');
    const collapsed = cell('collapsed');
    await expect(collapsed.locator('.ui-board__column[data-collapsed]')).toHaveCount(1);
    await expect(collapsed.getByRole('grid', { name: 'Doing' }).getByRole('row')).toHaveText([
      'Trim the hedge',
      'Fit a spice shelf',
    ]);
    await collapsed.getByRole('button', { name: 'Expand Doing' }).click();
    await expect(collapsed.getByRole('grid', { name: 'Doing' }).getByRole('row')).toHaveText([
      'Trim the hedge',
      'Fit a spice shelfBlocked',
    ]);
    await lab.expectAccessible();
  });

  test('UIC-BOARD-2.2 UIC-BOARD-2.4 moves a card to another column by pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    await cards(board, 'To do')
      .filter({ hasText: 'Repaint the fence' })
      .dragTo(cards(board, 'Review').first(), { targetPosition: { x: 60, y: 30 } });
    await expect(board.locator('[data-lab-output]')).toHaveText(
      'Last move: Repaint the fence to Review, after Fix the dripping tap',
    );
    await expect(cards(board, 'Review')).toHaveText(['Fix the dripping tap', 'Repaint the fence']);
    await expect(cards(board, 'To do')).toHaveCount(2);
    await expect(board.locator('[data-dragging], [data-drop-target]')).toHaveCount(0);
  });

  test('UIC-BOARD-2.2 keeps the cards mounted when moves turn off and on', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const card = cards(board, 'To do').filter({ hasText: 'Repaint the fence' });
    // A mark on the card element survives only while the card stays mounted.
    await card.evaluate((row) => row.setAttribute('data-lab-mark', ''));
    await expect(board.locator('.ui-board__cards[data-reordering]').first()).toBeVisible();
    await board.getByRole('button', { name: 'Arrange' }).click();
    await expect(board.locator('.ui-board__cards[data-reordering]')).toHaveCount(0);
    await expect(card.locator('.ui-board__card-handle')).toHaveCount(0);
    await expect(card).not.toHaveAttribute('draggable');
    await expect(card).toHaveAttribute('data-lab-mark', '');
    await board.getByRole('button', { name: 'Arrange' }).click();
    await expect(card.locator('.ui-board__card-handle')).toBeVisible();
    await expect(card).toHaveAttribute('data-lab-mark', '');
  });

  test('UIC-BOARD-2.2 moves a card to another column by keyboard from its handle', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    await cards(board, 'To do').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(board.getByRole('button', { name: 'Drag Order seeds' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(board.locator('.ui-board__drop-indicator[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(board.locator('[data-lab-output]')).toContainText(
      'Last move: Order seeds to Doing',
    );
    await expect(cards(board, 'Doing')).toHaveCount(3);
    await expect(board.locator('.ui-board__column').nth(1)).toHaveAttribute(
      'data-over-limit',
      'true',
    );
  });

  test('UIC-BOARD-2.3 moves the focused card with Alt+Arrow keys and keeps focus on it', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const seeds = board.getByRole('row', { name: 'Order seeds' });
    await expect(seeds).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight',
    );
    await seeds.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(cards(board, 'To do')).toHaveText([
      'Repaint the fence',
      'Order seedsUrgent',
      'Replace the cracked tiles',
    ]);
    await expect(seeds).toBeFocused();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(board.locator('[data-lab-output]')).toHaveText(
      'Last move: Order seeds to Doing, before Fit a spice shelf',
    );
    await expect(board.getByRole('row', { name: 'Order seeds' })).toBeFocused();
    await expect(cards(board, 'Doing')).toHaveCount(3);
  });

  test('UIC-BOARD-3.1 UIC-BOARD-3.2 reorders columns by pointer and by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const header = (title: string) => board.locator('.ui-board__column').filter({ hasText: title });
    await header('Done').dragTo(header('Doing'), { targetPosition: { x: 120, y: 20 } });
    await expect(board.locator('[data-lab-output]')).toHaveText(
      'Last column move: done before doing',
    );
    expect(await titles(board)).toEqual(['To do', 'Done', 'Doing', 'Review']);
    const handle = board.getByRole('button', { name: 'Move column To do' });
    await handle.focus();
    await page.keyboard.press('Alt+ArrowRight');
    expect(await titles(board)).toEqual(['Done', 'To do', 'Doing', 'Review']);
    await expect(handle).toBeFocused();
    await expect(board.getByRole('grid', { name: 'To do' }).locator('xpath=..')).toBeVisible();
  });

  test('UIC-BOARD-3.2 drags a column by keyboard from its handle', async ({ page, lab }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    await board.getByRole('button', { name: 'Move column To do' }).focus();
    await page.keyboard.press('Enter');
    await expect(board.locator('.ui-board__column[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(board.locator('[data-lab-output]')).toHaveText(
      'Last column move: todo after review',
    );
    expect(await titles(board)).toEqual(['Doing', 'Review', 'To do', 'Done']);
  });

  test('UIC-BOARD-1.9 runs column actions by keyboard and pointer without moving the column', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const output = board.locator('[data-lab-output]');
    await board.getByRole('button', { name: 'Collapse Doing' }).focus();
    await page.keyboard.press('Tab');
    const menu = board.getByRole('button', { name: 'Doing actions' });
    await expect(menu).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Sort by title' }).press('Enter');
    await expect(output).toHaveText('Sorted Doing');
    await expect(cards(board, 'Doing')).toHaveText(['Fit a spice shelfBlocked', 'Trim the hedge']);
    await expect(board.locator('.ui-board__column[data-collapsed]')).toHaveCount(0);
    const header = (title: string) => board.locator('.ui-board__column').filter({ hasText: title });
    await board
      .getByRole('button', { name: 'Done actions' })
      .dragTo(header('Doing'), { targetPosition: { x: 120, y: 20 } });
    expect(await titles(board)).toEqual(['To do', 'Doing', 'Review', 'Done']);
    await expect(output).toHaveText('Sorted Doing');
    await expect(board.locator('[data-dragging], [data-drop-target]')).toHaveCount(0);
    await board.getByRole('button', { name: 'Review actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear column' }).click();
    await expect(output).toHaveText('Cleared Review');
    await expect(board.getByRole('grid', { name: 'Review' })).toHaveAttribute('data-empty', 'true');
    await lab.expectAccessible('[data-lab-demo="moves"]');
  });

  test('UIC-BOARD-1.6 adds a card to the cell whose button is pressed', async ({ page, lab }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const add = board.getByRole('button', { name: 'Add card' }).nth(3);
    await expect(add).toHaveAccessibleDescription('Done');
    await add.click();
    await expect(cards(board, 'Done')).toHaveText(['Clean the pond', 'New chore 8']);
  });

  test('UIC-BOARD-1.4 follows collapsed columns and lanes owned by the host', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const section = demo(page, 'controlled-collapse');
    const out = (name: string) => section.locator(`[data-lab-output="${name}"]`);
    await expect(section.getByRole('button', { name: 'Expand Doing' })).toBeVisible();
    await expect(out('collapsed-columns')).toHaveText('doing');
    await section.getByRole('button', { name: 'Collapse Done only' }).click();
    await expect(section.getByRole('button', { name: 'Expand Done' })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Collapse Doing' })).toBeVisible();
    await section.getByRole('button', { name: 'Collapse To do' }).click();
    await expect(out('collapsed-columns')).toHaveText('done, todo');
    await section.getByRole('button', { name: 'Reopen every column' }).click();
    await expect(section.locator('.ui-board__column[data-collapsed]')).toHaveCount(0);
    await section.getByRole('button', { name: 'Collapse the Kitchen lane' }).click();
    await expect(section.getByRole('group', { name: 'Kitchen', exact: true })).toHaveAttribute(
      'data-collapsed',
      'true',
    );
    await section.getByRole('button', { name: 'Expand Kitchen' }).click();
    await expect(out('collapsed-lanes')).toHaveText('none');
    await expect(out('controlled-stored')).toHaveText('columns nothing; lanes nothing');
    await lab.expectAccessible('[data-lab-demo="controlled-collapse"]');
  });

  test('UIC-BOARD-1.4 starts lanes collapsed and remembers changes over the default', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const section = () => demo(page, 'default-lanes');
    const kitchen = () => section().getByRole('group', { name: 'Kitchen', exact: true });
    await expect(kitchen()).toHaveAttribute('data-collapsed', 'true');
    await section().getByRole('button', { name: 'Expand Kitchen' }).click();
    await expect(kitchen()).not.toHaveAttribute('data-collapsed');
    await expect(section().locator('[data-lab-output="lane-changes"]')).toHaveText('none');
    await page.reload();
    await expect(kitchen()).not.toHaveAttribute('data-collapsed');
    await expect(section().locator('[data-lab-output="default-stored"]')).toContainText('lanes []');
    await section().getByRole('button', { name: 'Forget the stored sets' }).click();
    await page.reload();
    await expect(kitchen()).toHaveAttribute('data-collapsed', 'true');
  });

  test('UIC-BOARD-1.3 UIC-BOARD-1.4 repeats columns in collapsible lanes', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'lanes');
    const kitchen = board.getByRole('group', { name: 'Kitchen' });
    await expect(kitchen.getByRole('grid', { name: 'Review Kitchen' }).getByRole('row')).toHaveText(
      ['Fix the dripping tap'],
    );
    await board.getByRole('button', { name: 'Collapse Kitchen' }).click();
    await expect(kitchen).toHaveAttribute('data-collapsed', 'true');
    await expect(kitchen.getByRole('grid')).toHaveCount(0);
    await board.getByRole('button', { name: 'Collapse Review' }).click();
    await expect(board.locator('.ui-board__cell[data-collapsed]')).toHaveCount(1);
    await lab.expectAccessible('[data-lab-demo="lanes"]');
  });

  test('UIC-BOARD-1.1 scrolls a narrow board sideways under its overlay thumb', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await lab.open('board');
    const frame = demo(page, 'moves');
    const board = frame.locator('.ui-board').first();
    const viewport = board.locator('.ui-board__viewport > .ui-scroll-region__viewport');
    const thumb = board.locator(
      '.ui-board__viewport > .ui-scroll-region__track > .ui-scroll-region__thumb[data-orientation="horizontal"]',
    );
    // The board keeps to its container; its columns overflow its viewport, not the page.
    const [frameBox, boardBox] = await Promise.all([frame.boundingBox(), board.boundingBox()]);
    expect((boardBox?.width ?? 0) - (frameBox?.width ?? 0)).toBeLessThanOrEqual(0.5);
    expect(await viewport.evaluate((view) => view.scrollWidth > view.clientWidth)).toBe(true);
    // The overlay thumb takes no layout room: no native scrollbar below the cells.
    expect(
      await viewport.evaluate((view: HTMLElement) => view.offsetHeight - view.clientHeight),
    ).toBe(0);
    await expect(thumb).toBeVisible();
    const before = (await thumb.boundingBox())?.x ?? 0;
    await viewport.evaluate((view) => view.scrollTo({ left: view.scrollWidth }));
    await expect.poll(async () => (await thumb.boundingBox())?.x ?? 0).toBeGreaterThan(before + 20);
  });

  test('UIC-BOARD-1.7 draws an overlay thumb over a virtualized list that tracks and drags it', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const grid = demo(page, 'virtualized').getByRole('grid', { name: 'To do' });
    const frame = demo(page, 'virtualized').locator('.ui-board__list', {
      has: page.getByRole('grid', { name: 'To do' }),
    });
    const thumb = frame.locator('.ui-scroll-region__thumb[data-orientation="vertical"]');
    await grid.scrollIntoViewIfNeeded();
    await expect(thumb).toBeVisible();
    await expect(thumb).toHaveAttribute('aria-controls', (await grid.getAttribute('id')) ?? '');
    // The list hides its native scrollbar; the thumb lies over the list's edge.
    expect(await grid.evaluate((list: HTMLElement) => list.offsetWidth - list.clientWidth)).toBe(0);
    const [gridBox, thumbBox] = await Promise.all([grid.boundingBox(), thumb.boundingBox()]);
    expect((thumbBox?.x ?? 0) + (thumbBox?.width ?? 0)).toBeLessThanOrEqual(
      (gridBox?.x ?? 0) + (gridBox?.width ?? 0) + 0.5,
    );
    expect(thumbBox?.y ?? 0).toBeGreaterThanOrEqual((gridBox?.y ?? 0) - 0.5);
    // It tracks the list's own scrolling…
    await grid.evaluate((list) => list.scrollTo(0, list.scrollHeight / 2));
    await expect
      .poll(async () => (await thumb.boundingBox())?.y ?? 0)
      .toBeGreaterThan((thumbBox?.y ?? 0) + 40);
    // …and dragging it scrolls the list.
    const top = await grid.evaluate((list) => list.scrollTop);
    const box = await thumb.boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 60, { steps: 4 });
    await page.mouse.up();
    expect(await grid.evaluate((list) => list.scrollTop)).toBeGreaterThan(top + 100);
  });

  test('UIC-BOARD-1.7 routes the wheel to the list it is over and to the page elsewhere', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'virtualized');
    const grid = board.getByRole('grid', { name: 'To do' });
    const thumb = board
      .locator('.ui-board__list', { has: page.getByRole('grid', { name: 'To do' }) })
      .locator('.ui-scroll-region__thumb[data-orientation="vertical"]');
    const pageTop = () => page.evaluate(() => window.scrollY);
    const listTop = () => grid.evaluate((list) => list.scrollTop);
    /** Centres the list in the window, then wheels over a point of `target` read afterwards. */
    const wheelOver = async (target: Locator, deltaY: number, at = { x: 0.5, y: 0.5 }) => {
      await grid.evaluate((list) => list.scrollIntoView({ block: 'center' }));
      const box = await target.boundingBox();
      await page.mouse.move(
        (box?.x ?? 0) + (box?.width ?? 0) * at.x,
        (box?.y ?? 0) + (box?.height ?? 0) * at.y,
      );
      const before = { page: await pageTop(), list: await listTop() };
      await page.mouse.wheel(0, deltaY);
      return before;
    };
    // The board's sideways viewport contains only sideways chaining.
    await expect(board.locator('.ui-board__viewport > .ui-scroll-region__viewport')).toHaveCSS(
      'overscroll-behavior-y',
      'auto',
    );
    // Over the board, outside any list, the wheel scrolls the page.
    let before = await wheelOver(board.locator('.ui-board__column').first(), 200);
    await expect.poll(pageTop).toBeGreaterThan(before.page + 100);
    // Over a list that can move, it scrolls the list and leaves the page alone.
    before = await wheelOver(grid, 300);
    await expect.poll(listTop).toBeGreaterThan(before.list + 100);
    expect(await pageTop()).toBe(before.page);
    // Over the overlay thumb it scrolls the list too.
    before = await wheelOver(thumb, 300);
    await expect.poll(listTop).toBeGreaterThan(before.list + 100);
    expect(await pageTop()).toBe(before.page);
    // Once the list is at its end, the wheel over it, and then outside the board, scrolls the page.
    await grid.evaluate((list) => list.scrollTo(0, list.scrollHeight));
    await expect.poll(listTop).toBeGreaterThan(1000);
    before = await wheelOver(grid, 200);
    await expect.poll(pageTop).toBeGreaterThan(before.page + 100);
    before = await wheelOver(board, 200, { x: 0.5, y: -0.2 });
    await expect.poll(pageTop).toBeGreaterThan(before.page + 100);
  });

  test('UIC-BOARD-1.7 renders only the cards in view of a long cell', async ({ page, lab }) => {
    await lab.open('board');
    const grid = demo(page, 'virtualized').getByRole('grid', { name: 'To do' });
    await expect(grid).toHaveAttribute('data-virtualized', 'true');
    const count = await grid.getByRole('row').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(60);
    await grid.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect(grid.getByRole('row', { name: 'Inventory item 500' })).toBeVisible();
  });

  test('UIC-BOARD-1.7 keeps the cards in view, focus and state when virtualization turns off and on', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'virtualized');
    const grid = board.getByRole('grid', { name: 'To do' });
    const first = (await grid.getByRole('row').first().textContent()) ?? '';
    await grid.evaluate((element) => element.scrollTo(0, 2000));
    // Wait for the list to render the cards now in view before picking one.
    await expect(grid.getByRole('row', { name: first, exact: true })).toHaveCount(0);
    const card = grid.getByRole('row').nth(3);
    const name = (await card.textContent()) ?? '';
    const named = grid.getByRole('row', { name, exact: true });
    // A mark on the card element survives only while the card stays mounted.
    await named.evaluate((row) => row.setAttribute('data-lab-mark', ''));
    await named.focus();
    const toggle = board.getByRole('button', { name: 'Virtualize' });
    for (const virtualized of [false, true]) {
      await toggle.dispatchEvent('click');
      if (virtualized) await expect(grid).toHaveAttribute('data-virtualized', 'true');
      else await expect(grid).not.toHaveAttribute('data-virtualized');
      await expect(named).toHaveAttribute('data-lab-mark', '');
      await expect(named).toBeFocused();
      const count = await grid.getByRole('row').count();
      if (virtualized) expect(count).toBeLessThan(60);
      else expect(count).toBe(400);
    }
  });

  test('UIC-BOARD-1.7 UIC-BOARD-2.3 keeps focus on a card moved into a virtualized cell out of view', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const todo = demo(page, 'virtualized').getByRole('grid', { name: 'To do' });
    const done = demo(page, 'virtualized').getByRole('grid', { name: 'Done' });
    await todo.evaluate((element) => element.scrollTo(0, element.scrollHeight / 2));
    // The virtualizer renders the scrolled rows a frame or more later: wait until the first rendered
    // row is no longer the column's first, then pin the card by name.
    await expect
      .poll(async () => Number(await todo.getByRole('row').first().getAttribute('aria-rowindex')))
      .toBeGreaterThan(10);
    const name = (await todo.getByRole('row').nth(4).textContent()) ?? '';
    const card = todo.getByRole('row', { name, exact: true });
    await card.focus();
    await page.keyboard.press('Alt+ArrowRight');
    const moved = done.getByRole('row', { name, exact: true });
    await expect(moved).toBeFocused();
    await expect(moved).toBeInViewport();
    await expect(todo.getByRole('row', { name, exact: true })).toHaveCount(0);
  });

  test('UIC-BOARD-1.10 draws a collapsed column as its icon toggle without a taller header row', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = page.locator('[data-lab-demo="lanes"] .ui-board');
    const row = board.locator('.ui-board__columns');
    const height = (await row.boundingBox())?.height;
    await expect(board.locator('.ui-board__column-icon')).toHaveCount(4);
    await expect(board.locator('.ui-board__lane-icon')).toHaveCount(2);
    await board.getByRole('button', { name: 'Collapse Doing' }).click();
    const header = board.locator('.ui-board__column[data-collapsed]');
    await expect(header.locator('.ui-board__column-icon')).toHaveCount(0);
    const toggle = header.getByRole('button', { name: 'Expand Doing' });
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const icon = toggle.locator('svg');
    await expect(icon).toHaveAttribute('data-glyph', 'edit');
    const [headerBox, iconBox] = [await header.boundingBox(), await icon.boundingBox()];
    const centre = (box: typeof headerBox) => (box ? box.x + box.width / 2 : 0);
    expect(Math.abs(centre(headerBox) - centre(iconBox))).toBeLessThan(1);
    expect((await row.boundingBox())?.height).toBe(height);
    await lab.expectAccessible('[data-lab-demo="lanes"]');
  });

  test('UIC-BOARD-1.4 compresses collapsed headers into the header row', async ({ page, lab }) => {
    await lab.open('board');
    for (const name of ['moves', 'lanes', 'rtl']) {
      const board = demo(page, name).locator('.ui-board');
      const row = board.locator('.ui-board__columns');
      const height = (await row.boundingBox())?.height;
      const toggles = board.locator('.ui-board__column-toggle');
      for (const index of [1, 0, 3]) {
        await toggles.nth(index).click();
        expect((await row.boundingBox())?.height).toBe(height);
      }
      const headers = await board.locator('.ui-board__column').evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return {
            left: box.left,
            right: box.right,
            top: box.top,
            height: box.height,
            overflows: node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight,
            collapsed: node.hasAttribute('data-collapsed'),
          };
        }),
      );
      const open = headers.find((header) => !header.collapsed);
      for (const header of headers) {
        if (header.collapsed) expect(Math.round(header.right - header.left)).toBe(44);
        expect(header.top).toBe(open?.top);
        expect(header.height).toBe(open?.height);
        expect(header.overflows).toBe(false);
      }
      // Columns keep their order along the row, from the right in a right-to-left page.
      const lefts = headers.map((header) => header.left);
      const ordered = [...lefts].sort((x, y) => (name === 'rtl' ? y - x : x - y));
      expect(lefts).toEqual(ordered);
      const collapsed = board.locator('.ui-board__column[data-collapsed]').first();
      await expect(collapsed.getByRole('button')).toHaveCount(1);
      await expect(collapsed.locator('.ui-board__column-actions')).toHaveCount(0);
      // The title and count stay in the page inside a visually hidden box.
      const hidden = collapsed.locator('.ui-board__column-title').locator('..');
      expect((await hidden.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
      await expect(hidden.locator('.ui-board__column-count')).toHaveCount(1);
    }
    const long = matrixCell(page, 'state=collapsed long title');
    const longRow = await long.locator('.ui-board__columns').boundingBox();
    const plainRow = await matrixCell(page, 'state=cards')
      .locator('.ui-board__columns')
      .boundingBox();
    expect(longRow?.height).toBe(plainRow?.height);
    const toggle = long.getByRole('button', {
      name: 'Expand Waiting for parts from the hardware store',
    });
    await expect(toggle.locator('svg')).toHaveAttribute('data-glyph', 'chevron-right');
    await toggle.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Waiting for parts from the hardware store 2 cards, limit 2',
    );
    await lab.expectAccessible();
  });

  test('UIC-BOARD-1.4 UIC-BOARD-3.1 moves a collapsed column by pointer and Alt+Arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    const header = (title: string) => board.locator('.ui-board__column').filter({ hasText: title });
    await board.getByRole('button', { name: 'Collapse To do' }).click();
    const toggle = board.getByRole('button', { name: 'Expand To do' });
    await expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight');
    await page.keyboard.press('Alt+ArrowRight');
    expect(await titles(board)).toEqual(['Doing', 'To do', 'Review', 'Done']);
    await expect(toggle).toBeFocused();
    await header('To do').dragTo(header('Done'), { targetPosition: { x: 200, y: 20 } });
    await expect(board.locator('[data-lab-output]')).toHaveText(
      'Last column move: todo after done',
    );
    expect(await titles(board)).toEqual(['Doing', 'Review', 'Done', 'To do']);
    await expect(header('To do')).toHaveAttribute('data-collapsed', 'true');
  });

  test("UIC-BOARD-1.4 draws a collapsed column's cards within its width, at 44px and wider", async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const fits = async (name: string, width: number) => {
      const board = demo(page, name).locator('.ui-board');
      const cells = await board.locator('.ui-board__cell[data-collapsed]').evaluateAll((nodes) =>
        nodes.map((cell) => {
          const box = cell.getBoundingClientRect();
          const cards = [...cell.querySelectorAll('.ui-board__card')].map((card) => {
            const inner = card.getBoundingClientRect();
            return {
              inside: inner.left >= box.left - 0.5 && inner.right <= box.right + 0.5,
              clipped: card.scrollWidth <= card.clientWidth,
            };
          });
          return { width: box.width, cards };
        }),
      );
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) {
        expect(Math.round(cell.width)).toBe(width);
        for (const card of cell.cards) expect(card).toEqual({ inside: true, clipped: true });
      }
      return cells.flatMap((cell) => cell.cards).length;
    };
    const board = demo(page, 'lanes');
    await board.getByRole('button', { name: 'Collapse To do' }).click();
    expect(await fits('lanes', 44)).toBe(3);
    await expect(board.getByRole('row', { name: 'Order seeds' })).toBeVisible();
    await expect(board.locator('.ui-board__cell[data-collapsed] .ui-board__add')).toHaveCount(0);
    // A host widens collapsed columns; the header and the cards follow.
    await page.addStyleTag({
      content:
        '.ui-board__column[data-collapsed], .ui-board__cell[data-collapsed] { width: 110px; }',
    });
    expect(await fits('lanes', 110)).toBe(3);
    // A collapsed lane still hides its cells, and the columns stay aligned across lanes.
    await board.getByRole('button', { name: 'Collapse Kitchen' }).click();
    expect(await fits('lanes', 110)).toBe(2);
    await lab.expectAccessible('[data-lab-demo="lanes"]');
  });

  test('UIC-BOARD-2.2 UIC-BOARD-2.3 moves cards into and out of a collapsed column', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'moves');
    await board.getByRole('button', { name: 'Collapse Review' }).click();
    await cards(board, 'Doing')
      .first()
      .dragTo(board.getByRole('grid', { name: 'Review' }), { targetPosition: { x: 20, y: 80 } });
    await expect(cards(board, 'Review')).toHaveCount(2);
    const moved = cards(board, 'Review').last();
    await expect(moved).toBeVisible();
    await moved.focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(cards(board, 'Review')).toHaveCount(1);
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(cards(board, 'Review')).toHaveCount(2);
    await expect(board.locator('.ui-board__column[data-collapsed]')).toHaveCount(1);
  });

  test('UIC-BOARD-1.4 UIC-BOARD-1.7 keeps a collapsed virtualized cell rendering its cards in view', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const board = demo(page, 'virtualized');
    const grid = board.getByRole('grid', { name: 'To do' });
    await grid.evaluate((element) => element.scrollTo(0, element.scrollHeight / 2));
    const top = await grid.evaluate((element) => element.scrollTop);
    await board.getByRole('button', { name: 'Collapse To do' }).click();
    await expect(grid).toHaveAttribute('data-virtualized', 'true');
    const count = await grid.getByRole('row').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(60);
    await board.getByRole('button', { name: 'Expand To do' }).click();
    expect(Math.abs((await grid.evaluate((element) => element.scrollTop)) - top)).toBeLessThan(400);
    await grid.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect(grid.getByRole('row', { name: 'Inventory item 500' })).toBeVisible();
  });

  test('UIC-BOARD-1.1 UIC-BOARD-1.4 keeps a nested board inside its card and its own styles', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const nested = demo(page, 'nested');
    const outer = nested.getByRole('group', { name: 'Rooms' });
    const inner = nested.getByRole('group', { name: 'Hall steps' });
    const card = outer.locator('.ui-board__card').first();
    const geometry = async () =>
      inner.evaluate((board) => {
        const host = board.closest('.ui-board__card')?.getBoundingClientRect();
        const box = board.getBoundingClientRect();
        const headers = [...board.querySelectorAll('.ui-board__column')].map((header) =>
          header.getBoundingClientRect(),
        );
        const viewport = board.querySelector('.ui-scroll-region__viewport');
        const view = { left: box.left, right: box.left + (viewport?.clientWidth ?? 0) };
        return {
          inside: Boolean(host && box.left >= host.left - 0.5 && box.right <= host.right + 0.5),
          // Headers past the board's edge are scrolled out of its own view, not drawn over.
          scrolls: (viewport?.scrollWidth ?? 0) > (viewport?.clientWidth ?? 0),
          firstHeaderInView: (headers[0]?.left ?? 0) >= view.left - 0.5,
        };
      });
    expect(await geometry()).toEqual({ inside: true, scrolls: true, firstHeaderInView: true });
    // The card is as tall as its content: the board and the output below it.
    const [cardBox, outputBox] = await Promise.all([
      card.boundingBox(),
      card.locator('[data-lab-output]').boundingBox(),
    ]);
    expect((outputBox?.y ?? 0) + (outputBox?.height ?? 0)).toBeLessThanOrEqual(
      (cardBox?.y ?? 0) + (cardBox?.height ?? 0),
    );
    // The board scrolls its own columns: the Done column comes into its view.
    const innerViewport = inner.locator('.ui-scroll-region__viewport').first();
    await innerViewport.evaluate((view) => view.scrollTo({ left: view.scrollWidth }));
    const done = inner.locator('.ui-board__column').nth(1);
    const [doneBox, innerBox] = await Promise.all([done.boundingBox(), inner.boundingBox()]);
    expect((doneBox?.x ?? 0) + (doneBox?.width ?? 0)).toBeLessThanOrEqual(
      (innerBox?.x ?? 0) + (innerBox?.width ?? 0) + 0.5,
    );
    // Collapsing the outer column restyles its own cards, not the inner board's.
    await outer.getByRole('button', { name: 'Collapse To do' }).first().click();
    await expect(card).toHaveAttribute('data-collapsed', 'true');
    await expect(inner.locator('.ui-board__card[data-collapsed]')).toHaveCount(0);
    expect(
      await inner
        .locator('.ui-board__card')
        .first()
        .evaluate((node) => getComputedStyle(node).flexDirection),
    ).toBe('row');
  });

  test('UIC-BOARD-2.3 moves a nested board card on its own board', async ({ page, lab }) => {
    await lab.open('board');
    const nested = demo(page, 'nested');
    const inner = nested.getByRole('group', { name: 'Hall steps' });
    const sand = inner.getByRole('row', { name: 'Sand the walls' });
    await sand.focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(cards(inner, 'Done')).toHaveText(['Sand the walls']);
    await expect(inner.getByRole('row', { name: 'Sand the walls' })).toBeFocused();
    const outputs = nested.locator('[data-lab-output]');
    await expect(outputs).toHaveText(['Hall steps: moved a to done', 'Rooms: no move yet']);
    await nested.getByRole('row', { name: 'Wash the windows' }).focus();
    await page.keyboard.press('Alt+ArrowUp');
    await expect(outputs.last()).toHaveText('Rooms: moved b to todo');
    await lab.expectAccessible('[data-lab-demo="nested"]');
  });

  test('UIC-BOARD-2.3 leaves arrow keys, move chords and typing to a field in a card', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const nested = demo(page, 'nested');
    const field = nested.getByRole('textbox', { name: 'Notes for Wash the windows' });
    await field.click();
    for (const chord of ['Alt+ArrowRight', 'Alt+ArrowLeft', 'Alt+ArrowUp', 'Alt+ArrowDown']) {
      await page.keyboard.press(chord);
      await expect(field, chord).toBeFocused();
    }
    await page.keyboard.press('Home');
    expect(await field.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(0);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await field.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('w');
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('Uwse the soft cloth');
    await expect(nested.locator('[data-lab-output]').last()).toHaveText('Rooms: no move yet');
    const row = nested.getByRole('row', { name: 'Wash the windows' });
    await row.focus();
    await page.keyboard.press('ArrowRight');
    await expect(row.getByRole('button', { name: /Wash the windows/ })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(field).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(field).not.toBeFocused();
  });

  test('UIC-BOARD-2.2 drags a card by its handle only', async ({ page, lab }) => {
    await lab.open('board');
    const board = page.locator('[data-lab-demo="handle-drag"]');
    const field = board.getByRole('textbox', { name: 'Note for Order seeds' });
    const card = field.locator('xpath=ancestor::*[@role="row"][1]');
    await expect(card).not.toHaveAttribute('draggable');
    await field.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Home');
    await expect(field).toBeFocused();
    await expect(card).not.toHaveAttribute('draggable');
    const handle = card.locator('.ui-drag-handle');
    const box = await handle.boundingBox();
    if (!box) throw new Error('The handle has no box.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(card).toHaveAttribute('draggable', 'true');
    await page.mouse.up();
    await expect(card).not.toHaveAttribute('draggable');
    await lab.expectAccessible('[data-lab-section="Drag by handle"]');
  });
});
