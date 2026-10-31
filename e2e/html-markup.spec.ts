import { expect, test } from './fixtures.js';

test.describe('HTML Markup lab', () => {
  test('UIC-HTML-MARKUP-2.1 UIC-HTML-MARKUP-3.1 renders content with its semantics', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const rich = page.locator('[data-lab-cell="content=rich text text=body"] .ui-html-markup');
    await expect(rich.getByRole('heading', { level: 3 })).toHaveText('Harvest update');
    await expect(rich.locator('strong')).toHaveText('north');
    await expect(rich).toContainText('store at 4\u00a0°C — see');
    const table = page
      .locator('[data-lab-cell="content=table text=body"]')
      .getByRole('table', { name: 'Crates this week' });
    await expect(table.getByRole('columnheader')).toHaveText(['Fruit', 'Crates']);
    const lists = page.locator('[data-lab-cell="content=lists text=body"] .ui-html-markup');
    await expect(lists.locator('ol')).toHaveAttribute('start', '3');
    await expect(lists.locator('ul ul li')).toHaveText(['Bramley', 'Cox']);
    await lists.getByText('Storage notes').click();
    await expect(lists.getByText('Keep pears apart from apples.')).toBeVisible();
    await expect(page.locator('[data-lab-cell="content=code text=body"] pre')).toHaveCSS(
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
    const textOnly = page.locator('[data-lab-cell="policy=text only"] .ui-html-markup');
    await expect(textOnly.locator('h3, strong, a, blockquote')).toHaveCount(0);
    await expect(textOnly).toContainText('Harvest update');
    await expect(
      page.locator('[data-lab-cell="policy=default"] .ui-html-markup').getByRole('link'),
    ).toHaveText('the storage guide');
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
    const table = page
      .locator('[data-lab-cell="content=table shorthand text=body"]')
      .getByRole('table', { name: 'Crates by hand' });
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
});
