import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const cards = (board: Locator, column: string) =>
  board.getByRole('grid', { name: column, exact: true }).getByRole('row');
const titles = (board: Locator) => board.locator('.ui-board__column-title').allTextContents();

test.describe('Board lab', () => {
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

  test('UIC-BOARD-1.7 UIC-BOARD-2.3 keeps focus on a card moved into a virtualized cell out of view', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const todo = demo(page, 'virtualized').getByRole('grid', { name: 'To do' });
    const done = demo(page, 'virtualized').getByRole('grid', { name: 'Done' });
    await todo.evaluate((element) => element.scrollTo(0, element.scrollHeight / 2));
    const card = todo.getByRole('row').nth(4);
    await expect(card).toBeVisible();
    const name = (await card.textContent()) ?? '';
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
});
