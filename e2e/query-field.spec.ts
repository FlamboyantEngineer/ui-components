import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

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
    expect(box?.width).toBeLessThan(280);
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

test.describe('Query Field Tab and suggestions', () => {
  test('UIC-COMPLETION-LIST-2.8 UIC-QUERY-FIELD-1.2 shows hidden suggestions on the first Tab and inserts on the next', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const input = page.getByRole('textbox', { name: 'Query, empty' });
    const list = page.locator('.ui-completion-list');
    await input.click();
    await page.keyboard.type('reader');
    // A label equal to the typed word is left out, so `reader` alone shows no list.
    await expect(list).toHaveCount(0);
    await page.keyboard.type(':');
    await expect(list.getByRole('option', { name: /maria/ })).toBeVisible();
    await expect(input).toHaveValue('reader:');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(input).toHaveValue('reader:');

    // Dismissed: the first Tab shows the list again, the second inserts its active value.
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('reader:');
    await expect(list.getByRole('option', { name: /maria/ })).toBeVisible();
    await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('reader:jon');
    await expect(list).toHaveCount(0);

    // Nothing completes the text now: Tab moves on to the run button, as Shift+Tab moves back.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Run query' }).first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('reader:jon');
  });

  test('UIC-COMPLETION-LIST-2.8 waits for a slow answer on Tab, drops it on Escape and leaves an empty source to focus', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const list = page.locator('.ui-completion-list');
    const slow = page.getByRole('textbox', { name: 'Query, slow suggestions' });
    await slow.click();
    await page.keyboard.type('reader:');
    await page.keyboard.press('Tab');
    await expect(slow).toBeFocused();
    await expect(slow).toHaveValue('reader:');
    await expect(list.getByRole('option', { name: /maria/ })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(slow).toHaveValue('reader:maria');

    // Escape drops the answer on its way: the list never opens for it.
    await page.keyboard.type(' g');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    await expect(list).toHaveCount(0);
    await expect(slow).toHaveValue('reader:maria g');

    const empty = page.getByRole('textbox', { name: 'Query, no matches suggestions' });
    await empty.click();
    await page.keyboard.type('genre');
    await page.keyboard.press('Tab');
    await expect(empty).not.toBeFocused();
    await expect(empty).toHaveValue('genre');
    await expect(list).toHaveCount(0);
  });
});

test.describe('Query Field suggestion alignment', () => {
  /** Each option's label and description baselines and the label's offsets from the option. */
  const measureOptions = (list: Locator) =>
    list.locator('[role="option"]').evaluateAll((options) =>
      options.map((option) => {
        /** Where text in `element` sits: a zero-height inline block rests on its first baseline. */
        const baseline = (element: Element | null) => {
          if (!element) return null;
          const probe = document.createElement('span');
          probe.style.display = 'inline-block';
          element.prepend(probe);
          const bottom = probe.getBoundingClientRect().bottom;
          probe.remove();
          return bottom;
        };
        const label = option.querySelector('.ui-completion-list__label');
        const box = option.getBoundingClientRect();
        const labelBox = label?.getBoundingClientRect();
        const lineHeight = label ? parseFloat(getComputedStyle(label).lineHeight) : 0;
        return {
          name: option.textContent,
          label: baseline(label),
          description: baseline(option.querySelector('.ui-completion-list__description')),
          above: (labelBox?.top ?? 0) - box.top,
          below: box.bottom - (labelBox?.bottom ?? 0),
          lines: Math.round((labelBox?.height ?? 0) / lineHeight),
          labelStart: labelBox?.left ?? 0,
          labelEnd: labelBox?.right ?? 0,
          optionStart: box.left,
          optionEnd: box.right,
        };
      }),
    );

  for (const direction of ['ltr', 'rtl'] as const) {
    test(`UIC-COMPLETION-LIST-1.2 lines up kind tags, labels and descriptions on the first line (${direction})`, async ({
      page,
      lab,
    }) => {
      await lab.open('query-field');
      const name = direction === 'ltr' ? 'Query, mixed suggestions' : 'Query, right to left';
      await page.getByRole('textbox', { name }).click();
      await page.keyboard.type('g');
      const list = page.locator('.ui-completion-list');
      await expect(list.getByRole('option')).toHaveCount(6);
      const options = await measureOptions(list);
      for (const option of options) {
        // The smaller description text shares the label's first baseline.
        if (option.description !== null) {
          expect(
            Math.abs(option.description - (option.label ?? 0)),
            option.name ?? '',
          ).toBeLessThan(1.5);
        }
        // A single line sits in the middle of its row.
        if (option.lines === 1) {
          expect(Math.abs(option.above - option.below), option.name ?? '').toBeLessThan(2);
        }
      }
      // The long label wraps rather than squeezing to a column of letters.
      const wrapped = options.find((option) => option.lines > 1);
      expect(wrapped?.labelEnd ?? 0).toBeGreaterThan((wrapped?.labelStart ?? 0) + 120);
      // Every label starts in the same column, after the kind tags.
      const starts = options.map((option) =>
        direction === 'ltr'
          ? option.labelStart - option.optionStart
          : option.optionEnd - option.labelEnd,
      );
      expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(1);
      expect(Math.min(...starts)).toBeGreaterThan(40);
      await lab.expectAccessible();
    });
  }
});
