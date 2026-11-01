import { expect, test, matrixCell } from './fixtures.js';
import type { Locator } from '@playwright/test';

const order = (tree: Locator) =>
  tree
    .locator('[role="row"][aria-label]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label')));

test.describe('Tree reordering', () => {
  test('UIC-TREE-REORDER-1.1 offers drag affordances only on rows that can move', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="siblings"]');
    await expect(tree.getByRole('row', { name: 'Lisbon.pdf' })).toHaveAttribute(
      'draggable',
      'true',
    );
    await expect(tree.getByRole('row', { name: 'Budget.xlsx' })).not.toHaveAttribute('draggable');
    await expect(
      tree.getByRole('row', { name: 'Budget.xlsx' }).locator('.ui-tree__drag-handle'),
    ).toBeDisabled();
    await expect(tree.getByRole('button', { name: 'Drag Lisbon.pdf' })).toBeEnabled();
    await expect(matrixCell(page, 'variant=default size=sm').locator('[draggable]')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-TREE-REORDER-1.1 keeps the rows mounted when reordering turns off and on', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-reorder="siblings"]');
    const tree = area.getByRole('treegrid');
    const lisbon = tree.getByRole('row', { name: 'Lisbon.pdf' });
    // A mark on the row element survives only while the row stays mounted.
    await lisbon.evaluate((row) => row.setAttribute('data-lab-mark', ''));
    await expect(tree).toHaveAttribute('data-reordering', 'true');
    await area.getByRole('button', { name: 'Arrange' }).click();
    await expect(tree).not.toHaveAttribute('data-reordering');
    await expect(lisbon).not.toHaveAttribute('draggable');
    await expect(area.locator('.ui-tree__drag-handle')).toHaveCount(0);
    await expect(lisbon).toHaveAttribute('data-lab-mark', '');
    await area.getByRole('button', { name: 'Arrange' }).click();
    await expect(lisbon).toHaveAttribute('draggable', 'true');
    await expect(lisbon).toHaveAttribute('data-lab-mark', '');
  });

  test('UIC-TREE-REORDER-1.2 moves a row by pointer drag and drop', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="siblings"]');
    await tree
      .getByRole('row', { name: 'Tomato soup.txt' })
      .dragTo(tree.getByRole('row', { name: /^Sourdough bread/ }), {
        targetPosition: { x: 60, y: 20 },
      });
    expect((await order(tree)).slice(0, 3)).toEqual([
      'Recipes',
      'Sourdough bread with a long overnight rise.txt',
      'Tomato soup.txt',
    ]);
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: soup after bread');
    await expect(tree.locator('[data-dragging], [data-drop-target]')).toHaveCount(0);
  });

  test('UIC-TREE-REORDER-1.2 moves a row into another folder by pointer', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="parents"]');
    await tree
      .getByRole('row', { name: 'Oslo.pdf' })
      .dragTo(tree.getByRole('row', { name: 'Desserts' }), { targetPosition: { x: 120, y: 12 } });
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: oslo inside desserts');
    expect(await order(tree)).toEqual([
      'Recipes',
      'Tomato soup.txt',
      'Sourdough bread with a long overnight rise.txt',
      'Desserts',
      'Lemon tart.txt',
      'Flan.txt',
      'Oslo.pdf',
      'Travel',
      'Lisbon.pdf',
      'Budget.xlsx',
      'Archive.zip',
    ]);
  });

  test('UIC-TREE-REORDER-1.2 moves a row by keyboard drag and drop from its handle', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="siblings"]');
    await tree.getByRole('row', { name: 'Oslo.pdf' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tree.getByRole('button', { name: 'Drag Oslo.pdf' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(tree.locator('.ui-tree__drop-indicator[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: oslo before lisbon');
    expect((await order(tree)).slice(6, 9)).toEqual(['Travel', 'Oslo.pdf', 'Lisbon.pdf']);
  });

  test('UIC-TREE-REORDER-1.3 moves the focused row with Alt+Arrow keys and keeps focus on it', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="parents"]');
    const lisbon = tree.getByRole('row', { name: 'Lisbon.pdf' });
    await expect(lisbon).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight',
    );
    await lisbon.focus();
    await page.keyboard.press('Alt+ArrowDown');
    expect((await order(tree)).slice(6, 9)).toEqual(['Travel', 'Oslo.pdf', 'Lisbon.pdf']);
    await expect(lisbon).toBeFocused();
    // The top level takes only folders: the chord is claimed and moves nothing.
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: lisbon after oslo');
    await expect(lisbon).toBeFocused();

    const tart = tree.getByRole('row', { name: 'Lemon tart.txt' });
    await tart.focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: tart after desserts');
    await expect(tart).toHaveAttribute('aria-level', '2');
    await expect(tart).toBeFocused();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(tree.locator('[data-lab-output]')).toHaveText('Last move: tart inside desserts');
    await expect(tart).toHaveAttribute('aria-level', '3');
    await expect(tart).toBeFocused();
  });

  test('UIC-TREE-REORDER-1.4 drags the selected rows together', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-reorder="multiple"]');
    await expect(
      tree.getByRole('row', { name: 'Porto' }).locator('.ui-tree__drag-handle'),
    ).toHaveAccessibleName(/2/);
    await tree
      .getByRole('row', { name: 'Porto' })
      .dragTo(tree.getByRole('row', { name: 'Norway' }), { targetPosition: { x: 120, y: 12 } });
    await expect(tree.locator('[data-lab-output]')).toHaveText(
      'Last moves: lisbon inside norway; porto after lisbon',
    );
    expect(await order(tree)).toEqual([
      'Europe',
      'Portugal',
      'Norway',
      'Oslo',
      'Bergen',
      'Lisbon',
      'Porto',
      'Asia',
      'Africa',
    ]);
    await expect(tree.locator('[data-dragging], [data-drop-target]')).toHaveCount(0);
  });
});

test('UIC-TREE-REORDER-2.2 shows resolveTreeMove in a host-side snippet', async ({ page, lab }) => {
  await lab.open('tree');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(
    call("resolveTreeMove(rows, { key: 'soup', targetKey: 'bread', position: 'after' })"),
  ).toHaveText('soup after bread');
  await expect(
    call("resolveTreeMove(rows, { key: 'recipes', targetKey: 'tart', position: 'inside' })"),
  ).toHaveText('null');
  await expect(
    call("resolveTreeMove(rows, { key: 'soup', targetKey: 'lisbon', position: 'before' })"),
  ).toHaveText('null');
  await expect(
    call(
      "resolveTreeMove(rows, { key: 'soup', targetKey: 'lisbon', position: 'before' }, { canMoveInto })",
    ),
  ).toHaveText('soup before lisbon');
});
