import { cellSelector, expect, familySelector, matrixCell, test } from './fixtures.js';

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
    // The column scrolls nothing: the text wraps inside it. A preserved space ending a line hangs
    // past the edge without overflowing, so the excerpt's own box is not the measure.
    const column = diff.locator('xpath=..');
    expect(await column.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect((await diff.boundingBox())?.height ?? 0).toBeGreaterThan(60);
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

test('UIC-INLINE-TEXT-DIFF-1.1 shows splitTextDiff in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('inline-text-diff');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call("splitTextDiff('The red apple', 'The green apple')")).toHaveText(
    '{"prefix":"The ","removed":"red","added":"green","suffix":" apple"}',
  );
  await expect(call("splitTextDiff('Porto', 'Porto')")).toHaveText(
    '{"prefix":"Porto","removed":"","added":"","suffix":""}',
  );
});

test('UIC-INLINE-TEXT-DIFF-2.4 switches between the changes and the final text', async ({
  page,
  lab,
}) => {
  await lab.open('inline-text-diff');
  const live = page.locator('[data-lab-live]');
  const diff = live.locator('.ui-inline-text-diff');
  const after = 'Ship the pears first, then pack the apples gently and label each crate.';
  await live
    .getByLabel('Before')
    .fill('Ship the plums first, then pack the apples gently and label each crate.');
  await live.getByLabel('After').fill(after);
  await expect(live.getByRole('deletion')).toHaveText('lum');
  await live.getByRole('radio', { name: 'Final text' }).click();
  await expect(diff).toHaveAttribute('data-view', 'final');
  await expect(diff).toHaveText(after);
  await expect(live.getByRole('deletion')).toHaveCount(0);
  await expect(live.getByRole('insertion')).toHaveCount(0);
  await live.getByLabel('After').fill('Ship the figs first.');
  await expect(diff).toHaveText('Ship the figs first.');
  await live.getByRole('radio', { name: 'Changes' }).click();
  await expect(live.getByRole('insertion')).toHaveText('figs first');
  await lab.expectAccessible();
});

test.describe('Inline Text Diff cases', () => {
  test('UIC-INLINE-TEXT-DIFF-1.2 cuts the excerpt to the chosen context and run limits', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-diff');
    const demo = page.locator('[data-lab-demo="excerpt-limits"]');
    const segments = demo.locator('[data-lab-output="segments"]');
    await expect(segments).toHaveText(
      'text: …, tarte aux pommes 🥧 et | removed: glace à la vanille 🍦 | added: sorbet au citron 🍋 | text: — servi avec un thé ver…',
    );
    await demo
      .getByRole('radiogroup', { name: 'Context' })
      .getByRole('radio', { name: '6', exact: true })
      .press('Space');
    await demo
      .getByRole('radiogroup', { name: 'Run' })
      .getByRole('radio', { name: '6', exact: true })
      .press('Space');
    await expect(segments).toHaveText(
      'text: … 🥧 et | removed: glace … | added: sorbet… | text: — ser…',
    );
    await expect(demo.getByRole('deletion')).toHaveText('glace …');
    await demo
      .getByRole('radiogroup', { name: 'Context' })
      .getByRole('radio', { name: '0', exact: true })
      .press('Space');
    await expect(segments).toHaveText('removed: glace … | added: sorbet…');
    await demo
      .getByRole('radiogroup', { name: 'Run' })
      .getByRole('radio', { name: '0', exact: true })
      .press('Space');
    await expect(segments).toHaveText('');
    await expect(demo.locator('.ui-inline-text-diff > *')).toHaveCount(0);
  });

  test('UIC-INLINE-TEXT-DIFF-2.4 shows finalText, else the joined segments, in the final view', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-diff');
    const final = (name: string) => page.locator(`[data-lab-final="${name}"] dd`);
    const whole =
      'Every crate leaves the orchard at dawn, packed with green pears, and reaches the market by noon.';
    await expect(final('excerpt with finalText')).toHaveText(whole);
    await expect(final('excerpt without finalText')).toHaveText(
      '…packed with green pears, and reach…',
    );
    await expect(final('word diff without finalText')).toHaveText(whole);
    await expect(page.locator('[data-lab-demo="final-sources"]').getByRole('deletion')).toHaveText([
      'red apple',
      'red apples',
    ]);
    await lab.expectAccessible(familySelector('inline-text-diff-cases'));
  });
});
