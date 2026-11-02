import { expect, test } from './fixtures.js';

test.describe('Tree lab, options', () => {
  test('UIC-TREE-6.1 matches the filter with the caller matcher', async ({ page, lab }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-demo="caller-filter"]');
    const tree = area.getByRole('treegrid');
    const names = () =>
      tree
        .getByRole('row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label')));
    await expect(tree.getByRole('row', { name: 'Leaf rake' })).toBeVisible();
    expect(await names()).toEqual(['Garden tools', 'Leaf rake', 'Hallway shoe rack']);
    await area.getByRole('radio', { name: 'Each term (default)' }).click();
    await expect(tree.getByRole('row', { name: 'Box grater' })).toBeVisible();
    expect(await names()).toEqual([
      'Garden tools',
      'Leaf rake',
      'Kitchen',
      'Box grater',
      'Hallway shoe rack',
    ]);
    await area.getByRole('radio', { name: 'Whole name' }).click();
    await expect(tree).toContainText('No shelf matches');
    await area.getByRole('searchbox', { name: 'Filter shelves' }).fill('hand trowel');
    await expect(tree.getByRole('row', { name: 'Hand trowel' })).toBeVisible();
    expect(await names()).toEqual(['Garden tools', 'Hand trowel']);
    await lab.expectAccessible('[data-lab-demo="caller-filter"]');
  });

  test('UIC-TREE-3.2 keeps one row selected with disallowEmptySelection', async ({ page, lab }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-demo="required-selection"]');
    const tree = area.getByRole('treegrid');
    const selected = area.locator('[data-lab-output="required-selected"]');
    const row = (label: string) => tree.getByRole('row', { name: label, exact: true });
    await expect(selected).toHaveText('rake');
    await row('Leaf rake').click();
    await expect(selected).toHaveText('rake');
    await expect(row('Leaf rake')).toHaveAttribute('aria-selected', 'true');
    await row('Hand trowel').click();
    await expect(selected).toHaveText('rake, trowel');
    await row('Leaf rake').click();
    await expect(selected).toHaveText('trowel');
    await row('Hand trowel').click();
    await expect(selected).toHaveText('trowel');
    await lab.expectAccessible('[data-lab-demo="required-selection"]');
  });

  test('UIC-TREE-4.5 lays out a virtualized tree at its rowHeight', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-tree="tall-rows"]');
    const first = tree.getByRole('row', { name: 'Bin 1', exact: true });
    const next = tree.getByRole('row', { name: 'Bin 1 slot 1', exact: true });
    await expect(first).toBeVisible();
    const top = (await first.boundingBox())?.y ?? 0;
    expect((await first.boundingBox())?.height).toBe(44);
    expect(((await next.boundingBox())?.y ?? 0) - top).toBe(44);
    // 240 pixels show about six rows: far fewer than the 132 rows of the tree.
    expect(await tree.getByRole('row').count()).toBeLessThan(20);
    await first.focus();
    for (let step = 0; step < 15; step += 1) await page.keyboard.press('ArrowDown');
    const focused = tree.getByRole('row', { name: 'Bin 2 slot 4', exact: true });
    await expect(focused).toBeFocused();
    await expect(focused).toBeInViewport();
    await expect(first).toHaveCount(0);
    await lab.expectAccessible('[data-lab-tree="tall-rows"]');
  });
});
