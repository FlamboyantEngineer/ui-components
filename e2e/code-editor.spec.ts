import type { Locator, Page } from '@playwright/test';
import { cellSelector, expect, familySelector, test } from './fixtures.js';

function cell(page: Page, wrap: string, state: string, size: string): Locator {
  return page.locator(
    `${familySelector('surface')} ${cellSelector(`wrap=${wrap} state=${state} size=${size}`)}`,
  );
}

function editor(page: Page, name: string): Locator {
  return page.locator(`${familySelector('surface')} [data-lab-editor="${name}"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
}

test.describe('Code Editor lab', () => {
  test('UIC-CODE-EDITOR-4.2 keeps completions while a controlled table cell updates', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const source = page.getByRole('textbox', { name: 'Cell expression', exact: true });
    await source.fill('');
    await source.pressSequentially('fru');
    await expect(source).toHaveValue('fru');
    await expect(source).toBeFocused();
    await expect(page.getByRole('option', { name: 'fruit.count', exact: true })).toBeVisible();
    await source.press('Tab');
    await expect(source).toHaveValue('fruit.count');
    await expect(source).toBeFocused();
  });

  test('UIC-CODE-EDITOR-7.2 UIC-CODE-EDITOR-7.3 replaces literal Unicode ranges without shifting source offsets', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const target = editor(page, 'boundaries');
    const input = target.getByRole('textbox', { name: 'Boundary source' });
    await input.press('Control+f');
    await target.getByRole('searchbox', { name: 'Find' }).fill('apple');
    await expect
      .poll(async () => (await target.locator('.ui-code-editor__match').allTextContents()).join(''))
      .toBe('appleAPPLE');
    await target.getByRole('textbox', { name: 'Replace with' }).fill('pear');
    await target.getByRole('button', { name: 'Replace all', exact: true }).click();
    await expect(input).toHaveValue('İ pear pear\n([})');
  });

  test('UIC-CODE-EDITOR-6.5 rejects a mismatched pair nested inside the bracket at the caret', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const target = editor(page, 'boundaries');
    const input = target.getByRole('textbox', { name: 'Boundary source' });
    await input.focus();
    await input.press('Control+End');
    await expect(target.locator('.ui-code-editor__bracket')).toHaveText([')']);
    await expect(target.locator('.ui-code-editor__bracket')).toHaveAttribute(
      'data-unmatched',
      'true',
    );
  });

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

  test('UIC-CODE-EDITOR-2.3 numbers an excerpt from its first line and marks the lines its diagnostics name', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const excerpt = editor(page, 'excerpt');
    const numbers = excerpt.locator('.ui-code-editor__line-number');
    await expect(numbers.first()).toHaveText('41');
    await expect(numbers.last()).toHaveText('45');
    await expect(excerpt.locator('.ui-code-editor__line[data-severity="warning"]')).toHaveCount(1);
    await expect(
      excerpt.locator(
        '.ui-code-editor__line[data-severity="warning"] .ui-code-editor__line-number',
      ),
    ).toHaveText('43');
    await expect(excerpt.locator('.ui-code-editor__mark')).toHaveText(['baskit']);
    await expect(excerpt.locator('.ui-code-editor__diagnostic')).toHaveText([
      '43:27 Unknown name "baskit".',
    ]);
    const input = excerpt.getByRole('textbox', { name: 'Excerpt' });
    await input.focus();
    await page.keyboard.press('F8');
    await expect(page.getByRole('tooltip')).toContainText('Unknown name "baskit".');
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
    await expect(
      page.locator(`${familySelector('surface')} [data-lab-output="completions"]`),
    ).toHaveText('let total = fruit.ripe');
    await page.keyboard.type(' and b');
    await expect(list.getByRole('option')).toHaveText([
      'basket The chosen basket',
      'fruit.bruised Whether any fruit is bruised',
    ]);
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(input).toHaveValue('let total = fruit.ripe and b');
  });

  test('UIC-CODE-EDITOR-6.1 UIC-CODE-EDITOR-6.2 UIC-CODE-EDITOR-6.3 UIC-CODE-EDITOR-6.4 UIC-CODE-EDITOR-6.5 edits with indentation, pairs and undo', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editing = editor(page, 'editing');
    const input = editing.getByRole('textbox', { name: 'Editable source' });
    const start = 'let basket = pick(fruit.ripe, "pears", "plums")\nif (fruit.count > 12) {\n';
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(`${start}  return basket\n  \n}`);
    await page.keyboard.press('Control+z');
    await expect(input).toHaveValue(`${start}  return basket\n}`);
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('pick(');
    await expect(input).toHaveValue(`${start}  return basket\n}\npick()`);
    await expect(editing.locator('.ui-code-editor__bracket')).toHaveText(['(', ')']);
    await page.keyboard.type('"a")');
    await expect(input).toHaveValue(`${start}  return basket\n}\npick("a")`);
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue(`${start}  return basket\n}\n    pick("a")`);
    await page.keyboard.press('Shift+Tab');
    await expect(input).toHaveValue(`${start}  return basket\n}\npick("a")`);
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(
      page.locator(`${familySelector('surface')} [data-lab-after="editing"]`),
    ).toBeFocused();
  });

  test('UIC-CODE-EDITOR-4.6 UIC-CODE-EDITOR-4.7 UIC-CODE-EDITOR-4.8 completes from a source with kinds, documentation and snippets', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editing = editor(page, 'editing');
    const input = editing.getByRole('textbox', { name: 'Editable source' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('let n = fruit.');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(4);
    await expect(list.getByRole('option').first()).toHaveAttribute('data-kind', 'property');
    const documentation = page.locator('.ui-completion-list__documentation');
    await expect(documentation).toHaveText(/How many fruit are in the basket/);
    await expect(list.getByRole('option').first()).toHaveAccessibleDescription(/How many fruit/);
    await page.keyboard.type('we');
    await expect(list.getByRole('option')).toHaveText(['weigh weigh(unit)']);
    await page.keyboard.press('Enter');
    await page.keyboard.type('kg');
    await expect(input).toHaveValue(/\nlet n = fruit\.weigh\(kg\)$/);
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Control+Space');
    await expect(list.getByRole('option')).toHaveCount(4);
    await page.keyboard.type('pi');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(/\npick\(test, yes, no\)$/);
    await page.keyboard.type('ripe');
    await page.keyboard.press('Tab');
    await page.keyboard.type('1');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2');
    await expect(input).toHaveValue(/\npick\(ripe, 1, 2\)$/);
    await lab.expectAccessible();
  });

  test('UIC-CODE-EDITOR-4.8 ends snippet stepping after an undo and on Escape then Tab', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const input = editor(page, 'editing').getByRole('textbox', { name: 'Editable source' });
    const selection = () =>
      input.evaluate((area: HTMLTextAreaElement) =>
        area.value.slice(area.selectionStart, area.selectionEnd),
      );
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Control+Space');
    await page.keyboard.type('pi');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(/\npick\(test, yes, no\)$/);
    await page.keyboard.press('Control+z');
    await expect(input).not.toHaveValue(/pick\(test/);
    // Tab indents the restored line instead of selecting a field of the undone snippet.
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue(/\n {4}pi$/);
    expect(await selection()).toBe('    pi');
    await page.keyboard.press('End');
    await page.keyboard.press('Control+Space');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(/pick\(test, yes, no\)$/);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(input).not.toBeFocused();
  });

  test('UIC-CODE-EDITOR-7.1 UIC-CODE-EDITOR-7.2 UIC-CODE-EDITOR-7.3 UIC-CODE-EDITOR-7.4 finds and replaces in the source', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editing = editor(page, 'editing');
    const input = editing.getByRole('textbox', { name: 'Editable source' });
    await input.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Control+f');
    const find = editing.getByRole('searchbox', { name: 'Find' });
    await expect(find).toBeFocused();
    await expect(editing.locator('.ui-code-editor__search')).toHaveClass(/ui-find-bar/);
    await page.keyboard.type('BASKET');
    const status = editing.locator('.ui-find-bar__status');
    await expect(status).toHaveText('1 of 2');
    await expect(editing.locator('.ui-code-editor__match')).toHaveCount(2);
    await expect(editing.locator('.ui-code-editor__match[data-current]')).toHaveCSS(
      'outline-style',
      'solid',
    );
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('2 of 2');
    await lab.expectAccessible();
    await editing.getByRole('textbox', { name: 'Replace with' }).fill('crate');
    await editing.getByRole('button', { name: 'Replace all' }).click();
    await expect(input).toHaveValue(/^let crate = [^]*return crate\n\}$/);
    await expect(status).toHaveText('No results');
    await find.press('Escape');
    await expect(editing.locator('.ui-code-editor__search')).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test('UIC-CODE-EDITOR-6.1 UIC-CODE-EDITOR-7.4 undoes and redoes replacements made from the search bar', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editing = editor(page, 'editing');
    const input = editing.getByRole('textbox', { name: 'Editable source' });
    const original = await input.inputValue();
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' // ok');
    const typed = `${original} // ok`;
    await expect(input).toHaveValue(typed);

    await page.keyboard.press('Control+f');
    const find = editing.getByRole('searchbox', { name: 'Find' });
    await page.keyboard.type('basket');
    await editing.getByRole('textbox', { name: 'Replace with' }).fill('crate');
    const replace = editing.getByRole('button', { name: 'Replace', exact: true });
    await replace.click();
    const once = typed.replace('basket', 'crate');
    await expect(input).toHaveValue(once);
    await expect(replace).toBeFocused();
    const replaceAll = editing.getByRole('button', { name: 'Replace all' });
    await replaceAll.click();
    const all = typed.replaceAll('basket', 'crate');
    await expect(input).toHaveValue(all);
    // Nothing is left to replace, so the disabled buttons hand focus to the find box.
    await expect(replaceAll).toBeDisabled();
    await expect(find).toBeFocused();
    await expect(find).toHaveValue('basket');

    await find.press('Escape');
    await expect(input).toBeFocused();
    await page.keyboard.press('Control+z');
    await expect(input).toHaveValue(once);
    await page.keyboard.press('Control+z');
    await expect(input).toHaveValue(typed);
    await page.keyboard.press('Control+Shift+z');
    await expect(input).toHaveValue(once);
    await page.keyboard.press('Control+Shift+z');
    await expect(input).toHaveValue(all);
  });

  test('UIC-CODE-EDITOR-3.4 UIC-CODE-EDITOR-3.5 UIC-CODE-EDITOR-3.6 underlines problems with hover tips and F8', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const problems = editor(page, 'problems');
    const input = problems.getByRole('textbox', { name: 'Source with problems' });
    const marks = problems.locator('.ui-code-editor__mark');
    await expect(marks).toHaveText(['"apples"', 'baskit']);
    await problems.scrollIntoViewIfNeeded();
    await expect(marks.nth(1)).toHaveCSS('text-decoration-style', 'wavy');
    const mark = await box(marks.nth(1));
    await page.mouse.move(mark.x + mark.width / 2, mark.y + mark.height / 2);
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('Unknown name "baskit". Did you mean "basket"?');
    const popover = await box(page.locator('.ui-code-editor__tooltip'));
    expect(popover.y + popover.height).toBeLessThanOrEqual(mark.y + 1);
    await lab.expectAccessible();
    const word = await box(problems.locator('.ui-code-editor__token', { hasText: /^basket$/ }));
    await page.mouse.move(word.x + 4, word.y + word.height / 2);
    await expect(tip).toHaveText('basket: the chosen basket, a text.');
    await page.mouse.move(0, 0);
    await expect(tip).toBeHidden();
    await input.click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('F8');
    await expect(problems.locator('.ui-code-editor__announcement')).toHaveText(
      'A text is always true.',
    );
    await expect(tip).toHaveText('A text is always true.');
    const selected = await input.evaluate((element: HTMLTextAreaElement) =>
      element.value.slice(element.selectionStart, element.selectionEnd),
    );
    expect(selected).toBe('"apples"');
    await page.keyboard.press('F8');
    await expect(tip).toHaveText(/Unknown name "baskit"/);
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    await page.keyboard.type('x');
    await expect(problems.locator('.ui-code-editor__mark')).toHaveCount(0);
  });

  test('UIC-CODE-EDITOR-1.1 submits the source with its form under its name', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const form = page.locator(`${familySelector('surface')} [data-lab-demo="form"]`);
    const source = form.getByRole('textbox', { name: 'Query source' });
    await source.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' // ok');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.locator('[data-lab-output="form"]')).toHaveText(
      'Submitted: let basket = pick(fruit.ripe) // ok',
    );
  });

  test('UIC-CODE-EDITOR-6.3 leaves the editor backwards with Shift+Tab right after Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const source = editor(page, 'editing').getByRole('textbox');
    await source.focus();
    const before = await source.inputValue();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Shift+Tab');
    await expect(source).not.toBeFocused();
    await expect(source).toHaveValue(before);
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
  test('UIC-CODE-EDITOR-10.1 keeps the host toolbar as locking and the language drop Format', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const demo = page.locator('[data-lab-editor="lockable"]');
    const count = demo.getByRole('button', { name: /^Count/ });
    await count.click();
    await expect(count).toHaveText('Count 1');
    const element = await count.elementHandle();
    await demo.getByRole('checkbox', { name: 'Lock' }).check();
    await expect(demo.getByRole('button', { name: 'Format' })).toHaveCount(0);
    await demo.getByRole('checkbox', { name: 'Lock' }).uncheck();
    await expect(demo.getByRole('button', { name: 'Format' })).toBeVisible();
    await demo.getByRole('checkbox', { name: 'JSON' }).uncheck();
    await expect(demo.getByRole('button', { name: 'Format' })).toHaveCount(0);
    expect(await element?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(count).toHaveText('Count 1');
  });

  test('UIC-CODE-EDITOR-6.3 indents a blank first line from the very start of the text', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const input = editor(page, 'blank-first').getByRole('textbox', { name: 'Blank first line' });
    await input.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('  \nreturn basket');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('  \n  \nreturn basket');
  });

  test('UIC-CODE-EDITOR-4.8 completes text an input method composed, once', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const input = editor(page, 'editing').getByRole('textbox', { name: 'Editable source' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    const session = await page.context().newCDPSession(page);
    await session.send('Input.imeSetComposition', {
      text: 'pi',
      selectionStart: 2,
      selectionEnd: 2,
    });
    await session.send('Input.insertText', { text: 'pi' });
    await expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(/\npick\(test, yes, no\)$/);
  });
});
