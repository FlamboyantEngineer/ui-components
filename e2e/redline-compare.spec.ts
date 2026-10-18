import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-redline-compare`;

test.describe('Redline Compare lab', () => {
  test('UIC-REDLINE-COMPARE-2.1 draws deleted and inserted words inline', async ({ page, lab }) => {
    await lab.open('redline-compare');
    const compare = page.locator(cell('content=edited layout=inline'));
    await expect(compare).toHaveAttribute('data-layout', 'inline');
    const rows = compare.locator('.ui-redline-compare__row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toHaveAttribute('data-change', 'unchanged');
    await expect(rows.nth(1)).toHaveAttribute('data-change', 'changed');
    await expect(rows.nth(1).locator('del')).toHaveText(['nine', 'five']);
    await expect(rows.nth(1).locator('ins')).toHaveText(['eight', 'six']);
    const deleted = (await rows.nth(1).locator('del').first().boundingBox())!;
    const inserted = (await rows.nth(1).locator('ins').first().boundingBox())!;
    expect(Math.abs(deleted.y - inserted.y)).toBeLessThan(2);
    expect(inserted.x).toBeGreaterThan(deleted.x);
    const written = page.locator(cell('content=written layout=inline'));
    await expect(written.locator('ins')).toHaveText([
      'Opening hours',
      'Open daily from nine to five.',
    ]);
  });

  test('UIC-REDLINE-COMPARE-2.2 sets the old and new cells side by side', async ({ page, lab }) => {
    await lab.open('redline-compare');
    const compare = page.locator(cell('content=edited layout=split'));
    await expect(compare.locator('.ui-redline-compare__column-label')).toHaveText([
      'Before',
      'After',
    ]);
    const row = compare.locator('.ui-redline-compare__row').nth(1);
    const oldCell = row.locator('.ui-redline-compare__cell[data-side="old"]');
    const newCell = row.locator('.ui-redline-compare__cell[data-side="new"]');
    await expect(oldCell.locator('del')).toHaveText(['nine', 'five']);
    await expect(oldCell.locator('ins')).toHaveCount(0);
    await expect(newCell.locator('ins')).toHaveText(['eight', 'six']);
    const oldBox = (await oldCell.boundingBox())!;
    const newBox = (await newCell.boundingBox())!;
    expect(newBox.x).toBeGreaterThanOrEqual(oldBox.x + oldBox.width - 1);
    expect(Math.abs(oldBox.y - newBox.y)).toBeLessThan(1);
    const written = page.locator(cell('content=written layout=split'));
    await expect(
      written.locator('.ui-redline-compare__cell[data-side="old"][data-empty]'),
    ).toHaveCount(2);
  });

  test('UIC-REDLINE-COMPARE-2.4 UIC-REDLINE-COMPARE-3.1 notes changes and steps between them', async ({
    page,
    lab,
  }) => {
    await lab.open('redline-compare');
    const review = page.locator('[data-lab-demo="review"]');
    const compare = review.getByRole('group', { name: 'Pump maintenance, revision 3 to 4' });
    const rows = compare.locator('.ui-redline-compare__row');
    await expect(compare.locator('.ui-redline-compare__summary')).toHaveText(
      '1 added, 5 changed, 1 moved',
    );
    await expect(rows.nth(10).locator('[data-note="type"]')).toHaveText('Paragraph became Quote');
    await expect(rows.nth(4).locator('[data-note="format"]')).toHaveText('Formatting changed');
    await expect(rows.nth(9).locator('a[data-mark="link"]')).toHaveAttribute('href', '#manual');
    await expect(rows.nth(5).locator('.ui-redline-compare__block')).toHaveAttribute(
      'data-level',
      '2',
    );
    await compare.getByRole('button', { name: 'Next change' }).click();
    await expect(rows.nth(1)).toBeFocused();
    await expect(rows.nth(1)).toHaveAttribute('data-current', 'true');
    await page.keyboard.press('n');
    await expect(rows.nth(3)).toBeFocused();
    await page.keyboard.press('n');
    await page.keyboard.press('n');
    await page.keyboard.press('n');
    await expect(rows.nth(9)).toBeFocused();
    await page.keyboard.press('p');
    await expect(rows.nth(5)).toBeFocused();
    await rows.nth(7).getByRole('button', { name: 'Go to new position' }).click();
    await expect(rows.nth(3)).toBeFocused();
    await expect(rows.nth(3)).toHaveAttribute('data-move', 'to');
    await rows.nth(3).getByRole('button', { name: 'Go to old position' }).click();
    await expect(rows.nth(7)).toBeFocused();
  });

  test('UIC-REDLINE-COMPARE-3.2 reports decisions and keeps them across layouts', async ({
    page,
    lab,
  }) => {
    await lab.open('redline-compare');
    const review = page.locator('[data-lab-demo="review"]');
    const rows = review.locator('.ui-redline-compare__row');
    const output = review.locator('[data-lab-output]');
    const accept = rows.nth(1).getByRole('button', { name: 'Accept' });
    await accept.click();
    await expect(output).toHaveText('Last decision: accepted id:scope (changed)');
    await expect(rows.nth(1)).toHaveAttribute('data-resolution', 'accepted');
    await expect(accept).toHaveAttribute('aria-pressed', 'true');
    await rows.nth(3).getByRole('button', { name: 'Reject' }).click();
    await expect(output).toHaveText('Last decision: rejected id:gloves (moved)');
    await expect(rows.nth(7).getByRole('button', { name: 'Accept' })).toHaveCount(0);
    await review.getByRole('radio', { name: 'Side by side' }).click();
    await expect(review.locator('.ui-redline-compare')).toHaveAttribute('data-layout', 'split');
    await expect(review.locator('.ui-redline-compare__column-label')).toHaveText([
      'Revision 3',
      'Revision 4',
    ]);
    await expect(rows.nth(1)).toHaveAttribute('data-resolution', 'accepted');
    await expect(rows.nth(3)).toHaveAttribute('data-resolution', 'rejected');
  });

  test('UIC-REDLINE-COMPARE-4.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('redline-compare');
    await expect(page.getByRole('group', { name: /^Pump maintenance/ })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('redline-compare', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
