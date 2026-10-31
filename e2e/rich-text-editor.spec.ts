import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function editor(page: Page, name: string): Locator {
  return page.locator(`[data-lab-editor="${name}"]`);
}

function content(page: Page, name: string): Locator {
  return editor(page, name).locator('.ui-rich-text-editor__content');
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function formatToolbar(page: Page, name = 'full'): Locator {
  return editor(page, name).getByRole('toolbar', { name: 'Text formatting' });
}

/** Empties the full editor's document and leaves the caret in it. */
async function clearFull(page: Page) {
  const box = content(page, 'full');
  await box.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await expect(box.locator('> *')).toHaveCount(1);
  return box;
}

/**
 * Moves the caret to the end of its line. ProseMirror reads the selection a click made a moment
 * after the click, which can undo an End pressed at once, so End is pressed until the caret holds.
 */
async function pressEnd(page: Page) {
  await expect(async () => {
    await page.keyboard.press('End');
    const atEnd = await page.evaluate(() => {
      const selection = window.getSelection();
      const node = selection?.focusNode;
      if (!selection?.isCollapsed || !node) return false;
      const block = (
        node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
      )?.closest('p, li, h1, h2, h3, blockquote, pre');
      if (!block) return false;
      const range = document.createRange();
      range.selectNodeContents(block);
      range.setStart(node, selection.focusOffset);
      return range.toString() === '';
    });
    expect(atEnd).toBe(true);
  }).toPass();
}

/** The type names of the full editor's top-level blocks, from its JSON output. */
async function blockTypes(page: Page): Promise<string[]> {
  const json = JSON.parse((await output(page, 'json').textContent()) ?? '{}') as {
    content: Array<{ type: string }>;
  };
  return json.content.map((block) => block.type);
}

test.describe('Rich Text Editor lab', () => {
  test('UIC-RICH-TEXT-EDITOR-1.1 UIC-RICH-TEXT-EDITOR-1.4 UIC-RICH-TEXT-EDITOR-3.4 types text, reports the document and undoes', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await expect(box).toHaveAttribute('role', 'textbox');
    await expect(box.locator('p')).toHaveAttribute('data-placeholder', 'Write the recipe…');
    await page.keyboard.type('Plums are sweet.');
    await expect(box.locator('p')).toHaveText('Plums are sweet.');
    await expect(output(page, 'text')).toHaveText('Plums are sweet.');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second line');
    await expect(output(page, 'html')).toHaveText('<p>Plums are sweet.</p><p>Second line</p>');
    await page.keyboard.press('Control+Z');
    await expect(output(page, 'text')).not.toContainText('Second line');
    await page.keyboard.press('Control+Shift+Z');
    await expect(output(page, 'text')).toContainText('Second line');
    await lab.expectAccessible();
  });

  test('UIC-RICH-TEXT-EDITOR-3.1 UIC-RICH-TEXT-EDITOR-6.1 marks text from the toolbar and the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('Fruit\napples pears');
    await page.keyboard.press('Control+Shift+ArrowLeft');
    const bold = formatToolbar(page).getByRole('button', { name: 'Bold' });
    await bold.click();
    await expect(box.locator('strong')).toHaveText('pears');
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(box).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.press('Control+I');
    await page.keyboard.type(' plums');
    await expect(box.locator('em')).toHaveText(' plums');
    const italic = formatToolbar(page).getByRole('button', { name: 'Italic' });
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Control+U');
    await page.keyboard.type('!');
    await expect(box.locator('u')).toHaveText('!');
  });

  test('UIC-RICH-TEXT-EDITOR-3.2 turns Markdown shortcuts into blocks and marks as they are typed', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('a **bold** b _soft_ c `code` d ~~gone~~\n');
    await expect(box.locator('strong')).toHaveText('bold');
    await expect(box.locator('em')).toHaveText('soft');
    await expect(box.locator('p code')).toHaveText('code');
    await expect(box.locator('s')).toHaveText('gone');
    await page.keyboard.type('## Pantry\n');
    await page.keyboard.type('- flour\n\n');
    await page.keyboard.type('1. sugar\n\n');
    await page.keyboard.type('> quoted\n\n');
    await page.keyboard.type('[ ] buy eggs\n\n');
    await page.keyboard.type('---');
    await page.keyboard.type('``` let x');
    await expect
      .poll(() => blockTypes(page))
      .toEqual([
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'blockquote',
        'taskList',
        'horizontalRule',
        'codeBlock',
      ]);
    await expect(box.locator('h2')).toHaveText('Pantry');
    await expect(box.locator('pre')).toHaveText('let x');
    await page.keyboard.press('Control+Enter');
    await page.keyboard.type('after');
    await expect.poll(async () => (await blockTypes(page)).at(-1)).toBe('paragraph');
  });

  test('UIC-RICH-TEXT-EDITOR-6.2 UIC-RICH-TEXT-EDITOR-6.3 changes the block type and edits a link from the toolbar', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('Market day');
    const toolbar = formatToolbar(page);
    await toolbar.getByRole('button', { name: /Block type/ }).click();
    await page.getByRole('option', { name: 'Heading 2' }).click();
    await expect(box.locator('h2')).toHaveText('Market day');
    await expect(box).toBeFocused();
    await expect(toolbar.getByRole('button', { name: /Block type/ })).toContainText('Heading 2');
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await toolbar.getByRole('button', { name: 'Link' }).click();
    const address = page.getByRole('textbox', { name: 'Link address' });
    await expect(address).toBeFocused();
    await address.fill('https://example.com/day');
    await page.keyboard.press('Enter');
    await expect(box.locator('a')).toHaveAttribute('href', 'https://example.com/day');
    await expect(box.locator('a')).toHaveText('day');
    await expect(box).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await expect(toolbar.getByRole('button', { name: 'Link' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await toolbar.getByRole('button', { name: 'Link' }).click();
    await expect(page.getByRole('textbox', { name: 'Link address' })).toHaveValue(
      'https://example.com/day',
    );
    await page.getByRole('button', { name: 'Remove link' }).click();
    await expect(box.locator('a')).toHaveCount(0);
  });

  test('UIC-RICH-TEXT-EDITOR-8.1 UIC-RICH-TEXT-EDITOR-8.2 opens the slash menu at the caret and inserts from it', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('/');
    const menu = page.getByRole('listbox', { name: 'Insert commands' });
    await expect(menu.getByRole('option')).toHaveCount(11);
    await expect(box).toHaveAttribute('aria-controls', (await menu.getAttribute('id')) ?? '');
    await page.keyboard.type('quo');
    await expect(menu.getByRole('option').first()).toHaveText('Quote');
    await expect(box).toHaveAttribute(
      'aria-activedescendant',
      (await menu.getByRole('option').first().getAttribute('id')) ?? '',
    );
    await lab.expectAccessible();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(box.locator('blockquote')).toHaveCount(1);
    await expect(box.locator('blockquote')).toHaveText('');
    await page.keyboard.type('Ripe now');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/head');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('option', { name: 'Heading 2' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Enter');
    await expect(box.locator('h2')).toHaveCount(1);
    await page.keyboard.type('Plums /sign');
    await page.keyboard.press('Tab');
    await expect(box.locator('h2')).toHaveText('Plums With thanks, the orchard team');
    await page.keyboard.type(' /zzz');
    await expect(menu).toHaveCount(0);
    await page.keyboard.type(' /');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
  });

  test('UIC-RICH-TEXT-EDITOR-8.3 inserts blocks from the insert button', async ({ page, lab }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('Before');
    await formatToolbar(page).getByRole('button', { name: 'Insert' }).click();
    await page.getByRole('menuitem', { name: 'Divider' }).click();
    await expect(box.locator('hr')).toHaveCount(1);
    await expect(box).toBeFocused();
    await page.keyboard.type('After');
    await expect.poll(() => blockTypes(page)).toEqual(['paragraph', 'horizontalRule', 'paragraph']);
  });

  test('UIC-RICH-TEXT-EDITOR-7.1 UIC-RICH-TEXT-EDITOR-7.2 floats a toolbar over selected text', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = await clearFull(page);
    await page.keyboard.type('Fruit\nPears and figs');
    const floating = page.getByRole('toolbar', { name: 'Selection formatting' });
    await expect(floating).toHaveCount(0);
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await expect(floating).toBeVisible();
    const selection = await box.locator('p').nth(1).boundingBox();
    const toolbarBox = await floating.boundingBox();
    expect(toolbarBox && selection && toolbarBox.y + toolbarBox.height).toBeLessThanOrEqual(
      (selection?.y ?? 0) + 2,
    );
    await floating.getByRole('button', { name: 'Italic' }).click();
    await expect(box.locator('em')).toHaveText('figs');
    await expect(box).toBeFocused();
    await expect(floating).toBeVisible();
    await lab.expectAccessible();
    await page.keyboard.press('Alt+F10');
    await expect(floating.getByRole('button', { name: 'Bold' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(box).toBeFocused();
    await expect(floating).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(floating).toHaveCount(0);
  });

  test('UIC-RICH-TEXT-EDITOR-9.1 UIC-RICH-TEXT-EDITOR-9.3 moves blocks from the keyboard and the block menu', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'full');
    await box.locator('h1').click();
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expect
      .poll(async () => (await blockTypes(page)).slice(0, 2))
      .toEqual(['paragraph', 'heading']);
    await expect(box.locator('> :nth-child(2)')).toHaveText('Orchard crumble');
    await page.keyboard.type('!');
    await expect(box.locator('h1')).toContainText('!');
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect(box.locator('> :first-child')).toHaveText(/^Orchard crumble/);
    const handle = editor(page, 'full').locator('.ui-block-handle');
    await expect(handle).toBeVisible();
    await box.locator('blockquote').hover();
    const quote = await box.locator('blockquote').boundingBox();
    const handleBox = await handle.boundingBox();
    expect(Math.abs((handleBox?.y ?? 0) - (quote?.y ?? 0))).toBeLessThan(8);
    await handle.getByRole('button', { name: 'Block actions' }).click();
    await page.getByRole('menuitem', { name: 'Move up' }).click();
    await expect
      .poll(async () => (await blockTypes(page)).slice(-2))
      .toEqual(['blockquote', 'taskList']);
    await expect(box).toBeFocused();
    await box.locator('h1').hover();
    await handle.getByRole('button', { name: 'Block actions' }).click();
    await page.getByRole('menuitem', { name: 'Turn into' }).click();
    await page.getByRole('menuitem', { name: 'Heading 3' }).click();
    await expect(box.locator('h3')).toHaveText(/^Orchard crumble/);
    await box.locator('h3').hover();
    await handle.getByRole('button', { name: 'Block actions' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(box.locator('h3')).toHaveCount(2);
    await box.locator('h3').first().hover();
    await handle.getByRole('button', { name: 'Block actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Move up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(box.locator('h3')).toHaveCount(1);
  });

  test('UIC-RICH-TEXT-EDITOR-9.2 drags a block by its grip', async ({ page, lab }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'full');
    await box.locator('h1').hover();
    const grip = await editor(page, 'full').locator('.ui-block-handle__grip').boundingBox();
    const quote = await box.locator('blockquote').boundingBox();
    if (!grip || !quote) throw new Error('not rendered');
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + 30, grip.y + 30, { steps: 3 });
    await page.mouse.move(quote.x + 40, quote.y + quote.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await blockTypes(page)).at(0)).toBe('paragraph');
    await expect(box.locator('h1')).toHaveCount(1);
  });

  test('UIC-RICH-TEXT-EDITOR-2.3 ticks tasks', async ({ page, lab }) => {
    await lab.open('rich-text-editor');
    const tasks = content(page, 'full').locator('.ui-rich-text-editor__task-item');
    await expect(tasks.first()).toHaveAttribute('data-checked', 'true');
    await expect(tasks.nth(1).getByRole('checkbox', { name: 'Done' })).not.toBeChecked();
    await tasks.nth(1).locator('.ui-checkbox').click();
    await expect(tasks.nth(1).getByRole('checkbox', { name: 'Done' })).toBeChecked();
    await expect(tasks.nth(1)).toHaveAttribute('data-checked', 'true');
    await expect(output(page, 'html')).toContainText(
      'data-checked="true"><label><input type="checkbox" disabled="" checked=""></label><div><p>Bake',
    );
  });

  test('UIC-RICH-TEXT-EDITOR-2.2 UIC-RICH-TEXT-EDITOR-5.3 extends the schema with a block and a mark', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'custom');
    const toolbar = formatToolbar(page, 'custom');
    await expect(toolbar.getByRole('option', { name: 'Code block' })).toHaveCount(0);
    await expect(box.locator('mark')).toHaveText('basket');
    await box.locator('p').first().click();
    await pressEnd(page);
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await toolbar.getByRole('button', { name: 'Highlight' }).click();
    await expect(box.locator('mark')).toHaveText(['basket', 'market.']);
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/call');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Bring cash');
    await expect(box.locator('aside')).toHaveCount(2);
    await expect(output(page, 'custom-html')).toContainText(
      '<aside data-callout="true"><p>Bring cash</p></aside>',
    );
  });

  test('UIC-RICH-TEXT-EDITOR-4.2 replaces the document when the value changes from outside', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'controlled');
    await box.locator('p').click();
    await pressEnd(page);
    await page.keyboard.type(' Early.');
    await expect(output(page, 'changes')).toHaveText('7');
    await page.getByRole('button', { name: 'Load the recipe' }).click();
    await expect(box.locator('h1')).toHaveText('Orchard crumble');
    await expect(output(page, 'changes')).toHaveText('7');
    await editor(page, 'controlled')
      .getByRole('button', { name: /Restore/ })
      .click();
    await expect(box.locator('p')).toHaveText('Pick the pears on Friday. Early.');
    await expect(editor(page, 'controlled')).not.toHaveAttribute('data-dirty', 'true');
  });

  test('UIC-RICH-TEXT-EDITOR-1.3 UIC-RICH-TEXT-EDITOR-3.4 edits a long document in place and undoes a restore', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const field = editor(page, 'long');
    const box = content(page, 'long');
    await expect(box.locator('p')).toHaveCount(1000);
    const first = box.locator('p').first();
    await first.click();
    await page.keyboard.type(' Picked.');
    await expect(first).toContainText('Picked.');
    await expect(output(page, 'kept')).toHaveText('999 of 1000');
    await expect(field).toHaveAttribute('data-dirty', 'true');
    await field.getByRole('button', { name: 'Restore Orchard log' }).click();
    await expect(first).not.toContainText('Picked.');
    await page.keyboard.press('Control+z');
    await expect(first).toContainText('Picked.');
    await expect(field).toHaveAttribute('data-dirty', 'true');
  });

  test('UIC-FIELD-1.11 UIC-RICH-TEXT-EDITOR-4.2 reaches the restore button by Tab and commits on leaving the field', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const field = matrixCell(page, 'state=resting chrome=plain').locator('.ui-rich-text-editor');
    const document = field.getByRole('textbox', { name: /^Note/ });
    await document.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' today');
    await expect(field).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Tab');
    const restore = field.getByRole('button', { name: 'Restore Note' });
    await expect(restore).toBeFocused();
    await expect(field).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Tab');
    await expect(field).not.toHaveAttribute('data-dirty');
    await expect(field).not.toHaveAttribute('data-focused');
    await expect(restore).toHaveCount(0);
    await expect(document).toContainText('today');
  });

  test('UIC-RICH-TEXT-EDITOR-4.1 refuses edits while read-only or disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const readOnly = matrixCell(page, 'state=read-only chrome=toolbar');
    const box = readOnly.getByRole('textbox', { name: 'Note' });
    await expect(box).toHaveAttribute('contenteditable', 'false');
    await expect(box).toHaveAttribute('aria-readonly', 'true');
    await box.focus();
    await page.keyboard.type('x');
    await expect(box).toHaveText('Pick the pears on Friday.');
    await expect(readOnly.getByRole('button', { name: 'Bold' })).toBeDisabled();
    const disabled = matrixCell(page, 'state=disabled chrome=plain');
    await expect(disabled.getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const invalid = matrixCell(page, 'state=invalid chrome=plain');
    await expect(invalid.getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('UIC-RICH-TEXT-EDITOR-11.1 passes axe in the dark theme with the chrome open', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor', { theme: 'dark' });
    await clearFull(page);
    await page.keyboard.type('Dark pears');
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await expect(page.getByRole('toolbar', { name: 'Selection formatting' })).toBeVisible();
    await lab.expectAccessible();
    await page.keyboard.press('End');
    await page.keyboard.type(' /');
    await expect(page.getByRole('listbox', { name: 'Insert commands' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-RICH-TEXT-EDITOR-4.1 UIC-RICH-TEXT-EDITOR-8.1 keeps a slash query unchanged after locking the editor', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'lockable');
    await box.click();
    await pressEnd(page);
    const menu = page.getByRole('listbox', { name: 'Insert commands' });
    await expect(menu).toBeVisible();
    await page.getByRole('button', { name: 'Make read-only' }).click();
    await expect(box).toHaveAttribute('aria-readonly', 'true');
    await box.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(box).toHaveText('/head');
    await expect(
      formatToolbar(page, 'lockable').getByRole('button', { name: 'Insert' }),
    ).toBeDisabled();
  });

  test('UIC-RICH-TEXT-EDITOR-4.3 submits the document as JSON with its form', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const form = page.locator('form').filter({ has: editor(page, 'form') });
    const submittedText = async () => {
      await form.getByRole('button', { name: 'Submit' }).click();
      const json = (await output(page, 'form').textContent()) ?? '';
      const document = JSON.parse(json) as { content: { content: { text: string }[] }[] };
      return document.content.map((block) => block.content.map((run) => run.text).join(''));
    };
    expect(await submittedText()).toEqual(['Pick the pears on Friday.']);
    await content(page, 'form').click();
    await pressEnd(page);
    await page.keyboard.type(' Early.');
    expect(await submittedText()).toEqual(['Pick the pears on Friday. Early.']);
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(content(page, 'form')).toHaveText('Pick the pears on Friday.');
    expect(await submittedText()).toEqual(['Pick the pears on Friday.']);
  });

  test('UIC-RICH-TEXT-EDITOR-6.3 applies a link without submitting the form around the editor', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const form = page.locator('form').filter({ has: editor(page, 'form') });
    await content(page, 'form').click();
    await page.keyboard.press('Control+a');
    await form.getByRole('button', { name: 'Link' }).click();
    await page.getByRole('textbox', { name: 'Link address' }).fill('https://example.com/pears');
    await page.keyboard.press('Enter');
    await expect(content(page, 'form').locator('a')).toHaveAttribute(
      'href',
      'https://example.com/pears',
    );
    await expect(output(page, 'form-submits')).toHaveText('0');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'form-submits')).toHaveText('1');
    await expect(output(page, 'form')).toContainText('https://example.com/pears');
  });

  test('UIC-RICH-TEXT-EDITOR-4.2 keeps a replaced document attribute through later edits', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    await page.getByRole('button', { name: 'Next edition' }).click();
    await expect(output(page, 'custom-edition')).toHaveText('2');
    await content(page, 'custom').locator('p').first().click();
    await pressEnd(page);
    await page.keyboard.type(' Today.');
    await expect(content(page, 'custom').locator('p').first()).toContainText('market. Today.');
    await expect(output(page, 'custom-edition')).toHaveText('2');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    await expect(output(page, 'custom-edition')).toHaveText('1');
  });
});
