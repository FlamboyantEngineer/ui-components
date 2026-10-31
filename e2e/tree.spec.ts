import { expect, test, matrixCell } from './fixtures.js';

test.describe('Tree lab', () => {
  test('UIC-TREE-1.3 points a collapsed chevron to the inline end right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.locator('[data-lab-demo="rtl"]');
    await expect(
      tree.getByRole('row', { name: 'Travel' }).locator('.ui-tree__expand .ui-icon'),
    ).toHaveAttribute('data-glyph', 'chevron-left');
    await expect(
      tree.getByRole('row', { name: 'Recipes' }).locator('.ui-tree__expand .ui-icon'),
    ).toHaveAttribute('data-glyph', 'chevron-down');
  });

  test('UIC-TREE-1.1 UIC-TREE-2.1 UIC-TREE-3.2 UIC-TREE-3.3 retains typed keys through expansion, selection and actions', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const sample = page.locator('[data-lab-typed-tree]');
    const tree = sample.getByRole('treegrid', { name: 'Primitive keys' });
    await expect(tree.getByRole('row', { name: 'Numeric child' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(tree.getByRole('row', { name: 'Space key' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(tree.getByRole('row', { name: 'Dash key' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await tree
      .getByRole('row', { name: 'Text branch' })
      .getByRole('button', { name: 'Expand Text branch' })
      .click();
    await tree.getByRole('row', { name: 'Text child' }).click();
    await expect(sample.locator('[data-lab-output="typed-selection"]')).toHaveText(
      '[["string","2"]]',
    );
    await page.keyboard.press('Enter');
    await expect(sample.locator('[data-lab-output="typed-action"]')).toHaveText('["string","2"]');
  });
  test('UIC-TREE-1.1 UIC-TREE-2.1 UIC-TREE-3.1 navigates, expands and collapses by keyboard', async ({
    page,
    lab,
  }) => {
    test.slow(); // axe walks every tree of the lab
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
    const cell = matrixCell(page, 'variant=default size=sm');
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
        await matrixCell(page, `variant=default size=${size}`)
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

  test('UIC-TREE-5.1 UIC-TREE-5.2 cascades checkbox selection through branches', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-checkbox]');
    const tree = area.getByRole('treegrid', { name: 'Destinations' });
    const row = (label: string) => tree.getByRole('row', { name: label, exact: true });
    await expect(row('Portugal')).toHaveAttribute('data-indeterminate', 'true');
    await expect(row('Europe')).toHaveAttribute('data-indeterminate', 'true');
    await row('Portugal').locator('.ui-tree__checkbox').click();
    await expect(area.locator('[data-lab-output]')).toHaveText('Selected: lisbon, porto, portugal');
    await expect(row('Portugal')).toHaveAttribute('aria-selected', 'true');
    await row('Oslo').focus();
    await page.keyboard.press('Space');
    // Bergen is disabled: Oslo completes Norway, and with it Europe.
    await expect(area.locator('[data-lab-output]')).toHaveText(
      'Selected: europe, lisbon, norway, oslo, porto, portugal',
    );
    await expect(row('Europe')).toHaveAttribute('aria-selected', 'true');
    await expect(row('Europe')).not.toHaveAttribute('data-indeterminate');
    await expect(row('Bergen')).toHaveAttribute('aria-disabled', 'true');
    await expect(row('Bergen')).not.toHaveAttribute('aria-selected', 'true');
    await lab.expectAccessible('[data-lab-checkbox]');
  });

  test('UIC-TREE-6.1 filters rows by text and opens the way to each match', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-filter]');
    const tree = area.getByRole('treegrid', { name: 'Filtered places' });
    const names = () =>
      tree
        .getByRole('row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label')));
    expect(await names()).toEqual(['Europe', 'Norway', 'Oslo', 'Asia', 'Japan', 'Osaka']);
    await expect(tree.getByRole('row', { name: 'Oslo' }).locator('mark')).toHaveText('Os');
    const field = area.getByRole('searchbox', { name: 'Filter places' });
    await field.fill('ghana');
    expect(await names()).toEqual(['Africa', 'Ghana']);
    await tree.getByRole('row', { name: 'Ghana' }).focus();
    await page.keyboard.press('ArrowRight');
    expect(await names()).toEqual(['Africa', 'Ghana', 'Accra']);
    await field.fill('zzz');
    await expect(tree).toContainText('No places match');
    await field.fill('');
    expect(await names()).toEqual(['Europe', 'Asia', 'Africa']);
    await lab.expectAccessible('[data-lab-filter]');
  });

  test('UIC-TREE-2.4 loads an opened branch and retries a failed load from the row', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Regions' });
    await tree.getByRole('row', { name: 'North' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tree.getByRole('row', { name: 'North town 3' })).toBeVisible();
    await tree.getByRole('row', { name: 'South' }).focus();
    await page.keyboard.press('ArrowRight');
    const error = tree.locator('.ui-tree__load-error');
    await expect(error).toContainText('South is unreachable right now.');
    await error.getByRole('button', { name: 'Retry' }).click();
    await expect(tree.getByRole('row', { name: 'South town 1' })).toBeVisible();
    await expect(error).toHaveCount(0);
    await lab.expectAccessible('[data-lab-loading]');
  });

  test('UIC-TREE-5.2 UIC-TREE-6.1 filters and selects through nested branches', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-nested-tree]');
    const tree = area.getByRole('treegrid', { name: 'Nested levels' });
    const root = tree.getByRole('row', { name: 'Level 1', exact: true });
    await expect(root).toHaveAttribute('data-indeterminate', 'true');
    await area.getByRole('searchbox', { name: 'Filter levels' }).fill('Level 24');
    await expect(tree.getByRole('row')).toHaveCount(24);
    await root.focus();
    await page.keyboard.press('Space');
    await expect(tree.locator('[role="row"][aria-selected="true"]')).toHaveCount(24);
    await area.getByRole('searchbox', { name: 'Filter levels' }).fill('');
    await expect(tree.getByRole('row')).toHaveCount(1);
    await expect(root).toHaveAttribute('aria-selected', 'true');
  });

  test('UIC-TREE-7.1 renames a row in place with F2', async ({ page, lab }) => {
    await lab.open('tree');
    const tree = page.getByRole('treegrid', { name: 'Rename places' });
    const portugal = tree.getByRole('row', { name: 'Portugal' });
    await portugal.focus();
    await page.keyboard.press('F2');
    const field = tree.getByRole('textbox', { name: 'Rename Portugal' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Lusitania');
    await page.keyboard.press('Enter');
    const renamed = tree.getByRole('row', { name: 'Lusitania' });
    await expect(renamed).toBeFocused();
    await page.keyboard.press('F2');
    await page.keyboard.type('Elsewhere');
    await page.keyboard.press('Escape');
    await expect(renamed).toBeFocused();
    await tree.getByRole('row', { name: 'Europe' }).focus();
    await page.keyboard.press('F2');
    await expect(tree.getByRole('textbox')).toHaveCount(0);
  });

  test('UIC-TREE-7.2 closes the name field of a row locked while renaming', async ({
    page,
    lab,
  }) => {
    await lab.open('tree');
    const area = page.locator('[data-lab-locked-rename]');
    const tree = area.getByRole('treegrid', { name: 'Rename tasks' });
    await area.getByRole('button', { name: 'Lock Review in 1.5 seconds' }).click();
    await tree.getByRole('row', { name: 'Review' }).focus();
    await page.keyboard.press('F2');
    const field = tree.getByRole('textbox', { name: 'Rename Review' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Approve');
    await expect(area.locator('[data-lab-output="Locked"]')).toHaveText('review');
    await expect(field).toHaveCount(0);
    await expect(tree).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(area.locator('[data-lab-output="Last rename"]')).toHaveText('none');
    await expect(tree.getByRole('row', { name: 'Review' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
