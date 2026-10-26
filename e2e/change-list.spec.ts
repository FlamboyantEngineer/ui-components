import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-change-list`;

test.describe('Change List lab', () => {
  test('UIC-CHANGE-LIST-1.1 UIC-CHANGE-LIST-1.3 UIC-CHANGE-LIST-1.4 UIC-CHANGE-LIST-1.5 shows each change on one line', async ({
    page,
    lab,
  }) => {
    await lab.open('change-list');
    const list = page.locator(cell('variant=compact'));
    const rows = list.locator('.ui-change-list__change');
    await expect(rows.locator('dt')).toHaveText([
      'Status',
      'Method',
      'Tags',
      'Servings',
      'Reviewer',
      'Deadline',
    ]);
    expect(
      await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-change'))),
    ).toEqual(['changed', 'changed', 'changed', 'changed', 'added', 'removed']);
    await expect(rows.nth(0).locator('del')).toHaveText('Draft');
    await expect(rows.nth(0).locator('ins')).toHaveText('Approved');
    await expect(rows.nth(1).locator('.ui-change-list__text del')).toHaveText([
      'ten',
      'for an hour',
    ]);
    await expect(rows.nth(1).locator('.ui-change-list__text ins')).toHaveText([
      'eight',
      'overnight in the fridge',
    ]);
    await expect(rows.nth(2).locator('.ui-change-list__item')).toHaveText([
      'weekday',
      'weekend',
      'slow',
    ]);
    const label = requireDefined(await rows.nth(0).locator('dt').boundingBox());
    const old = requireDefined(await rows.nth(0).locator('del').boundingBox());
    const next = requireDefined(await rows.nth(0).locator('ins').boundingBox());
    expect(old.x).toBeGreaterThan(label.x + label.width);
    expect(next.x).toBeGreaterThan(old.x + old.width);
    expect(Math.abs(next.y - old.y)).toBeLessThan(4);
  });

  test('UIC-CHANGE-LIST-1.2 UIC-CHANGE-LIST-1.6 stacks captioned sides with who and when', async ({
    page,
    lab,
  }) => {
    await lab.open('change-list');
    const list = page.locator(cell('variant=detailed'));
    await expect(list).toHaveAttribute('data-variant', 'detailed');
    const status = list.locator('.ui-change-list__change').first();
    await expect(status.locator('.ui-change-list__side')).toHaveText([
      'Before Draft',
      'After Approved',
    ]);
    const before = requireDefined(await status.locator('[data-side="before"]').boundingBox());
    const after = requireDefined(await status.locator('[data-side="after"]').boundingBox());
    expect(after.y).toBeGreaterThanOrEqual(before.y + before.height - 1);
    await expect(list.locator('.ui-change-list__empty')).toHaveText(['Empty', 'Empty']);
    const attributed = page.locator(cell('avatar=avatar variant=compact'));
    await expect(attributed.locator('.ui-change-list__attribution')).toHaveText([
      /^18 minutes ago by .*Maria Santos$/,
      /^19 hours ago by .*Jon Berg$/,
      /^Apr 12, 2026 by .*Maria Santos$/,
    ]);
  });

  test('UIC-CHANGE-LIST-1.3 recomputes the changes between revisions', async ({ page, lab }) => {
    await lab.open('change-list');
    const demo = page.locator('[data-lab-demo="revisions"]');
    await expect(demo.locator('dt')).toHaveText(['Servings', 'Notes']);
    await demo.getByRole('button', { name: 'Next revision' }).click();
    await expect(demo.locator('dt')).toHaveText(['Title']);
    await expect(demo.locator('.ui-change-list__new')).toHaveText('Lemon and lime tart');
  });

  test('UIC-CHANGE-LIST-2.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('change-list');
    await expect(page.locator(cell('variant=compact'))).toHaveAttribute(
      'aria-label',
      'Changes, compact',
    );
    await lab.expectAccessible();
    await lab.open('change-list', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
