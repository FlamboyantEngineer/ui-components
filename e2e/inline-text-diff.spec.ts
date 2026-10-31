import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Inline Text Diff lab', () => {
  test('UIC-INLINE-TEXT-DIFF-2.1 shows a struck removed run and an added run in the sentence', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-diff');
    const cell = matrixCell(page, 'change=replace container=inline');
    await expect(cell).toHaveText('Description changed: The redgreen apple is ripe.');
    const removed = cell.getByRole('deletion');
    const added = cell.getByRole('insertion');
    await expect(removed).toHaveText('red');
    await expect(added).toHaveText('green');
    expect(await removed.evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe(
      'line-through',
    );
    expect(await added.evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe('none');
    const diffBox = await cell.locator('.ui-inline-text-diff').boundingBox();
    const cellBox = await cell.boundingBox();
    expect(Math.round(diffBox?.y ?? 0)).toBeLessThan(Math.round((cellBox?.y ?? 0) + 30));
  });

  test('UIC-INLINE-TEXT-DIFF-1.2 bounds long changes and wraps in a narrow column', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-diff');
    await expect(
      page.locator(
        `${cellSelector('change=first value container=inline')} .ui-inline-text-diff > *`,
      ),
    ).toHaveCount(1);
    await expect(matrixCell(page, 'change=cleared container=inline').locator('del')).toHaveText(
      'An old description',
    );
    const long = matrixCell(page, 'change=long change container=narrow');
    await expect(long.locator('ins')).toHaveText(/…$/);
    const diff = long.locator('.ui-inline-text-diff');
    expect((await diff.boundingBox())?.width ?? 0).toBeLessThanOrEqual(161);
    expect(await diff.evaluate((node) => node.scrollWidth <= 161)).toBe(true);
    await expect(matrixCell(page, 'change=markup container=inline').locator('ins')).toHaveText(
      'i>italic</i',
    );

    const live = page.locator('[data-lab-live]');
    await live.getByLabel('After').fill('The quick blue fox');
    await expect(live.getByRole('deletion')).toHaveText('rown');
    await expect(live.getByRole('insertion')).toHaveText('lue');
    await lab.expectAccessible();
  });

  test('UIC-INLINE-TEXT-DIFF-1.3 shows every changed run of words in place', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-diff');
    const several = page.locator('[data-lab-words="several words"]');
    await expect(several.getByRole('deletion')).toHaveText(['pears', 'Lisbon', 'Monday']);
    await expect(several.getByRole('insertion')).toHaveText(['plums', 'Porto', 'Friday']);
    const joined = page.locator('[data-lab-words="joined change"]');
    await expect(joined.getByRole('deletion')).toHaveText(['quick brown']);
    await expect(joined.getByRole('insertion')).toHaveText(['slow red']);
    await expect(page.locator('[data-lab-words="added sentence"] ins')).toHaveText(
      /^ ?Label each one\.$/,
    );
  });

  test('UIC-INLINE-TEXT-DIFF-2.1 keeps readable runs in the dark theme', async ({ page, lab }) => {
    await lab.open('inline-text-diff', { theme: 'dark' });
    await expect(page.locator('.ui-inline-text-diff__added').first()).toBeVisible();
    await lab.expectAccessible();
  });
});
