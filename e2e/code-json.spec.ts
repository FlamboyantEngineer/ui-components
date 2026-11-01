import type { Locator, Page } from '@playwright/test';
import { cellSelector, expect, familySelector, test } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(
    `${familySelector('json')} ${cellSelector(`state=${state} layout=${layout}`)}`,
  );
}

function saved(page: Page): Locator {
  return page.locator(`${familySelector('json')} [data-lab-editor="saved"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
}

test.describe('Code Editor JSON mode lab', () => {
  test('UIC-CODE-EDITOR-8.1 UIC-CODE-EDITOR-8.2 labels a numbered, highlighted code editor', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const resting = cell(page, 'resting', 'label-control');
    const label = await box(resting.locator('.ui-field__label'));
    const input = resting.getByRole('textbox', { name: 'Basket' });
    expect(label.y + label.height).toBeLessThanOrEqual((await box(input)).y);
    await expect(resting.locator('.ui-code-editor__line-number')).toHaveText(['1', '2', '3', '4']);
    const key = resting.locator('.ui-code-editor__token[data-token="key"]').first();
    await expect(key).toHaveText('"fruit"');
    await expect(key).toHaveCSS('color', 'rgb(9, 105, 218)');
    await expect(input).toHaveAttribute('wrap', 'off');
    const only = cell(page, 'resting', 'control-only');
    await expect(only.locator('.ui-field__label')).toHaveCount(0);
    await expect(only.getByRole('textbox', { name: 'Basket' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-CODE-EDITOR-9.1 reports where the text stops parsing and clears once fixed', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const invalid = cell(page, 'invalid', 'label-control');
    await expect(invalid.locator('.ui-field')).toHaveAttribute('data-validation', 'invalid');
    await expect(invalid.locator('.ui-field__message')).toHaveText(
      'Enter valid JSON: check line 3, column 1.',
    );
    await expect(invalid.locator('.ui-field__message')).toHaveCSS('color', 'rgb(207, 34, 46)');
    const warning = cell(page, 'warning', 'label-control');
    await expect(warning.locator('.ui-field__message')).toHaveText('The basket names no fruit.');
    const input = invalid.getByRole('textbox', { name: 'Basket' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('End');
    await page.keyboard.type('"Fig"');
    await expect(invalid.locator('.ui-field')).toHaveAttribute('data-validation', 'valid');
    await expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('UIC-CODE-EDITOR-10.1 formats the text with the chosen indentation, keeping every number, and commits it', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editor = saved(page);
    const format = editor.getByRole('button', { name: 'Format' });
    await format.click();
    const formatted =
      '{\n    "fruit": "Pear",\n    "id": 9007199254740993,\n    "sizes": [\n        1,\n        2,\n        3\n    ]\n}';
    await expect(editor.getByRole('textbox', { name: 'Order' })).toHaveValue(formatted);
    await expect(
      page.locator(`${familySelector('json')} [data-lab-output="Committed"]`),
    ).toHaveText(formatted);
    await expect(format).toBeDisabled();
    await expect(editor.locator('.ui-code-editor__line-number')).toHaveCount(9);
  });

  test('UIC-CODE-EDITOR-11.1 restores the committed text and commits on leaving the editor', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editor = saved(page);
    const input = editor.getByRole('textbox', { name: 'Order' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' ');
    await expect(editor).toHaveAttribute('data-dirty', 'true');
    await editor.getByRole('button', { name: 'Restore Order' }).click();
    await expect(input).toHaveValue('{"fruit":"Pear","id":9007199254740993,"sizes":[1,2,3]}');
    await expect(input).toBeFocused();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n');
    await page.keyboard.press('Tab');
    await expect(
      page.locator(`${familySelector('json')} [data-lab-output="Committed"]`),
    ).toHaveText('{"fruit":"Pear","id":9007199254740993,"sizes":[1,2,3]}');
  });

  test('UIC-FIELD-1.11 UIC-CODE-EDITOR-11.1 reaches the restore button by Tab and commits on leaving the field', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const editor = saved(page);
    const committed = page.locator(`${familySelector('json')} [data-lab-output="Committed"]`);
    const input = editor.getByRole('textbox', { name: 'Order' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type(',"ripe":true');
    await page.keyboard.press('Tab');
    await expect(editor.getByRole('button', { name: 'Restore Order' })).toBeFocused();
    await expect(editor).toHaveAttribute('data-dirty', 'true');
    // Moving between the field's own buttons commits nothing.
    await page.keyboard.press('Tab');
    await expect(editor.getByRole('button', { name: 'Help for Order' })).toBeFocused();
    await expect(committed).toHaveText('{"fruit":"Pear","id":9007199254740993,"sizes":[1,2,3]}');
    await page.keyboard.press('Tab');
    await expect(committed).toHaveText(
      '{"fruit":"Pear","id":9007199254740993,"sizes":[1,2,3],"ripe":true}',
    );
    await expect(editor).not.toHaveAttribute('data-dirty');
    await expect(editor).not.toHaveAttribute('data-focused');
  });

  test('UIC-CODE-EDITOR-9.3 marks where the text stops parsing in the editor', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const invalid = cell(page, 'invalid', 'label-control');
    await expect(invalid.locator('.ui-code-editor__mark')).toHaveText(['}']);
    await expect(invalid.locator('.ui-code-editor__mark')).toHaveCSS(
      'text-decoration-style',
      'wavy',
    );
    await expect(invalid.locator('.ui-code-editor__line').nth(2)).toHaveAttribute(
      'data-severity',
      'error',
    );
    await expect(invalid.locator('.ui-code-editor__diagnostics')).toHaveCount(0);
  });

  test('UIC-CODE-EDITOR-13.1 UIC-CODE-EDITOR-13.5 marks schema problems and documents keys on hover', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const recipe = page.locator(`${familySelector('json')} [data-lab-editor="recipe"]`);
    await recipe.scrollIntoViewIfNeeded();
    await expect(recipe.locator('.ui-field__message')).toHaveText(
      'Line 3, column 15: Enter 8 or less.',
    );
    await expect(recipe.locator('.ui-code-editor__mark')).toHaveText(['12', '"brunch"']);
    const inputBox = await box(recipe.getByRole('textbox', { name: 'Recipe' }));
    expect(inputBox.width).toBeGreaterThan(300);
    const key = await box(recipe.locator('.ui-code-editor__token', { hasText: '"servings"' }));
    await page.mouse.move(key.x + key.width / 2, key.y + key.height / 2);
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('How many people it feeds.');
    const value = await box(recipe.locator('.ui-code-editor__mark').first());
    await page.mouse.move(value.x + value.width / 2, value.y + value.height / 2);
    await expect(tip).toHaveText('Enter 8 or less.How many people it feeds.');
    await lab.expectAccessible();
  });

  test('UIC-CODE-EDITOR-13.2 UIC-CODE-EDITOR-14.1 completes keys from the schema with paired quotes', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const recipe = page.locator(`${familySelector('json')} [data-lab-editor="recipe"]`);
    const input = recipe.getByRole('textbox', { name: 'Recipe' });
    await input.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('End');
    await page.keyboard.type(',');
    await page.keyboard.press('Enter');
    await page.keyboard.type('"');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveText(['"vegetarian" boolean', '"tags" array']);
    await page.keyboard.type('ve');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue(/"course": "brunch",\n {2}"vegetarian": false\n\}$/);
    await page.keyboard.type('true');
    await expect(input).toHaveValue(/"vegetarian": true\n\}$/);
    await expect(recipe.locator('.ui-code-editor__bracket')).toHaveCount(0);
  });

  test('UIC-CODE-EDITOR-13.1 UIC-CODE-EDITOR-13.2 validates reordered objects and inserts constant and null defaults', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const sample = page.locator(`${familySelector('json')} [data-lab-editor="literal-schema"]`);
    const input = sample.getByRole('textbox', { name: 'Schema values' });
    await expect(sample).toHaveAttribute('data-validation', 'valid');
    await input.fill('{"constant');
    await page.keyboard.press('Control+Space');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('{"constant": "fixed"');
    await input.fill('{"nullable');
    await page.keyboard.press('Control+Space');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('{"nullable": null');
    await input.fill('{"toString":1}');
    await expect(sample.locator('.ui-field__message')).toHaveText(
      'Line 1, column 2: Property "toString" is not allowed.',
    );
  });

  test('UIC-CODE-EDITOR-2.3 UIC-CODE-EDITOR-9.3 marks its own problems on the gutter line of an excerpt', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const excerpt = page.locator(`${familySelector('json')} [data-lab-editor="excerpt"]`);
    await expect(excerpt.locator('.ui-field__message')).toHaveText(
      'Enter valid JSON: check line 122, column 12.',
    );
    await expect(excerpt.locator('.ui-code-editor__line-number')).toHaveText([
      '120',
      '121',
      '122',
      '123',
    ]);
    await expect(excerpt.locator('.ui-code-editor__line[data-severity]')).toHaveCount(2);
    await expect(excerpt.locator('.ui-code-editor__mark[data-severity="error"]')).toHaveText(',');
    const input = excerpt.getByRole('textbox', { name: 'Excerpt' });
    await input.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('F8');
    await page.keyboard.press('F8');
    expect(
      await input.evaluate((area: HTMLTextAreaElement) =>
        area.value.slice(area.selectionStart, area.selectionEnd),
      ),
    ).toBe(',');
  });
});
