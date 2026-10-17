import { expect, test } from './fixtures.js';

test.describe('Text Match lab', () => {
  test('UIC-TEXT-MATCH-2.1 UIC-TEXT-MATCH-1.3 marks substrings or words for each query', async ({
    page,
    lab,
  }) => {
    await lab.open('text-match');
    const marks = (query: string, matching: string) =>
      page.locator(`[data-lab-cell="query=${query} matching=${matching}"] mark.ui-text-match`);
    await expect(marks('(none)', 'substring')).toHaveCount(0);
    await expect(marks('to', 'substring')).toHaveCount(3);
    await expect(marks('to', 'words')).toHaveCount(2);
    await expect(marks('fav', 'words')).toHaveText(['Fav']);
    await expect(marks('line height', 'substring')).toHaveText(['Line', 'height']);
    await expect(marks('pear', 'substring')).toHaveCount(0);
    const background = await marks('to', 'words')
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('UIC-TEXT-MATCH-2.1 UIC-TEXT-MATCH-2.4 marks as the reader types and keeps names', async ({
    page,
    lab,
  }) => {
    await lab.open('text-match');
    const filter = page.locator('[data-lab-filter]');
    const input = filter.getByRole('searchbox', { name: 'Filter cities' });
    const status = filter.locator('[data-lab-filter-status]');
    await expect(status).toHaveText('8 of 8 labels contain every term');
    await input.fill('to');
    await expect(filter.locator('mark')).toHaveCount(5);
    await expect(status).toHaveText('4 of 8 labels contain every term');
    await filter.getByRole('checkbox', { name: 'Match words' }).check();
    await expect(filter.locator('mark')).toHaveCount(0);
    await input.fill('tok');
    await expect(filter.locator('mark')).toHaveText(['Tok']);
    await expect(filter.getByRole('listitem').filter({ hasText: 'Tokyo' })).toHaveText('Tokyo');
    await lab.expectAccessible();
  });
});
