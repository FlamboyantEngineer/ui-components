import { expect, test } from './fixtures.js';

test.describe('Tree handle', () => {
  test('UIC-TREE-9.1 UIC-TREE-9.3 reveals and focuses undrawn rows of a virtualized tree', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const section = page.locator('[data-lab-section="Revealing rows by id"]');
    const tree = section.getByRole('treegrid', { name: 'Shelves' });
    const result = section.locator('[data-lab-output="Tree reveal result"]');
    await expect(tree.getByRole('row', { name: 'Box 30.4' })).toHaveCount(0);
    const reveal = section.getByRole('button', { name: 'Reveal box 30.4' });
    await reveal.click();
    await expect(result).toHaveText('found');
    await expect(tree.getByRole('row', { name: 'Box 30.4' })).toBeInViewport();
    await expect(reveal).toBeFocused();

    await section.getByRole('button', { name: 'Focus box 35.2' }).click();
    await expect(tree.getByRole('row', { name: 'Box 35.2' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(tree.getByRole('row', { name: 'Box 35.3' })).toBeFocused();

    await section.getByRole('button', { name: 'Reveal box 40.1' }).click();
    await expect(result).toHaveText('not found (collapsed)');
    await section.getByRole('textbox', { name: 'Filter shelves' }).fill('Box 2.');
    await section.getByRole('button', { name: 'Reveal box 30.4' }).click();
    await expect(result).toHaveText('not found (filtered)');
    await lab.expectAccessible();
  });
});
