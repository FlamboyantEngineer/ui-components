import { expect, test } from './fixtures.js';

test.describe('Tree lab', () => {
  test('UIC-TREE-1.1 UIC-TREE-2.1 UIC-TREE-3.1 navigates, expands and collapses by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Persisted folders' });
    const row = (name: string) => tree.getByRole('row', { name });
    await row('Recipes').focus();
    await page.keyboard.press('ArrowRight');
    await expect(row('Recipes')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(row('Tomato soup.txt')).toBeFocused();
    await expect(row('Tomato soup.txt')).toHaveAttribute('aria-level', '2');
    await page.keyboard.press('End');
    await expect(row('Archive.zip')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(row('Recipes')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(row('Recipes')).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('b');
    await expect(row('Budget.xlsx')).toBeFocused();
    await expect(tree.locator('[role="row"][tabindex="0"]')).toHaveCount(1);
    await tree.getByRole('button', { name: 'Expand Travel' }).click();
    await expect(row('Travel')).toHaveAttribute('aria-expanded', 'true');
    await expect(row('Lisbon.pdf')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-TREE-1.2 indents rows by their depth', async ({ page, lab }) => {
    await lab.open('tree');
    const cell = page.locator('[data-lab-cell="variant=default size=sm"]');
    const x = async (name: string) =>
      (await cell.getByRole('row', { name }).locator('.ui-tree__label').boundingBox())?.x ?? 0;
    const top = await x('Budget.xlsx');
    const second = await x('Tomato soup.txt');
    expect(second - top).toBe(20);
    await expect(cell.getByRole('row', { name: 'Tomato soup.txt' })).toHaveCSS(
      '--ui-tree-level',
      '2',
    );
  });

  test('UIC-TREE-4.3 spaces rows by size', async ({ page, lab }) => {
    await lab.open('tree');
    const height = async (size: string) =>
      (
        await page
          .locator(`[data-lab-cell="variant=default size=${size}"]`)
          .getByRole('row', { name: 'Budget.xlsx' })
          .boundingBox()
      )?.height ?? 0;
    const [small, medium, large] = [await height('sm'), await height('md'), await height('lg')];
    expect(medium - small).toBe(6);
    expect(large - medium).toBe(6);
  });

  test('UIC-TREE-2.3 restores persisted expansion after a reload', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Persisted folders' });
    await tree.getByRole('button', { name: 'Expand Travel' }).click();
    await expect(tree.getByRole('row', { name: 'Travel' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(
      page
        .getByRole('treegrid', { name: 'Persisted folders' })
        .getByRole('row', { name: 'Travel' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('UIC-TREE-4.5 renders only the rows in view of a virtualized tree', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Many folders' });
    await expect(tree).toHaveAttribute('data-virtualized', 'true');
    await expect(tree.getByRole('row', { name: 'Crate 1', exact: true })).toBeVisible();
    const rendered = await tree.getByRole('row').count();
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(60);
    await tree.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await tree.scrollIntoViewIfNeeded();
    await expect(tree.getByRole('row', { name: 'Apple 1980.txt' })).toBeInViewport();
    await expect(tree.getByRole('row', { name: 'Crate 1', exact: true })).toHaveCount(0);
    expect(await tree.getByRole('row').count()).toBeLessThan(60);
    await lab.expectAccessible('[data-lab-tree="virtualized"]');
  });
});
