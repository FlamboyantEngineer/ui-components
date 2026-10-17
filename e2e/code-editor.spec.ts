import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, wrap: string, state: string, size: string): Locator {
  return page.locator(`[data-lab-cell="wrap=${wrap} state=${state} size=${size}"]`);
}

function editor(page: Page, name: string): Locator {
  return page.locator(`[data-lab-editor="${name}"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
}

test.describe('Code Editor lab', () => {
  test('UIC-CODE-EDITOR-1.1 UIC-CODE-EDITOR-1.2 lays the transparent text area exactly over the highlighted copy', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const target = cell(page, 'soft', 'resting', 'md');
    const input = target.getByRole('textbox', { name: 'Source' });
    const highlight = target.locator('.ui-code-editor__highlight');
    expect(await box(input)).toEqual(await box(highlight));
    await expect(input).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    const keyword = target.locator('.ui-code-editor__token[data-token="keyword"]').first();
    await expect(keyword).toHaveText('let');
    await expect(keyword).toHaveCSS('color', 'rgb(9, 105, 218)');
    await input.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.type('let ');
    await expect(highlight).toContainText('let // Pick a basket');
    const first = target.locator('.ui-code-editor__token').first();
    await expect(first).toHaveText('let');
    await lab.expectAccessible();
  });

  test('UIC-CODE-EDITOR-1.3 keeps the gutter and the highlighting at the input scroll offset', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const long = editor(page, 'long');
    const input = long.getByRole('textbox', { name: 'Long source' });
    await input.evaluate((element) => {
      element.scrollTop = 240;
      element.scrollLeft = 30;
    });
    const highlight = long.locator('.ui-code-editor__highlight');
    await expect.poll(() => highlight.evaluate((element) => element.scrollTop)).toBe(240);
    expect(await highlight.evaluate((element) => element.scrollLeft)).toBe(30);
    const gutter = long.locator('.ui-code-editor__gutter');
    expect(await gutter.evaluate((element) => element.scrollTop)).toBe(240);
    const row = long.locator('.ui-code-editor__line').nth(14);
    const line = await box(row);
    const surface = await box(long.locator('.ui-code-editor__surface'));
    expect(line.y).toBeGreaterThanOrEqual(surface.y);
  });

  test('UIC-CODE-EDITOR-1.4 sets the starting height by size and scrolls long lines only without wrapping', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const heights = [];
    for (const size of ['sm', 'md', 'lg']) {
      heights.push(
        (await box(cell(page, 'soft', 'resting', size).locator('.ui-code-editor__surface'))).height,
      );
    }
    expect(heights).toEqual([120, 180, 280]);
    const overflow = (wrap: string) =>
      cell(page, wrap, 'resting', 'md')
        .getByRole('textbox')
        .evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(await overflow('soft')).toBe(false);
    expect(await overflow('off')).toBe(true);
  });

  test('UIC-CODE-EDITOR-2.1 UIC-CODE-EDITOR-2.2 numbers lines and keeps one number for a wrapped line', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const toolbar = editor(page, 'toolbar');
    const input = toolbar.getByRole('textbox', { name: 'Sample source' });
    const gutter = toolbar.locator('.ui-code-editor__gutter');
    const width = await input.evaluate((element) => element.clientWidth);
    await expect(gutter).toHaveCSS('--ui-code-editor-text-width', `${width}px`);
    await expect(toolbar.locator('.ui-code-editor__line-number')).toHaveText(['1', '2', '3', '4']);
    const wrapped = toolbar.locator('.ui-code-editor__line').nth(3);
    expect((await box(wrapped)).height).toBeGreaterThanOrEqual(36);
    const fourthToken = toolbar.locator('.ui-code-editor__token', { hasText: 'orchard' });
    const tokenBottom = (await box(fourthToken)).y + (await box(fourthToken)).height;
    const rowBottom = (await box(wrapped)).y + (await box(wrapped)).height;
    expect(Math.abs(tokenBottom - rowBottom)).toBeLessThanOrEqual(3);
    await toolbar.getByRole('button', { name: 'Wrap' }).click();
    await expect(toolbar).toHaveAttribute('data-wrap', 'off');
    await expect.poll(async () => (await box(wrapped)).height).toBe(18);
    await expect(toolbar.locator('[data-lab-output="lines"]')).toHaveText('4 lines');
  });

  test('UIC-CODE-EDITOR-3.1 UIC-CODE-EDITOR-3.2 lists live diagnostics and clears them when fixed', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const checked = editor(page, 'diagnostics');
    const input = checked.getByRole('textbox', { name: 'Checked source' });
    await expect(checked).toHaveAttribute('data-invalid', 'true');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(checked.locator('.ui-code-editor__diagnostic')).toHaveText(['1:13 Unclosed "(".']);
    await expect(checked.locator('.ui-code-editor__diagnostic')).toHaveCSS(
      'color',
      'rgb(207, 34, 46)',
    );
    await expect(checked.locator('.ui-code-editor__line').first()).toHaveAttribute(
      'data-severity',
      'error',
    );
    await expect(input).toHaveAccessibleDescription('1:13 Unclosed "(".');
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(')');
    await expect(checked.locator('.ui-code-editor__diagnostic')).toHaveCount(0);
    await expect(checked).not.toHaveAttribute('data-invalid');
    await expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('UIC-CODE-EDITOR-4.2 UIC-CODE-EDITOR-4.3 UIC-CODE-EDITOR-4.4 UIC-CODE-EDITOR-4.5 completes the word at the caret', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const completing = editor(page, 'completions');
    const input = completing.getByRole('textbox', { name: 'Source with completions' });
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.type('fruit.');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('option')).toHaveCount(3);
    await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    const caret = await box(completing.locator('.ui-code-editor__caret'));
    const popover = await box(page.locator('.ui-code-editor__popover'));
    expect(popover.y).toBeGreaterThanOrEqual(caret.y + caret.height);
    expect(popover.y - (caret.y + caret.height)).toBeLessThan(8);
    expect(Math.abs(popover.x - caret.x)).toBeLessThan(12);
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('option', { selected: true })).toContainText('fruit.ripe');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(input).toBeFocused();
    await expect(page.locator('[data-lab-output="completions"]')).toHaveText(
      'let total = fruit.ripe',
    );
    await page.keyboard.type(' and b');
    await expect(list.getByRole('option')).toHaveText(['basketThe chosen basket']);
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(input).toHaveValue('let total = fruit.ripe and b');
  });

  test('UIC-CODE-EDITOR-1.1 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('code-editor', { theme: 'dark' });
    await editor(page, 'completions').getByRole('textbox').click();
    await page.keyboard.press('End');
    await page.keyboard.type('fruit.');
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible();
    await lab.expectAccessible('.ui-code-editor__popover');
  });
});
