import { expect, matrixCell, test } from './fixtures.js';

test.describe('HTML Markup lab', () => {
  test('UIC-HTML-MARKUP-2.1 UIC-HTML-MARKUP-3.1 renders content with its semantics', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const rich = matrixCell(page, 'content=rich text text=body').locator('.ui-html-markup');
    await expect(rich.getByRole('heading', { level: 3 })).toHaveText('Harvest update');
    await expect(rich.locator('strong')).toHaveText('north');
    await expect(rich).toContainText('store at 4\u00a0°C — see');
    const table = matrixCell(page, 'content=table text=body').getByRole('table', {
      name: 'Crates this week',
    });
    await expect(table.getByRole('columnheader')).toHaveText(['Fruit', 'Crates']);
    const lists = matrixCell(page, 'content=lists text=body').locator('.ui-html-markup');
    await expect(lists.locator('ol')).toHaveAttribute('start', '3');
    await expect(lists.locator('ul ul li')).toHaveText(['Bramley', 'Cox']);
    await lists.getByText('Storage notes').click();
    await expect(lists.getByText('Keep pears apart from apples.')).toBeVisible();
    await expect(matrixCell(page, 'content=code text=body').locator('pre')).toHaveCSS(
      'font-family',
      /monospace/,
    );
    await lab.expectAccessible();
  });

  test('UIC-HTML-MARKUP-1.3 UIC-HTML-MARKUP-1.4 UIC-HTML-MARKUP-1.5 UIC-HTML-MARKUP-2.2 drops unsafe content', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const unsafe = page.locator('[data-lab-unsafe]');
    await expect(unsafe.locator('script, style, iframe, form, input, section')).toHaveCount(0);
    const first = unsafe.locator('p').first();
    await expect(first).not.toHaveAttribute('style');
    await expect(first).not.toHaveAttribute('onclick');
    await first.click();
    expect(await page.evaluate(() => (window as { unsafe?: boolean }).unsafe)).toBeUndefined();
    await expect(unsafe.getByText('A script link')).not.toHaveAttribute('href');
    const newTab = unsafe.getByRole('link', { name: 'a new tab' });
    await expect(newTab).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(unsafe.locator('img')).not.toHaveAttribute('src');
    await expect(
      unsafe.getByText('Unknown elements and hook classes are unwrapped.'),
    ).not.toHaveClass(/ui-button/);
    await expect(unsafe).toContainText('Send');
  });

  test('UIC-HTML-MARKUP-2.5 follows its policy', async ({ page, lab }) => {
    await lab.open('html-markup');
    const textOnly = matrixCell(page, 'policy=text only').locator('.ui-html-markup');
    await expect(textOnly.locator('h3, strong, a, blockquote')).toHaveCount(0);
    await expect(textOnly).toContainText('Harvest update');
    await expect(
      matrixCell(page, 'policy=default').locator('.ui-html-markup').getByRole('link'),
    ).toHaveText('the storage guide');
  });

  test('UIC-HTML-MARKUP-2.1 loads images lazily without sending the page as referrer', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const image = page.locator('[data-lab-images]').getByRole('img', { name: 'A pear' });
    await expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
  });

  test('UIC-HTML-MARKUP-2.3 UIC-HTML-MARKUP-2.4 replaces elements and marks the find query', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const overrides = page.locator('[data-lab-overrides]');
    await expect(overrides.locator('.ui-badge')).toHaveText(['@Ana', '@Ben']);
    const find = page.locator('[data-lab-find]');
    await expect(find.locator('mark.ui-text-match')).toHaveText(['orchard']);
    await page.getByRole('searchbox', { name: 'Find in update' }).fill('the');
    await expect(find.locator('mark.ui-text-match')).toHaveText(['The', 'the', 'the']);
    await lab.expectAccessible();
  });

  test('UIC-MARKUP-1.5 draws a large unbalanced input in time proportional to its length', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const demo = page.locator('[data-lab-demo="large-input"]');
    await demo.getByRole('button', { name: /^Load 96 KB/ }).click();
    const output = demo.locator('[data-lab-output="elapsed"]');
    await expect(output).toHaveText(/^\d+ characters in \d+ ms$/);
    const elapsed = Number(/in (\d+) ms/.exec((await output.textContent()) ?? '')?.[1]);
    expect(elapsed).toBeLessThan(2500);
    await expect(demo.getByRole('region', { name: 'Large input' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-HTML-MARKUP-1.3 unwraps names an ordinary object inherits', async ({ page, lab }) => {
    await lab.open('html-markup');
    await expect(page.locator('[data-lab-unknown]')).toHaveText('Kept in place');
  });

  test('UIC-HTML-MARKUP-1.2 completes table shorthand with the groups a parser implies', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const table = matrixCell(page, 'content=table shorthand text=body').getByRole('table', {
      name: 'Crates by hand',
    });
    await expect(table.locator(':scope > colgroup > col')).toHaveCount(2);
    await expect(table.locator(':scope > tbody > tr')).toHaveCount(2);
    await expect(table.getByRole('cell', { name: 'Quince' })).toBeVisible();
  });

  test('UIC-MARKUP-1.3 decodes every named character reference as a browser does', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    await expect(page.locator('[data-lab-references]')).toHaveText(
      'Café ö α ≤ ⪢̸ © 2026 &EACUTE; &constructor;',
    );
  });

  test('UIC-MARKUP-1.6 draws deep nesting without overflowing the stack', async ({ page, lab }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await lab.open('html-markup');
    const demo = page.locator('[data-lab-demo="deep-nesting"]');
    await demo.getByRole('button', { name: 'Load 5,000 nested elements' }).click();
    const region = demo.getByRole('region', { name: 'Large input' });
    await expect(region).toContainText('Deepest');
    const depth = await region.evaluate((root) => {
      let deepest = 0;
      const pending: Array<[Element, number]> = [[root, 0]];
      for (let next = pending.pop(); next; next = pending.pop()) {
        deepest = Math.max(deepest, next[1]);
        for (const child of next[0].children) pending.push([child, next[1] + 1]);
      }
      return deepest;
    });
    expect(depth).toBeLessThanOrEqual(260);
    expect(errors).toEqual([]);
  });

  test('UIC-HTML-MARKUP-1.2 draws misnested structure that the browser parses back the same', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const root = page.locator('[data-lab-misnested]');
    await expect(root.getByRole('listitem')).toHaveText(['PearsPlumsFigs']);
    const reparsed = await root.evaluate((element) => {
      const copy = element.ownerDocument.createElement('div');
      copy.innerHTML = element.innerHTML;
      return copy.innerHTML === element.innerHTML;
    });
    expect(reparsed).toBe(true);
    await lab.expectAccessible('[data-lab-misnested]');
  });

  test('UIC-HTML-MARKUP-1.2 UIC-HTML-MARKUP-1.3 UIC-HTML-MARKUP-2.1 preserves structure after removing scope boundaries', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const scope = page.locator('[data-lab-removed-scope]');
    await expect(scope.locator('p')).toHaveText(['BeforeInsidekeptAfter', 'EarlyHarvestLate']);
    await expect(scope.locator('strong')).toHaveText('kept');
    await expect(scope.locator('button, div, table, tbody, tr, td')).toHaveCount(0);
    const list = page.locator('[data-lab-removed-list]');
    await expect(list.getByRole('listitem')).toHaveText(['PearsPlumsFigs']);
    await expect(list.locator('ol')).toHaveCount(0);
    await expect(list.locator('em')).toHaveText('Plums');
    for (const output of [scope, list]) {
      expect(
        await output.evaluate((element) => {
          const copy = element.ownerDocument.createElement('div');
          copy.innerHTML = element.innerHTML;
          return copy.innerHTML === element.innerHTML;
        }),
      ).toBe(true);
    }
    await lab.expectAccessible('[data-lab-removed-scope]');
    await lab.expectAccessible('[data-lab-removed-list]');
  });
});
