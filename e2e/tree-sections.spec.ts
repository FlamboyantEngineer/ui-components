import { expect, test } from './fixtures.js';

test.describe('Tree category sections', () => {
  test('UIC-TREE-8.1 draws full-width heading rows that keyboard, hover and selection pass over', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-sections]');
    const tree = area.getByRole('treegrid', { name: 'Shelves' });
    const row = (label: string) => tree.getByRole('row', { name: label, exact: true });
    const heading = (label: string) =>
      tree.locator('.ui-tree__section-header').filter({ hasText: label });
    await expect(tree).toHaveAttribute('data-sectioned', 'true');
    await expect(tree.getByRole('rowgroup', { name: 'Shared', exact: true })).toHaveCount(2);

    // A heading row spans the tree, sits above its rows, and shares their depth's indent.
    const treeBox = await tree.boundingBox();
    const pinnedBox = await heading('Pinned').boundingBox();
    const handbookBox = await row('Handbook').boundingBox();
    if (!treeBox || !pinnedBox || !handbookBox) throw new Error('Missing geometry');
    expect(Math.abs(pinnedBox.width - treeBox.width)).toBeLessThan(1);
    expect(pinnedBox.y + pinnedBox.height).toBeLessThanOrEqual(handbookBox.y + 0.5);
    expect(await row('Handbook').getAttribute('aria-level')).toBe('1');

    // Hovering a heading draws no row surface; the label slot adds no second highlight.
    await heading('Pinned').hover();
    await expect(heading('Pinned')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await row('Budget').hover();
    await expect(row('Budget')).toHaveAttribute('data-hovered', 'true');
    await expect(row('Budget').locator('.ui-tree__label')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );

    // Pressing a heading selects nothing.
    await heading('Pinned').click();
    await expect(area.locator('[data-lab-output]')).toHaveText('Selected: 0');

    // Keyboard runs across sections and skips headings and the disabled row's selection.
    await row('Start here').click();
    await expect(area.locator('[data-lab-output]')).toHaveText('Selected: 1');
    await page.keyboard.press('ArrowDown');
    await expect(row('Handbook')).toBeFocused();
    await page.keyboard.press('End');
    await expect(row('Old letters')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(row('Start here')).toBeFocused();
    await page.keyboard.type('pho');
    await expect(row('Photo album')).toBeFocused();
    await lab.expectAccessible('[data-lab-sections]');
  });

  test('UIC-TREE-8.1 filters sections, wraps long headings and keeps them in a narrow tree', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-sections]');
    const tree = area.getByRole('treegrid', { name: 'Shelves' });
    await area.getByRole('searchbox', { name: 'Filter shelves' }).fill('first');
    await expect(tree.getByRole('rowgroup')).toHaveCount(1);
    await expect(tree.getByRole('row', { name: 'First steps' })).toHaveAttribute('aria-level', '5');
    await area.getByRole('searchbox', { name: 'Filter shelves' }).fill('zzz');
    await expect(tree.getByText('No shelves match')).toBeVisible();
    await area.getByRole('searchbox', { name: 'Filter shelves' }).fill('');

    await page.setViewportSize({ width: 360, height: 800 });
    const recent = tree.locator('.ui-tree__section-header').filter({ hasText: 'Recently' });
    const treeBox = await tree.boundingBox();
    const box = await recent.boundingBox();
    if (!treeBox || !box) throw new Error('Missing geometry');
    // The long heading wraps inside the tree rather than overflowing it.
    expect(box.x + box.width).toBeLessThanOrEqual(treeBox.x + treeBox.width + 0.5);
    expect(box.height).toBeGreaterThan(24);
    expect(await tree.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test('UIC-TREE-8.1 UIC-TREE-4.5 virtualizes sections with row-height headings', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Grouped entries' });
    // The virtualizer positions each row on its own, so the row group itself takes no height.
    await expect(tree.getByRole('rowgroup', { name: 'Group 1' })).toBeAttached();
    const header = tree.locator('.ui-tree__section-header').first();
    await expect(header).toBeVisible();
    expect((await header.boundingBox())?.height).toBe(28);
    expect(await tree.getByRole('row').count()).toBeLessThan(40);
    await tree.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await tree.scrollIntoViewIfNeeded();
    await expect(tree.getByRole('row', { name: 'Entry 240' })).toBeInViewport();
    await expect(tree.getByRole('rowgroup', { name: 'Group 6' })).toBeAttached();
    await lab.expectAccessible('[data-lab-tree="virtualized-sections"]');
  });
});
