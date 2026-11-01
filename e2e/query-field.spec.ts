import { expect, test, matrixCell } from './fixtures.js';

test.describe('Query Field lab', () => {
  test('UIC-QUERY-FIELD-1.1 UIC-QUERY-FIELD-1.3 UIC-QUERY-FIELD-1.5 UIC-CODE-EDITOR-1.7 draws one-line queries in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const cells = page.locator('table[data-lab-matrix="state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(5);
    const valid = page.getByRole('textbox', { name: 'Query, valid' });
    await expect(valid).toHaveAttribute('aria-multiline', 'false');
    const box = await valid.boundingBox();
    expect(box?.height).toBeLessThan(40);
    const invalid = matrixCell(page, 'state=invalid').locator('.ui-query-field');
    await expect(invalid).toHaveAttribute('data-invalid', 'true');
    await expect(invalid.locator('.ui-code-editor__diagnostic')).toHaveCount(2);
    await expect(invalid.getByRole('button', { name: 'Run query' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Query, disabled' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Query, read-only' })).toHaveAttribute(
      'readonly',
    );
    await lab.expectAccessible();
  });

  test('UIC-QUERY-FIELD-1.2 UIC-QUERY-FIELD-1.4 UIC-CODE-EDITOR-1.7 completes values and submits on Enter', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const demo = page.locator('[data-lab-demo="submit"]');
    const input = demo.getByRole('textbox', { name: 'Search books' });
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-submitted] li')).toHaveCount(0);
    await page.keyboard.type('tr');
    const list = page.getByRole('listbox');
    await expect(list.getByRole('option', { name: /travel/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('genre:travel');
    await expect(list).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-submitted] li')).toHaveText(['genre:travel']);
    await expect(input).toHaveValue('genre:travel');
    await page.keyboard.type(' OR genre:cooking');
    await page.keyboard.press('Escape');
    await demo.getByRole('button', { name: 'Run query' }).click();
    await expect(demo.locator('[data-lab-submitted] li')).toHaveText([
      'genre:travel',
      'genre:travel OR genre:cooking',
    ]);
  });

  test('UIC-QUERY-FIELD-1.3 leaves composing and the candidate-confirming Enter to the input method', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const demo = page.locator('[data-lab-demo="submit"]');
    const input = demo.getByRole('textbox', { name: 'Search books' });
    await input.click();
    await page.keyboard.press('End');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.imeSetComposition', { text: 'é', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.insertText', { text: 'é' });
    // Chromium reports the Enter that confirms a candidate with key code 229.
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 229,
    });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' });
    await expect(input).toHaveValue(/é$/);
    await expect(demo.locator('[data-lab-submitted] li')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-submitted] li')).toHaveCount(1);
  });
});

test.describe('Query Field suggestions', () => {
  test('UIC-COMPLETION-LIST-1.2 UIC-QUERY-FIELD-1.2 sizes suggestions to their content and tints each kind', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const input = page.getByRole('textbox', { name: 'Query, short suggestions' });
    await input.click();
    await page.keyboard.type('n');
    const list = page.locator('.ui-completion-list');
    const keyword = list.getByRole('option', { name: /NOT/ });
    await expect(keyword).toBeVisible();
    const tag = (option: typeof keyword) =>
      option.evaluate((node) => {
        const style = getComputedStyle(node, '::before');
        return { color: style.color, width: parseFloat(style.width) };
      });
    const geometry = (option: typeof keyword) =>
      option.evaluate((node) => {
        const label = node.querySelector('.ui-completion-list__label');
        return (label?.getBoundingClientRect().left ?? 0) - node.getBoundingClientRect().left;
      });
    // The kind is a tag only as wide as its word, not a fixed column.
    const keywordTag = await tag(keyword);
    expect(keywordTag.width).toBeLessThan(56);
    expect(await geometry(keyword)).toBeLessThan(64);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('g');
    const field = list.getByRole('option', { name: /genre/ });
    await expect(field).toBeVisible();
    const box = await list.boundingBox();
    expect(box?.width).toBeLessThan(200);
    expect((await tag(field)).color).not.toBe(keywordTag.color);
    await page.keyboard.press('Escape');

    // Long names wrap inside the viewport-bound list while long descriptions truncate.
    const long = page.getByRole('textbox', { name: 'Query, long suggestions' });
    await long.click();
    await page.keyboard.type('t');
    const described = list.getByRole('option', { name: /first-publication/ });
    await expect(described).toBeVisible();
    const longBox = await list.boundingBox();
    expect(longBox?.width).toBeLessThanOrEqual(420);
    const truncated = await described
      .locator('.ui-completion-list__description')
      .evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(truncated).toBe(true);
    await lab.expectAccessible();
  });

  test('UIC-COMPLETION-LIST-1.2 keeps no kind column for options without kinds', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    await page.locator('[data-lab-editor="labels-none"]').focus();
    const option = page.getByRole('option', { name: 'Lisbon' });
    await expect(option).toBeVisible();
    const inset = await option.evaluate((node) => {
      const label = node.querySelector('.ui-completion-list__label');
      return (label?.getBoundingClientRect().left ?? 0) - node.getBoundingClientRect().left;
    });
    expect(inset).toBeLessThanOrEqual(8);
  });
});
