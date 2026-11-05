import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

function demo(page: Page, name: string): Locator {
  return page.locator(`[data-lab-demo="${name}"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('The element has no box.');
  return rect;
}

test.describe('Search Pane lab', () => {
  test('UIC-SEARCH-PANE-1.2 UIC-SEARCH-PANE-3.1 UIC-SEARCH-PANE-5.1 draws each state in each replace mode', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    for (const state of ['empty', 'idle', 'pending', 'results', 'no-results', 'error']) {
      for (const mode of ['none', 'hidable', 'shown']) {
        const pane = matrixCell(page, `state=${state} mode=${mode}`).locator('.ui-search-pane');
        await expect(pane).toHaveAttribute('data-state', state);
        await expect(pane).toHaveAttribute('data-replace-mode', mode);
      }
    }
    const search = matrixCell(page, 'state=results mode=none');
    await expect(search.getByRole('button', { name: 'Toggle replace' })).toHaveCount(0);
    await expect(search.getByRole('textbox', { name: 'Replace with' })).toHaveCount(0);
    await expect(search.locator('.ui-search-pane__result-read-only')).toHaveCount(0);
    await expect(
      matrixCell(page, 'state=results mode=hidable').getByRole('button', {
        name: 'Toggle replace',
      }),
    ).toHaveAttribute('aria-expanded', 'false');
    const replace = matrixCell(page, 'state=results mode=shown');
    await expect(replace.getByRole('button', { name: 'Toggle replace' })).toHaveCount(0);
    await expect(replace.getByRole('textbox', { name: 'Replace with' })).toBeVisible();
    await expect(replace.getByRole('button', { name: 'Replace', exact: true })).toBeDisabled();
    await expect(replace.locator('.ui-find-bar__status')).toHaveText('7 of 11');
    const pending = matrixCell(page, 'state=pending mode=none');
    await expect(pending.getByRole('option')).toHaveCount(2);
    await expect(pending.locator('.ui-find-bar__status')).toHaveText('Searching…');
    await expect(matrixCell(page, 'state=error mode=none').getByRole('alert')).toHaveText(
      'The search failed.',
    );
    await expect(
      matrixCell(page, 'state=unavailable mode=none').locator('.ui-search-pane__message'),
    ).toHaveText('Open a document to search it.');
    await lab.expectAccessible();
  });

  test('UIC-SEARCH-PANE-1.3 UIC-SEARCH-PANE-2.1 UIC-SEARCH-PANE-2.2 steps with wrapping and chooses rows', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'document');
    const query = area.getByRole('searchbox', { name: 'Find in the guide' });
    const status = area.locator('.ui-find-bar__status');
    const list = area.getByRole('listbox', { name: 'Search results' });
    await expect(status).toHaveText('11 matches');
    await query.press('Enter');
    await expect(status).toHaveText('1 of 11');
    await expect(area.locator('mark[data-lab-current]')).toHaveText('pear');
    await query.press('Shift+Enter');
    await expect(status).toHaveText('11 of 11');
    await query.press('Enter');
    await expect(status).toHaveText('1 of 11');
    const last = list.getByRole('option').last();
    await query.press('Shift+Enter');
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await expect(async () => {
      const row = await box(last);
      const scroller = await box(list);
      expect(row.y + row.height).toBeLessThanOrEqual(scroller.y + scroller.height + 1);
    }).toPass({ timeout: 10_000 });
    await expect(query).toBeFocused();
    await list.getByRole('option').nth(2).click();
    await expect(status).toHaveText('3 of 11');
    await expect(area.locator('[data-lab-output="current"]')).toHaveText('intro:2');
    await page.keyboard.press('ArrowDown');
    await expect(status).toHaveText('3 of 11');
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('4 of 11');
    await lab.expectAccessible('[data-lab-demo="document"]');
  });

  test('UIC-SEARCH-PANE-1.4 closes on Escape, keeps the query, and opens again with Ctrl+F and Ctrl+H', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'document');
    const query = area.getByRole('searchbox', { name: 'Find in the guide' });
    await query.press('Enter');
    await query.press('Escape');
    await expect(area.locator('[data-lab-output="open"]')).toHaveText('no');
    const document = area.getByRole('document', { name: 'Orchard guide' });
    await expect(document).toBeFocused();
    await document.press('ControlOrMeta+f');
    await expect(query).toBeFocused();
    await expect(query).toHaveValue('pear');
    await expect(area.locator('.ui-find-bar__status')).toHaveText('1 of 11');
    await query.press('ControlOrMeta+h');
    const replacement = area.getByRole('textbox', { name: 'Replace with' });
    await expect(replacement).toBeFocused();
    await expect(area.getByRole('button', { name: 'Toggle replace' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await replacement.press('Escape');
    await document.press('ControlOrMeta+h');
    await expect(area.getByRole('textbox', { name: 'Replace with' })).toBeFocused();
  });

  test('UIC-SEARCH-PANE-3.2 UIC-SEARCH-PANE-3.3 replaces what may be replaced', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'document');
    const status = area.locator('.ui-find-bar__status');
    await area.getByRole('button', { name: 'Toggle replace' }).click();
    const replace = area.getByRole('button', { name: 'Replace', exact: true });
    await expect(replace).toBeDisabled();
    const locked = area.getByRole('option', { name: /Storage \(locked\)/ });
    await expect(locked.first()).toHaveAttribute('data-read-only', 'true');
    await expect(locked.first()).toContainText('Can’t be replaced');
    await locked.first().click();
    await expect(replace).toBeDisabled();
    await area.getByRole('option').first().click();
    await expect(replace).toBeEnabled();
    await replace.click();
    await expect(area.locator('[data-lab-output="replaced"]')).toHaveText(
      'replaced intro:0 with quince',
    );
    await expect(status).toHaveText('1 of 10');
    await area.getByRole('button', { name: 'Replace all' }).click();
    await expect(status).toHaveText('3 matches');
    await expect(area.getByRole('option')).toHaveCount(3);
    await expect(area.getByRole('button', { name: 'Replace all' })).toBeDisabled();
  });

  test('UIC-SEARCH-PANE-3.1 searches only in a read-only document', async ({ page, lab }) => {
    await lab.open('search-pane');
    const area = demo(page, 'read-only');
    await expect(area.locator('.ui-search-pane')).toHaveAttribute('data-replace-mode', 'none');
    await expect(area.getByRole('button', { name: 'Toggle replace' })).toHaveCount(0);
    const query = area.getByRole('searchbox', { name: 'Find in the guide' });
    await query.press('ControlOrMeta+h');
    await expect(query).toBeFocused();
    await expect(area.getByRole('textbox', { name: 'Replace with' })).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="read-only"]');
  });

  test('UIC-SEARCH-PANE-2.3 mounts a page of rows while counting and stepping cover every match', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'many-results');
    const list = area.getByRole('listbox', { name: 'Search results' });
    const status = area.locator('.ui-find-bar__status');
    await expect(list.getByRole('option')).toHaveCount(200);
    await expect(status).toHaveText('820 matches');
    await area.getByRole('searchbox').press('Shift+Enter');
    await expect(status).toHaveText('820 of 820');
    await expect(list.getByRole('option')).toHaveCount(20);
    await expect(list.getByRole('option').last()).toHaveAttribute('aria-selected', 'true');
    await expect(area.locator('[data-lab-output="current"]')).toHaveText('819');
    await area.getByRole('button', { name: 'Show 800 earlier results' }).click();
    await expect(list.getByRole('option').first()).toContainText('Entry 601');
    await area.getByRole('searchbox').press('Enter');
    await expect(status).toHaveText('1 of 820');
    await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await expect(area.getByRole('button', { name: 'Show 620 more results' })).toBeVisible();
  });

  test('UIC-SEARCH-PANE-5.2 wraps a narrow find row with the count and arrows together at the start', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'read-only');
    const find = area.locator('.ui-find-bar');
    const query = area.locator('.ui-find-bar__query');
    const status = area.locator('.ui-find-bar__status');
    const next = area.getByRole('button', { name: 'Next match' });
    await expect(async () => {
      const [findBox, queryBox, statusBox, nextBox] = await Promise.all([
        box(find),
        box(query),
        box(status),
        box(next),
      ]);
      expect(statusBox.y).toBeGreaterThanOrEqual(queryBox.y + queryBox.height - 1);
      expect(Math.abs(statusBox.x - findBox.x)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(statusBox.y + statusBox.height / 2 - (nextBox.y + nextBox.height / 2)),
      ).toBeLessThanOrEqual(2);
    }).toPass({ timeout: 10_000 });
    await area.getByText('Narrow panel').click();
    await expect(async () => {
      const [queryBox, statusBox] = await Promise.all([box(query), box(status)]);
      expect(Math.abs(statusBox.y - queryBox.y)).toBeLessThanOrEqual(queryBox.height);
    }).toPass({ timeout: 10_000 });
  });

  test('UIC-SEARCH-PANE-4.2 UIC-SEARCH-PANE-5.2 draws snippets on one line and keeps the match in a narrow row', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const gallery = demo(page, 'snippets');
    for (const name of ['multiline', 'long-context', 'inside-word', 'long-word', 'unicode']) {
      const item = gallery.locator(`[data-lab-case="${name}"]`);
      for (const width of ['wide', 'narrow']) {
        const snippet = item.locator(`[data-lab-width="${width}"] .ui-search-snippet`);
        const match = snippet.locator('.ui-search-snippet__match');
        await expect(async () => {
          const [snippetBox, matchBox] = await Promise.all([box(snippet), box(match)]);
          expect(matchBox.height).toBeLessThanOrEqual(snippetBox.height + 1);
          expect(snippetBox.height).toBeLessThan(40);
          expect(matchBox.x).toBeGreaterThanOrEqual(snippetBox.x - 1);
          expect(matchBox.x + matchBox.width).toBeLessThanOrEqual(
            snippetBox.x + snippetBox.width + 1,
          );
        }).toPass({ timeout: 10_000 });
      }
    }
    const multiline = gallery.locator('[data-lab-case="multiline"] [data-lab-width="wide"]');
    await expect(multiline.locator('.ui-search-snippet')).toHaveText(
      '…paragraph second line, where the match sits after tabs',
    );
    const narrow = gallery.locator('[data-lab-case="long-context"] [data-lab-width="narrow"]');
    const near = narrow.locator('.ui-search-snippet__near');
    await expect(async () => {
      const [nearBox, leadBox] = await Promise.all([
        box(near),
        box(narrow.locator('.ui-search-snippet__lead')),
      ]);
      expect(leadBox.width).toBeLessThan(30);
      expect(nearBox.width).toBeGreaterThan(10);
    }).toPass({ timeout: 10_000 });
    await lab.expectAccessible('[data-lab-demo="snippets"]');
  });

  test('UIC-SEARCH-PANE-5.2 UIC-SEARCH-PANE-1.3 keeps the arrows snug without a count, or leaves them out', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const idle = matrixCell(page, 'state=idle mode=none');
    await expect(async () => {
      const [query, previous] = await Promise.all([
        box(idle.locator('.ui-find-bar__query')),
        box(idle.getByRole('button', { name: 'Previous match' })),
      ]);
      expect(previous.x - (query.x + query.width)).toBeLessThanOrEqual(6);
    }).toPass({ timeout: 10_000 });
    const area = demo(page, 'document');
    await area.getByText('Hide arrows without results').click();
    const query = area.getByRole('searchbox', { name: 'Find in the guide' });
    await query.fill('quince jam');
    await expect(area.getByRole('button', { name: 'Next match' })).toHaveCount(0);
    await query.fill('pear');
    await expect(area.getByRole('button', { name: 'Next match' })).toBeEnabled();
  });

  test('UIC-SEARCH-PANE-3.1 UIC-SEARCH-PANE-5.2 keeps Replace and Replace all on the replacement line', async ({
    page,
    lab,
  }) => {
    await lab.open('search-pane');
    const area = demo(page, 'document');
    await area.getByRole('radio', { name: 'Replace shown' }).click();
    await expect(area.getByRole('button', { name: 'Toggle replace' })).toHaveCount(0);
    const replacement = area.getByRole('textbox', { name: 'Replace with' });
    const replaceAll = area.getByRole('button', { name: 'Replace all' });
    const query = area.locator('.ui-find-bar__query');
    for (const narrow of [false, true]) {
      if (narrow) await area.getByText('Narrow panel').click();
      await expect(async () => {
        const [field, all, search, pane] = await Promise.all([
          box(replacement),
          box(replaceAll),
          box(query),
          box(area.locator('.ui-search-pane__find')),
        ]);
        expect(Math.abs(field.y + field.height / 2 - (all.y + all.height / 2))).toBeLessThanOrEqual(
          2,
        );
        expect(all.x + all.width).toBeGreaterThan(pane.x + pane.width - 8);
        expect(field.y).toBeGreaterThan(search.y);
      }).toPass({ timeout: 10_000 });
    }
  });
});
