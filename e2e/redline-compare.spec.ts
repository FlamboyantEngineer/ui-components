import { cellSelector, expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `${cellSelector(id)} .ui-redline-compare`;

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
    const deleted = requireDefined(await rows.nth(1).locator('del').first().boundingBox());
    const inserted = requireDefined(await rows.nth(1).locator('ins').first().boundingBox());
    expect(Math.abs(deleted.y - inserted.y)).toBeLessThan(2);
    expect(inserted.x).toBeGreaterThan(deleted.x);
    const written = page.locator(cell('content=written layout=inline'));
    await expect(written.locator('ins')).toHaveText([
      'Opening hours',
      'Open daily from nine to five.',
    ]);
    const typed = page.getByRole('group', { name: 'Typed identifiers' });
    await expect(typed.locator('.ui-redline-compare__row')).toHaveCount(4);
    await expect(typed.getByText('Numeric entry', { exact: true })).toHaveCount(2);
    await expect(typed.getByText('Text entry', { exact: true })).toHaveCount(1);
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
    const oldBox = requireDefined(await oldCell.boundingBox());
    const newBox = requireDefined(await newCell.boundingBox());
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
    await expect(output).toHaveText('Last decision: accepted scope (changed)');
    await expect(rows.nth(1)).toHaveAttribute('data-resolution', 'accepted');
    await expect(accept).toHaveAttribute('aria-pressed', 'true');
    await rows.nth(3).getByRole('button', { name: 'Reject' }).click();
    await expect(output).toHaveText('Last decision: rejected gloves (moved)');
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

  test('UIC-REDLINE-COMPARE-1.2 compares a rewritten document without ids quickly', async ({
    page,
    lab,
  }) => {
    await lab.open('redline-compare');
    const demo = page.locator('[data-lab-demo="large-input"]');
    await demo.getByRole('button', { name: /^Load 400 rewritten paragraphs/ }).click();
    const output = demo.locator('[data-lab-output="elapsed"]');
    await expect(output).toHaveText(/^\d+ characters in \d+ ms$/);
    const elapsed = Number(/in (\d+) ms/.exec((await output.textContent()) ?? '')?.[1]);
    expect(elapsed).toBeLessThan(5000);
    await expect(demo.getByRole('region', { name: 'Large input' })).toBeVisible();
  });

  test('UIC-REDLINE-COMPARE-2.3 never nests one link in another', async ({ page, lab }) => {
    await lab.open('redline-compare');
    const demo = page.locator('[data-lab-demo="links"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('a a')).toHaveCount(0);
    const links = demo.getByRole('link');
    await expect(links).toHaveText(['setup ', 'guide', ' appendix']);
    await links.nth(1).click();
    await expect(page).toHaveURL(/#appendix$/);
    await links.nth(0).click();
    await expect(page).toHaveURL(/#setup$/);
  });

  test('UIC-REDLINE-COMPARE-4.1 passes axe', async ({ page, lab }) => {
    await lab.open('redline-compare');
    await expect(page.getByRole('group', { name: /^Pump maintenance/ })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-REDLINE-COMPARE-2.4 UIC-REDLINE-COMPARE-3.1 UIC-PORTAL-1.8 moves focus to rows inside a shadow root', async ({
    page,
    lab,
  }) => {
    await lab.open('redline-compare');
    const demo = page.locator('[data-lab-demo="shadow-redline"]');
    await demo.scrollIntoViewIfNeeded();
    const rows = demo.locator('.ui-redline-compare__row');
    await demo.getByRole('button', { name: 'Next change' }).click();
    await expect(rows.and(page.locator('[data-current]'))).toBeFocused();
    await demo.getByRole('button', { name: 'Go to new position' }).click();
    const moved = rows.filter({ has: page.getByRole('button', { name: 'Go to old position' }) });
    await expect(moved).toBeFocused();
    await moved.getByRole('button', { name: 'Go to old position' }).click();
    await expect(
      rows.filter({ has: page.getByRole('button', { name: 'Go to new position' }) }),
    ).toBeFocused();
  });
});
