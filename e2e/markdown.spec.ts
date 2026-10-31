import { expect, test, matrixCell } from './fixtures.js';

test.describe('Markdown lab', () => {
  test('UIC-MARKDOWN-2.1 UIC-MARKDOWN-3.1 renders each construct with native semantics', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const text = matrixCell(page, 'content=text text=body').locator('.ui-markdown');
    await expect(text.getByRole('heading', { level: 2 })).toHaveText([
      'Orchard notes',
      'Setext heading',
    ]);
    await expect(text.locator('em')).toHaveText('ripe');
    await expect(text.locator('del')).toHaveText('in the rain');
    await expect(text.locator('br')).toHaveCount(1);
    await expect(text).toContainText('*stars* and entities: © 2026 — Cider & Co.');
    const lists = matrixCell(page, 'content=lists text=body').locator('.ui-markdown');
    await expect(lists.getByRole('list')).toHaveCount(3);
    await expect(lists.locator('ol')).toHaveAttribute('start', '3');
    await expect(lists.locator('li p')).toHaveCount(0);
    const quote = matrixCell(page, 'content=quote text=body').locator('.ui-markdown');
    await expect(quote.locator('blockquote blockquote')).toHaveText('A nested remark.');
    await expect(quote.getByRole('separator')).toHaveCount(1);
    const nested = page.locator('[data-lab-nested]');
    await expect(nested.locator('blockquote')).toHaveCount(6);
    await expect(nested.getByRole('list')).toHaveCount(2);
    await expect(nested.getByRole('listitem')).toHaveCount(2);
    await expect(
      matrixCell(page, 'content=text text=small').locator('.ui-markdown p').first(),
    ).toHaveCSS('font-size', '12px');
    await lab.expectAccessible();
  });

  test('UIC-MARKDOWN-1.5 UIC-MARKDOWN-1.6 continues only an open paragraph lazily', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const lazy = page.locator('[data-lab-lazy]');
    await expect(lazy.locator('blockquote').first()).toHaveText(
      'Apples keep for months\nwhen stored cool.',
    );
    await expect(lazy.locator('blockquote').nth(1)).toHaveText('Pears');
    await expect(lazy.locator(':scope > p')).toHaveText([
      'Pears ripen off the tree.',
      'Press after the harvest.',
    ]);
    await expect(lazy.getByRole('listitem')).toHaveText('press --cool');
  });

  test('UIC-MARKDOWN-1.4 keeps the tabs of code inside quotes and lists', async ({ page, lab }) => {
    await lab.open('markdown');
    const code = page.locator('[data-lab-tabs] .ui-markdown__code-block code');
    await expect(code).toHaveCount(2);
    expect(await code.allTextContents()).toEqual([
      'press:\n\tpress --batch 4',
      'clean:\n\trm -f cider',
    ]);
  });

  test('UIC-MARKDOWN-2.3 draws links through Link, opening absolute URLs in a new tab', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const links = matrixCell(page, 'content=links text=body').locator('.ui-markdown');
    const internal = links.getByRole('link', { name: 'planting guide' });
    await expect(internal).toHaveAttribute('href', '/guides/planting');
    await expect(internal).not.toHaveAttribute('target');
    await expect(internal).toHaveAttribute('title', 'Planting by season');
    const external = links.getByRole('link', { name: 'seed catalogue (opens in a new tab)' });
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(external).toHaveAttribute('title', 'Seeds for every orchard');
    await expect(links.getByRole('link', { name: 'orchard@example.com' })).toHaveAttribute(
      'href',
      'mailto:orchard@example.com',
    );
  });

  test('UIC-MARKDOWN-2.4 UIC-MARKDOWN-2.5 styles code blocks by hook and aligns table columns', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const code = matrixCell(page, 'content=code text=body');
    const block = code.locator('.ui-markdown__code-block').first();
    await expect(block).toHaveAttribute('data-language', 'sh');
    // Only the hook attribute names the language: highlighters go through an override.
    await expect(block.locator('code')).not.toHaveAttribute('class');
    await expect(block).toHaveCSS('font-family', /monospace/);
    await expect(code.locator('.ui-markdown__code-block')).toHaveCount(2);
    await expect(code.locator('.ui-markdown__code')).toHaveText('press --batch 4');
    const table = matrixCell(page, 'content=table text=body').getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveText(['Fruit', 'Orchard', 'Crates']);
    await expect(table.locator('td[data-align="end"]').first()).toHaveCSS('text-align', 'end');
    await expect(table.locator('th[data-align="center"]')).toHaveCSS('text-align', 'center');
  });

  test('UIC-MARKDOWN-2.6 shows task items as read-only checkboxes', async ({ page, lab }) => {
    await lab.open('markdown');
    const tasks = page.locator('[data-lab-tasks]');
    const done = tasks.getByRole('checkbox', { name: 'Prune the apple trees' });
    const open = tasks.getByRole('checkbox', { name: 'Order crates' });
    await expect(done).toBeChecked();
    await expect(open).not.toBeChecked();
    await tasks.getByText('Order').click();
    await expect(open).not.toBeChecked();
    await expect(tasks.locator('.ui-markdown__task')).toHaveCount(3);
    await expect(tasks.locator('.ui-markdown__task').nth(2).locator('p')).toHaveText(
      'Use the small press first.',
    );
  });

  test('UIC-MARKDOWN-2.2 UIC-MARKDOWN-2.9 feeds an outline and follows in-page links', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const guide = page.locator('[data-lab-guide]');
    await expect(guide.getByRole('heading', { name: 'Planting' })).toHaveAttribute(
      'id',
      'guide-planting',
    );
    await expect(guide.getByRole('link', { name: 'harvest' })).toHaveAttribute(
      'href',
      '#guide-harvest',
    );
    const outline = page.getByRole('navigation', { name: 'Guide outline' });
    await expect(outline.getByRole('link')).toHaveText([
      'Orchard guide',
      'Planting',
      'Soil',
      'Harvest',
      'Après-récolte',
    ]);
    await outline.getByRole('link', { name: 'Soil' }).click();
    await expect(guide.getByRole('heading', { name: 'Soil' })).toBeInViewport();
    await guide.getByRole('link', { name: 'harvest' }).click();
    await expect(page).toHaveURL(/#guide-harvest$/);
    // A percent-encoded link to an accented heading follows its prefixed id.
    const after = guide.getByRole('link', { name: 'winter care' });
    await expect(after).toHaveAttribute('href', '#guide-apres-recolte');
    await after.click();
    await expect(page).toHaveURL(/#guide-apres-recolte$/);
    await expect(guide.getByRole('heading', { name: 'Après-récolte' })).toBeInViewport();
  });

  test('UIC-MARKDOWN-2.7 marks the query of a text match provider', async ({ page, lab }) => {
    await lab.open('markdown');
    const document = page.locator('[data-lab-find]');
    await expect(document.locator('mark.ui-text-match')).toHaveText(['apple', 'Apple']);
    await page.getByRole('searchbox', { name: 'Find in notes' }).fill('pear');
    await expect(document.locator('mark.ui-text-match')).toHaveText(['pear', 'Pear']);
  });

  test('UIC-MARKDOWN-2.8 UIC-MARKDOWN-1.12 renders overrides and keeps unsafe content inert', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const overrides = page.locator('[data-lab-overrides]');
    await expect(overrides.locator('[data-lab-chart] li')).toHaveCount(3);
    await expect(overrides.getByRole('img', { name: 'A pear' })).toBeVisible();
    await expect(overrides.getByRole('heading', { level: 2 })).toHaveAttribute(
      'id',
      'override-harvest-by-month',
    );
    const unsafe = page.locator('[data-lab-unsafe]');
    await expect(unsafe.locator('script, b, img')).toHaveCount(0);
    await expect(unsafe).toContainText('<b onclick="window.unsafe = true">bold</b>');
    await expect(unsafe.getByRole('link')).toHaveCount(0);
    await expect(unsafe).toContainText('A script link and a data image');
    const spans = page.locator('[data-lab-unsafe-spans]');
    await expect(spans.locator('code')).toHaveCount(8);
    await expect(spans.getByRole('link')).toHaveCount(0);
    await unsafe.getByText(/Raw HTML/).click();
    expect(await page.evaluate(() => (window as { unsafe?: boolean }).unsafe)).toBeUndefined();
    await lab.expectAccessible();
  });

  test('UIC-MARKDOWN-2.11 UIC-MARKDOWN-2.12 streams an answer without raw markers, rendering only the changed block', async ({
    page,
    lab,
  }) => {
    test.slow();
    await page.clock.install();
    await lab.open('markdown');
    // Time moves only when the test runs the clock, so every step adds exactly one chunk.
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
    const demo = page.locator('[data-lab-demo="streaming"]');
    const stream = demo.locator('[data-lab-stream]');
    const progress = demo.locator('[data-lab-output="progress"]');
    await demo.getByRole('button', { name: 'Stream the answer' }).click();
    await expect(stream).toHaveAttribute('data-streaming', 'true');
    const total = Number(/of (\d+)/.exec((await progress.textContent()) ?? '')?.[1]);
    const late: number[] = [];
    for (let step = 0; step < total; step += 1) {
      await page.clock.runFor(40);
      // React commits after the timer fires, so wait for this chunk before reading the page.
      await expect(progress).toContainText(`Chunk ${step + 1} of`);
      if ((await stream.getAttribute('data-streaming')) !== 'true') break;
      expect(await stream.innerText()).not.toMatch(/\*\*|\]\(|```|\|\s*---|^\s*[-#>]\s*$/m);
      if (step === 40) {
        await page.evaluate(() => {
          (window as { firstHeading?: Element | null }).firstHeading =
            document.querySelector('[data-lab-stream] h2');
        });
      }
      if (await stream.locator('blockquote').count()) {
        late.push(Number(/· (\d+) nodes/.exec((await progress.textContent()) ?? '')?.[1]));
      }
    }
    await page.clock.runFor(400);
    await expect(stream).not.toHaveAttribute('data-streaming');
    // A finished block keeps its element while the rest of the answer streams in.
    expect(
      await page.evaluate(
        () =>
          (window as { firstHeading?: Element | null }).firstHeading ===
          document.querySelector('[data-lab-stream] h2'),
      ),
    ).toBe(true);
    expect(late.length).toBeGreaterThan(3);
    expect(Math.max(...late)).toBeLessThanOrEqual(12);
    await expect(stream.getByRole('table').getByRole('row')).toHaveCount(6);
    await expect(stream.getByRole('group', { name: 'console' })).toHaveAttribute(
      'data-variant',
      'terminal',
    );
    await expect(stream.locator('ol > li')).toHaveCount(3);
    await expect(stream.locator('.ui-chat-citation')).toHaveCount(2);
    await expect(demo.getByRole('list', { name: '2 sources' })).toBeVisible();
    await page.clock.resume();
    await lab.expectAccessible('[data-lab-demo="streaming"]');
  });

  test('UIC-MARKDOWN-1.13 draws a large unbalanced input in time proportional to its length', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const demo = page.locator('[data-lab-demo="large-input"]');
    await demo.getByRole('button', { name: /^Load 96 KB/ }).click();
    const output = demo.locator('[data-lab-output="elapsed"]');
    await expect(output).toHaveText(/^\d+ characters in \d+ ms$/);
    const elapsed = Number(/in (\d+) ms/.exec((await output.textContent()) ?? '')?.[1]);
    expect(elapsed).toBeLessThan(2500);
    await expect(demo.getByRole('region', { name: 'Large input' })).toBeVisible();
    await lab.expectAccessible();
  });
});
