import { expect, test, matrixCell } from './fixtures.js';

test.describe('Text Match lab', () => {
  test('UIC-TEXT-MATCH-2.1 UIC-TEXT-MATCH-1.3 marks substrings or words for each query', async ({
    page,
    lab,
  }) => {
    await lab.open('text-match');
    const marks = (query: string, matching: string) =>
      matrixCell(page, `query=${query} matching=${matching}`).locator(`mark.ui-text-match`);
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

  test('UIC-TEXT-MATCH-1.4 UIC-TEXT-MATCH-2.5 ignores accents on request and tints each term', async ({
    page,
    lab,
  }) => {
    await lab.open('text-match');
    const marks = (query: string, accents: string) =>
      matrixCell(page, `query=${query} accents=${accents}`).locator(`mark.ui-text-match`);
    await expect(marks('cafe', 'exact')).toHaveCount(0);
    await expect(marks('cafe', 'ignored')).toHaveText(['Café', 'café']);
    await expect(marks('café', 'exact')).toHaveText(['Café', 'café']);
    const terms = marks('lait creme cafe', 'ignored');
    await expect(terms).toHaveText(['Café', 'crème', 'crème', 'café', 'lait']);
    const termOf = (index: number) => terms.nth(index).getAttribute('data-term');
    expect(await Promise.all([0, 1, 2, 3, 4].map(termOf))).toEqual(['2', '1', '1', '2', '0']);
    const tint = (index: number) =>
      terms.nth(index).evaluate((node) => getComputedStyle(node).backgroundColor);
    const [lait, creme, cafe] = await Promise.all([tint(4), tint(1), tint(0)]);
    expect(new Set([lait, creme, cafe]).size).toBe(3);
    await expect(matrixCell(page, 'query=lait creme cafe accents=ignored')).toHaveText(
      'Café crème, crème brûlée and a café au lait',
    );
    await lab.expectAccessible();
  });

  test('UIC-TEXT-MATCH-1.4 matches composed and decomposed accents alike', async ({
    page,
    lab,
  }) => {
    await lab.open('text-match');
    const marks = (text: string, query: string, accents: string) =>
      page.locator(
        `[data-lab-cell="text=${text} query=${query} accents=${accents}"] mark.ui-text-match`,
      );
    for (const text of ['composed', 'decomposed']) {
      await expect(marks(text, 'resume', 'exact')).toHaveCount(0);
      await expect(marks(text, 'resume', 'ignored')).toHaveCount(1);
      await expect(marks(text, 'r\u00e9sum\u00e9', 'exact')).toHaveCount(1);
      await expect(marks(text, 'r\u00e9sum\u00e9', 'ignored')).toHaveCount(1);
    }
    await expect(marks('decomposed', 'resume', 'ignored')).toHaveText('re\u0301sume\u0301');
  });
});
