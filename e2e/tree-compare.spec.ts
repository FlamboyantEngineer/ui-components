import { expect, test } from './fixtures.js';

const PART_ROWS = [
  'Frame set',
  'Frame, carbon, changed from Frame, aluminium',
  'Fork',
  'Headset, moved away',
  'Wheels',
  'Rim, 29 inch',
  'Tyre, 2.4 inch, changed from Tyre, 2.2 inch',
  'Hub, moved away',
  'Drivetrain',
  'Hub, moved here',
  'Chain',
  'Crank set',
  'Cassette, 12 speed, added',
  'Cockpit, added',
  'Headset, moved here',
];

test.describe('Tree Compare lab', () => {
  test('UIC-TREE-COMPARE-2.1 UIC-TREE-COMPARE-2.2 UIC-TREE-COMPARE-5.1 aligns both revisions side by side', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-compare');
    const compare = page.locator(
      '[data-lab-cell="trees=different filter=all rows"] .ui-tree-compare',
    );
    const tree = compare.getByRole('treegrid', { name: 'Parts, different, all rows' });
    await expect(tree.getByRole('row')).toHaveCount(PART_ROWS.length);
    expect(
      await tree
        .getByRole('row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('aria-label'))),
    ).toEqual(PART_ROWS);
    await expect(compare.locator('.ui-tree-compare__count')).toHaveText([
      '2 added',
      '2 changed',
      '2 moved',
    ]);
    await expect(compare.locator('.ui-tree-compare__column-label')).toHaveText(['Before', 'After']);
    const changed = tree.getByRole('row', { name: /^Frame, carbon/ });
    await expect(changed.locator('.ui-tree-compare__row')).toHaveAttribute(
      'data-change',
      'changed',
    );
    const [left, right] = await changed.locator('.ui-tree-compare__cell').all();
    await expect(left!).toHaveText('Frame, aluminium');
    await expect(right!).toHaveText('Frame, carbon');
    const leftBox = (await left!.boundingBox())!;
    const rightBox = (await right!.boundingBox())!;
    expect(rightBox.x).toBeGreaterThan(leftBox.x + leftBox.width);
    expect(Math.abs(rightBox.y - leftBox.y)).toBeLessThan(2);
    const added = tree.getByRole('row', { name: 'Cockpit, added' });
    await expect(added.locator('.ui-tree-compare__cell[data-side="left"]')).toHaveAttribute(
      'data-empty',
      'true',
    );
    await expect(added.locator('.ui-tree-compare__marker .ui-glyph')).toHaveAttribute(
      'data-glyph',
      'plus',
    );
    const identical = page.locator(
      '[data-lab-cell="trees=identical filter=all rows"] .ui-tree-compare__summary',
    );
    await expect(identical).toHaveText('No differences');
  });

  test('UIC-TREE-COMPARE-2.3 UIC-TREE-COMPARE-3.1 indents each side and expands both together', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-compare');
    const tree = page.getByRole('treegrid', { name: 'Parts, different, all rows' });
    const row = (name: string) => tree.getByRole('row', { name });
    const textStart = async (name: string, side: 'left' | 'right') => {
      const cell = row(name).locator(`.ui-tree-compare__cell[data-side="${side}"]`);
      return cell.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element.lastChild ?? element);
        return range.getBoundingClientRect().x;
      });
    };
    expect((await textStart('Fork', 'left')) - (await textStart('Frame set', 'left'))).toBe(16);
    expect((await textStart('Fork', 'right')) - (await textStart('Frame set', 'right'))).toBe(16);
    await row('Wheels')
      .getByRole('button', { name: /^Collapse/ })
      .click();
    await expect(row('Rim, 29 inch')).toHaveCount(0);
    await expect(row('Wheels').locator('.ui-tree-compare__branch')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    await row('Wheels').focus();
    await page.keyboard.press('ArrowRight');
    await expect(row('Rim, 29 inch')).toBeVisible();
    const parts = page.locator('[data-lab-demo="parts"]');
    await expect(parts.getByRole('row')).toHaveCount(9);
    await parts.getByRole('button', { name: 'Expand all' }).click();
    await expect(parts.getByRole('row')).toHaveCount(PART_ROWS.length);
    await parts.getByRole('button', { name: 'Collapse all' }).click();
    await expect(parts.getByRole('row')).toHaveCount(4);
  });

  test('UIC-TREE-COMPARE-3.2 keeps only the differences', async ({ page, lab }) => {
    await lab.open('tree-compare');
    const demo = page.locator('[data-lab-demo="baselines"]');
    const tree = demo.getByRole('treegrid');
    await expect(tree.getByRole('row', { name: 'Scope' })).toBeVisible();
    await expect(demo.getByText('Requirement 12: Operating range')).toHaveCount(2);
    await demo.getByText('Only differences').click();
    await expect(demo.locator('.ui-tree-compare')).toHaveAttribute('data-changes-only', 'true');
    await expect(demo.getByText('Showing only differences.')).toBeVisible();
    await expect(tree.getByRole('row', { name: 'Scope' })).toHaveCount(0);
    await expect(tree.getByRole('row', { name: 'Requirements' })).toBeVisible();
    await expect(
      tree.getByRole('row', { name: 'Requirement 11: Power draw, changed' }),
    ).toBeVisible();
    await expect(tree.getByRole('row', { name: 'Glossary, removed' })).toBeVisible();
    const filtered = page.locator(
      '[data-lab-cell="trees=identical filter=only differences"] .ui-tree-compare__tree',
    );
    await expect(filtered).toContainText('No differences');
  });

  test('UIC-TREE-COMPARE-4.1 steps between differences with the buttons and F7', async ({
    page,
    lab,
  }) => {
    await lab.open('tree-compare');
    const demo = page.locator('[data-lab-demo="baselines"]');
    const tree = demo.getByRole('treegrid');
    await demo.getByRole('button', { name: 'Next difference' }).click();
    await expect(
      tree.getByRole('row', { name: 'Requirement 11: Power draw, changed' }),
    ).toBeFocused();
    await page.keyboard.press('F7');
    await expect(
      tree.getByRole('row', { name: 'Requirement 12: Operating range, moved away' }),
    ).toBeFocused();
    await page.keyboard.press('Shift+F7');
    await expect(
      tree.getByRole('row', { name: 'Requirement 11: Power draw, changed' }),
    ).toBeFocused();
    await demo.getByRole('button', { name: 'Previous difference' }).click();
    await expect(tree.getByRole('row', { name: 'Glossary, removed' })).toBeFocused();
    await page.keyboard.press('F7');
    await expect(
      tree.getByRole('row', { name: 'Requirement 11: Power draw, changed' }),
    ).toBeFocused();
  });

  test('UIC-TREE-COMPARE-4.2 follows a moved row to its other position', async ({ page, lab }) => {
    await lab.open('tree-compare');
    const parts = page.locator('[data-lab-demo="parts"]');
    const row = (name: string) => parts.getByRole('row', { name });
    await expect(row('Hub, moved away')).toHaveCount(0);
    await row('Hub, moved here').getByRole('button', { name: 'Go to old position' }).click();
    await expect(row('Hub, moved away')).toBeFocused();
    await expect(row('Wheels')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(row('Hub, moved here')).toBeFocused();
  });

  test('UIC-TREE-COMPARE-6.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('tree-compare');
    await expect(page.getByRole('treegrid', { name: /^Specification/ })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('tree-compare', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
