import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Code Block lab', () => {
  test('UIC-CODE-BLOCK-1.1 UIC-CODE-BLOCK-1.2 UIC-CODE-BLOCK-1.4 draws every variant with its header and highlighted code', async ({
    page,
    lab,
  }) => {
    await lab.open('code-block');
    const cell = (variant: string, content: string, actions: string) =>
      page.locator(
        `${cellSelector(`variant=${variant} content=${content} actions=${actions}`)} .ui-code-block`,
      );
    const code = cell('code', 'short', 'copy');
    await expect(code).toHaveAttribute('data-variant', 'code');
    await expect(code.locator('.ui-code-block__title')).toHaveText('ts');
    await expect(code.getByRole('button', { name: 'Copy code' })).toBeVisible();
    await expect(code.getByRole('button', { name: 'Apply' })).toHaveCount(0);
    await expect(
      cell('code', 'short', 'apply').getByRole('button', { name: 'Apply' }),
    ).toBeVisible();
    await expect(code.locator('.ui-code-block__token[data-token="keyword"]').first()).toHaveCSS(
      'font-weight',
      '600',
    );
    await expect(code.locator('.ui-code-block__code')).toHaveCSS('white-space', 'pre');
    const terminal = cell('terminal', 'short', 'copy');
    await expect(terminal).toHaveAccessibleName('sh');
    await expect(terminal).toHaveAttribute('data-variant', 'terminal');
    await expect(terminal.locator('.ui-code-block__line[data-kind="command"]')).toHaveCount(2);
    await expect(terminal.getByRole('button', { name: 'Copy commands' })).toBeVisible();
    const languages = page.locator('[data-lab-demo="languages"]');
    await expect(languages.locator('.ui-code-block__title')).toHaveText([
      'ts',
      'json',
      'count-nights.ts',
      'Code',
    ]);
    await lab.expectAccessible();
  });

  test('UIC-CODE-BLOCK-1.3 lets the keyboard reach and scroll overflowing code', async ({
    page,
    lab,
  }) => {
    await lab.open('code-block');
    const demo = page.locator('[data-lab-demo="long"]');
    const region = demo.locator('.ui-code-block__code');
    await expect(region).toHaveAttribute('data-overflowing', 'true');
    await demo.getByRole('button', { name: 'Copy code' }).focus();
    await page.keyboard.press('Tab');
    await expect(region).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await expect(async () => {
      expect(await region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }).toPass();
    const short = matrixCell(page, 'variant=code content=short actions=copy').locator('pre');
    await expect(short).not.toHaveAttribute('tabindex');
    await lab.expectAccessible('[data-lab-demo="long"]');
  });

  test('UIC-CODE-BLOCK-1.3 measures again when highlighting widens the same code', async ({
    page,
    lab,
  }) => {
    await lab.open('code-block');
    const demo = page.locator('[data-lab-demo="late-highlight"]');
    const region = demo.locator('.ui-code-block__code');
    const widths = () =>
      region.evaluate((element) => ({
        scroll: element.scrollWidth,
        client: element.clientWidth,
      }));
    expect((await widths()).scroll).toBeLessThanOrEqual((await widths()).client);
    await expect(region).not.toHaveAttribute('tabindex');
    await expect(region).not.toHaveAttribute('data-overflowing');

    const toggle = demo.getByRole('button', { name: 'Highlight' });
    await toggle.click();
    await expect(region).toHaveAttribute('data-overflowing', 'true');
    await expect(region).toHaveAttribute('tabindex', '0');
    const wide = await widths();
    expect(wide.scroll).toBeGreaterThan(wide.client);
    await demo.getByRole('button', { name: 'Copy code' }).focus();
    await page.keyboard.press('Tab');
    await expect(region).toBeFocused();

    await demo.getByRole('button', { name: 'Remove highlighting' }).click();
    await expect(region).not.toHaveAttribute('data-overflowing');
    await expect(region).not.toHaveAttribute('tabindex');

    // Highlighting applied outside React, as an asynchronous highlighter might, counts as well.
    await region.locator('code').evaluate((code) => {
      const token = document.createElement('span');
      token.className = 'ui-code-block__token';
      token.dataset.token = 'wide';
      token.textContent = code.textContent;
      code.replaceChildren(token);
    });
    await expect(region).toHaveAttribute('data-overflowing', 'true');
    await expect(region).toHaveAttribute('tabindex', '0');
  });

  test('UIC-CODE-BLOCK-2.1 UIC-CODE-BLOCK-3.1 copies code exactly and a terminal block’s commands', async ({
    page,
    lab,
    baseURL,
  }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL ?? 'http://127.0.0.1/').origin,
    });
    await lab.open('code-block');
    const languages = page.locator('[data-lab-demo="languages"]');
    const json = languages.getByRole('group', { name: 'json' });
    await json.getByRole('button', { name: 'Copy code' }).click();
    await expect(json.locator('.ui-copy-button')).toHaveAttribute('data-copied', 'true');
    await expect(json.getByRole('status')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '{ "city": "Lisbon", "nights": 3 }',
    );
    const terminal = page.locator('[data-lab-demo="terminal"]');
    await terminal.getByRole('button', { name: 'Copy commands' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'npm install trip-kit\nnpx trip-kit plan --to Porto',
    );
    const custom = terminal.getByRole('group', { name: 'PowerShell' });
    await expect(custom.locator('.ui-code-block__prompt')).toHaveText('PS> ');
    await expect(custom.locator('.ui-code-block__prompt')).toHaveCSS('user-select', 'none');
    await custom.getByRole('button', { name: 'Copy command' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Get-Date');
    await expect(terminal.getByRole('button', { name: 'Copy output' })).toBeVisible();
  });

  test('UIC-CODE-BLOCK-2.2 hands the value to Apply and its renamed action', async ({
    page,
    lab,
  }) => {
    await lab.open('code-block');
    const demo = page.locator('[data-lab-demo="apply"]');
    const output = demo.locator('[data-lab-output="applied"]');
    await demo
      .getByRole('group', { name: 'count-nights.ts' })
      .getByRole('button', { name: 'Apply' })
      .click();
    await expect(output).toHaveText('Applied 7 lines.');
    await demo.getByRole('button', { name: 'Run' }).press('Enter');
    await expect(output).toHaveText('Ran: npm test');
  });

  test('UIC-CODE-BLOCK-1.2 UIC-CODE-BLOCK-4.1 marks a query and draws a Markdown answer’s code', async ({
    page,
    lab,
  }) => {
    await lab.open('code-block');
    const find = page.locator('[data-lab-demo="find"]');
    await expect(find.locator('mark.ui-text-match')).toHaveCount(4);
    await page.getByRole('searchbox', { name: 'Find in code' }).fill('reduce');
    await expect(find.locator('mark.ui-text-match')).toHaveText(['reduce']);
    const markdown = page.locator('[data-lab-demo="markdown"]');
    await expect(markdown.locator('.ui-code-block')).toHaveCount(4);
    const unregistered = markdown.getByRole('group', { name: 'constructor' });
    await expect(unregistered).toContainText('new Plan()');
    await expect(unregistered.locator('.ui-code-block__token')).toHaveCount(0);
    await expect(markdown.getByRole('group', { name: 'console' })).toHaveAttribute(
      'data-variant',
      'terminal',
    );
    await expect(
      markdown.getByRole('group', { name: 'ts' }).locator('.ui-code-block__token'),
    ).not.toHaveCount(0);
    await markdown
      .getByRole('group', { name: 'ts' })
      .getByRole('button', { name: 'Insert' })
      .click();
    await expect(markdown.locator('[data-lab-output="inserted"]')).toHaveText(
      'Inserted ts: const days = countDays(plan.stops);',
    );
    await lab.expectAccessible('[data-lab-demo="markdown"]');
  });
});
