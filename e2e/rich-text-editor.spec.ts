import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

interface DragPlan {
  from: number;
  to: number;
  edge: 'top' | 'bottom';
  /** Runs mid-drag, before the pointer reaches the target. */
  beforeDrop?: () => Promise<unknown>;
}

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
    const atEnd = await page.evaluate(async () => {
      // ProseMirror may put back its own selection shortly after the editor gains focus (a 20 ms
      // timer), so the caret must still be at the end once that has run.
      await new Promise((resolve) => setTimeout(resolve, 50));
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

  /** The full editor's top-level blocks: tag and first words. */
  async function blockOrder(page: Page): Promise<string[]> {
    return content(page, 'full').evaluate((node) =>
      [...node.children].map((block) => `${block.tagName} ${block.textContent?.slice(0, 12)}`),
    );
  }

  /** Drags the block at `from` by its grip to the top or bottom edge of the block at `to`. */
  async function dragBlock(page: Page, { from, to, edge, beforeDrop }: DragPlan): Promise<void> {
    const blocks = content(page, 'full').locator(':scope > *');
    await blocks.nth(from).hover();
    const grip = await editor(page, 'full').locator('.ui-block-handle__grip').boundingBox();
    if (!grip) throw new Error('no grip');
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + 30, grip.y + 30, { steps: 3 });
    await beforeDrop?.();
    const target = await blocks.nth(to).boundingBox();
    if (!target) throw new Error('no target');
    const y = edge === 'top' ? target.y + 3 : target.y + target.height - 3;
    await page.mouse.move(target.x + 40, y, { steps: 8 });
    // Playwright delivers a drag's moves late: one more move brings the last one in.
    await page.mouse.move(target.x + 41, y);
    await expect(page.locator('.ui-block-handle__drop-indicator')).toBeVisible();
    await page.mouse.up();
  }

  test('UIC-RICH-TEXT-EDITOR-9.2 drags a block by its grip between blocks, first and last', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const start = await blockOrder(page);
    expect(start).toEqual([
      'H1 Orchard crum',
      'P A quick dess',
      'H2 Ingredients',
      'UL Four applesT',
      'UL Peel the fru',
      'BLOCKQUOTE Serve warm.',
    ]);
    const [title, intro, heading, fruit, steps, quote] = start;
    // Past a list: the paragraph lands between blocks, not inside the list.
    await dragBlock(page, { from: 1, to: 3, edge: 'bottom' });
    await expect.poll(() => blockOrder(page)).toEqual([title, heading, fruit, intro, steps, quote]);
    await expect(page.locator('.ui-block-handle__drop-indicator')).toHaveCount(0);
    const moved = content(page, 'full').locator(':scope > p');
    await expect(moved.locator('strong')).toHaveText('ripe');
    await expect(moved.getByRole('link', { name: 'market notes' })).toBeVisible();
    await dragBlock(page, { from: 0, to: 5, edge: 'bottom' });
    await expect.poll(() => blockOrder(page)).toEqual([heading, fruit, intro, steps, quote, title]);
    await dragBlock(page, { from: 5, to: 0, edge: 'top' });
    await expect.poll(() => blockOrder(page)).toEqual([title, heading, fruit, intro, steps, quote]);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => blockOrder(page)).toEqual([heading, fruit, intro, steps, quote, title]);
    await page.keyboard.press('ControlOrMeta+z');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => blockOrder(page)).toEqual(start);
    await content(page, 'full').locator('h2').click();
    // The editor reads the caret the click placed before the key moves its block.
    await expect(formatToolbar(page).getByRole('button', { name: /Block type/ })).toHaveText(
      /Heading 2/,
    );
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect.poll(() => blockOrder(page)).toEqual([title, heading, intro, fruit, steps, quote]);
  });

  test('UIC-RICH-TEXT-EDITOR-9.2 keeps the order when a drag is cancelled, and follows a scroll', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const start = await blockOrder(page);
    const blocks = content(page, 'full').locator(':scope > *');
    await blocks.nth(1).hover();
    const grip = await editor(page, 'full').locator('.ui-block-handle__grip').boundingBox();
    if (!grip) throw new Error('no grip');
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + 30, grip.y + 120, { steps: 6 });
    await expect(editor(page, 'full').locator('.ui-block-handle')).toHaveAttribute(
      'data-dragging',
      'true',
    );
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(editor(page, 'full').locator('.ui-block-handle[data-dragging]')).toHaveCount(0);
    expect(await blockOrder(page)).toEqual(start);
    const [title, intro, heading, fruit, steps, quote] = start;
    await dragBlock(page, {
      from: 0,
      to: 4,
      edge: 'bottom',
      beforeDrop: () => page.evaluate(() => window.scrollBy(0, 60)),
    });
    await expect.poll(() => blockOrder(page)).toEqual([intro, heading, fruit, steps, title, quote]);
  });

  test('UIC-RICH-TEXT-EDITOR-9.4 shows the chosen block handle controls and no gutter without one', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const choices = [
      { name: 'grip-menu', grips: 1, menus: 1 },
      { name: 'grip', grips: 1, menus: 0 },
      { name: 'menu', grips: 0, menus: 1 },
    ];
    for (const { name, grips, menus } of choices) {
      await content(page, `handle-${name}`).locator('p').first().hover();
      const handle = editor(page, `handle-${name}`).locator('.ui-block-handle');
      await expect(handle).toBeVisible();
      await expect(handle.locator('.ui-block-handle__grip')).toHaveCount(grips);
      await expect(handle.getByRole('button', { name: 'Block actions' })).toHaveCount(menus);
    }
    const inset = (name: string) =>
      content(page, name).evaluate(
        (node) =>
          node.getBoundingClientRect().left -
          (node.closest('.ui-rich-text-editor__surface')?.getBoundingClientRect().left ?? 0),
      );
    const none = content(page, 'handle-none');
    await none.locator('p').first().hover();
    await expect(editor(page, 'handle-none').locator('.ui-block-handle')).toHaveCount(0);
    expect(await inset('handle-none')).toBeLessThan(await inset('handle-grip'));
    await none.locator('p').nth(1).click();
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expect(none.locator('p').first()).toHaveText('Halve them and take out the stones.');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(none.locator('p').first()).toHaveText('Wash the plums.');
  });

  test('UIC-RICH-TEXT-EDITOR-9.4 keeps a gutter only as wide as the chosen controls', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const inset = (name: string) =>
      content(page, name).evaluate(
        (node) =>
          node.getBoundingClientRect().left -
          (node.closest('.ui-rich-text-editor__surface')?.getBoundingClientRect().left ?? 0),
      );
    const insets = {
      both: await inset('handle-grip-menu'),
      grip: await inset('handle-grip'),
      menu: await inset('handle-menu'),
      neither: await inset('handle-neither'),
      none: await inset('handle-none'),
    };
    expect(insets.neither).toBe(insets.none);
    expect(insets.grip).toBeGreaterThan(insets.none);
    expect(insets.menu).toBeGreaterThan(insets.none);
    expect(insets.grip).toBeLessThan(insets.both - 10);
    expect(insets.menu).toBeLessThan(insets.both - 10);
    for (const name of ['handle-grip-menu', 'handle-grip', 'handle-menu']) {
      const surface = editor(page, name).locator('.ui-rich-text-editor__surface');
      // The narrow editor scrolls: the last block wraps below the fold.
      await surface.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
      const last = content(page, name).locator('p').last();
      await last.hover();
      const handle = editor(page, name).locator('.ui-block-handle');
      await expect(handle).toBeVisible();
      const [handleBox, textBox, surfaceBox] = await Promise.all([
        handle.boundingBox(),
        last.boundingBox(),
        surface.boundingBox(),
      ]);
      if (!handleBox || !textBox || !surfaceBox) throw new Error('no box');
      expect(handleBox.x).toBeGreaterThanOrEqual(surfaceBox.x);
      expect(handleBox.x + handleBox.width).toBeLessThanOrEqual(textBox.x);
      expect(Math.abs(handleBox.y - textBox.y)).toBeLessThan(textBox.height);
    }
  });

  test('UIC-RICH-TEXT-EDITOR-9.1 reveals the handle when the pointer enters the gutter directly', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const field = editor(page, 'full');
    const box = content(page, 'full');
    const handle = field.locator('.ui-block-handle');
    await field.scrollIntoViewIfNeeded();
    const surface = await field.locator('.ui-rich-text-editor__surface').boundingBox();
    const text = await box.boundingBox();
    if (!surface || !text) throw new Error('no box');
    const gutterX = (surface.x + text.x) / 2;
    /** The handle's offset from a block's top, polled. */
    const offsetFrom = (block: Locator) => async () => {
      const [handleBox, blockBox] = await Promise.all([handle.boundingBox(), block.boundingBox()]);
      return handleBox && blockBox ? Math.abs(handleBox.y - blockBox.y) : Number.NaN;
    };
    const quote = box.locator('blockquote');
    const quoteBox = await quote.boundingBox();
    if (!quoteBox) throw new Error('no quote');
    // From outside the editor straight into the gutter beside a later block, crossing no text.
    await page.mouse.move(surface.x - 40, quoteBox.y + quoteBox.height / 2);
    await expect(handle).toHaveCount(0);
    await page.mouse.move(gutterX, quoteBox.y + quoteBox.height / 2, { steps: 4 });
    await expect(handle).toBeVisible();
    await expect.poll(offsetFrom(quote)).toBeLessThan(8);
    await expect(box).not.toBeFocused();
    // Down the gutter: a heading, then the list, each picked as the pointer reaches it.
    for (const block of [box.locator('h1'), box.locator('ul').first()]) {
      const blockBox = await block.boundingBox();
      if (!blockBox) throw new Error('no block');
      await page.mouse.move(gutterX, blockBox.y + Math.min(8, blockBox.height / 2), { steps: 4 });
      await expect.poll(offsetFrom(block)).toBeLessThan(8);
    }
    // Onto the handle's menu button: it stays on its block and opens there.
    const list = box.locator('ul').first();
    await handle.getByRole('button', { name: 'Block actions' }).hover();
    await expect.poll(offsetFrom(list)).toBeLessThan(8);
    await page.mouse.move(surface.x - 40, surface.y + 4);
    await expect(handle).toHaveCount(0);
  });

  test('UIC-RICH-TEXT-EDITOR-9.1 picks the gutter block in a scrolled editor with one control', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    for (const name of ['handle-grip', 'handle-menu']) {
      const field = editor(page, name);
      const surfaceLocator = field.locator('.ui-rich-text-editor__surface');
      await field.scrollIntoViewIfNeeded();
      await surfaceLocator.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
      const surface = await surfaceLocator.boundingBox();
      const text = await content(page, name).boundingBox();
      const last = content(page, name).locator('p').last();
      const lastBox = await last.boundingBox();
      if (!surface || !text || !lastBox) throw new Error('no box');
      await page.mouse.move(surface.x - 40, lastBox.y + lastBox.height - 4);
      await page.mouse.move((surface.x + text.x) / 2, lastBox.y + lastBox.height - 4, { steps: 3 });
      const handle = field.locator('.ui-block-handle');
      await expect(handle).toBeVisible();
      await expect
        .poll(async () => Math.abs(((await handle.boundingBox())?.y ?? 0) - lastBox.y))
        .toBeLessThan(8);
      // The surface scrolls under a still pointer: the block now beside it takes the handle.
      await surfaceLocator.evaluate((node) => node.scrollTo({ top: 0 }));
      const first = content(page, name).locator('p').first();
      await expect
        .poll(async () => {
          const [handleBox, firstBox] = await Promise.all([
            handle.boundingBox(),
            first.boundingBox(),
          ]);
          return Math.abs((handleBox?.y ?? 0) - (firstBox?.y ?? 0));
        })
        .toBeGreaterThan(8);
      await page.mouse.move(surface.x - 40, surface.y);
    }
  });

  test('UIC-RICH-TEXT-EDITOR-6.2 previews block types in the select and applies one', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'preview-labels');
    await box.locator('p').first().click();
    const trigger = editor(page, 'preview-labels').getByRole('button', { name: /Block type/ });
    await expect(trigger).toHaveText(/Text/);
    await trigger.click();
    const list = page.getByRole('listbox');
    const size = (name: string) =>
      list
        .getByRole('option', { name })
        .locator('.ui-format-toolbar__block-preview')
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    const text = await size('Text');
    expect(await size('Heading 1')).toBeGreaterThan(await size('Heading 2'));
    expect(await size('Heading 3')).toBeGreaterThan(text);
    await expect(
      list.getByRole('option', { name: 'Code block' }).locator('.ui-format-toolbar__block-preview'),
    ).toHaveCSS('font-family', /mono/i);
    await expect(list.getByRole('option', { name: 'Text' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(box.locator('h1')).toHaveCount(1);
    await expect(trigger).toHaveText(/Heading 1/);
    await expect(trigger.locator('.ui-format-toolbar__block-preview')).toHaveCount(0);
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
    const checkbox = tasks.nth(1).getByRole('checkbox', { name: 'Done' });
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
    await expect(tasks.nth(1)).not.toHaveAttribute('data-checked');
  });

  test('UIC-RICH-TEXT-EDITOR-2.2 UIC-RICH-TEXT-EDITOR-2.3 UIC-RICH-TEXT-EDITOR-10.1 edits tasks with a replacement renderer', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'custom-tasks');
    const item = box.getByRole('listitem');
    await expect(item).toHaveAttribute('data-task-custom', 'true');
    await expect(item).toHaveText('Wash the fruit');
    await expect(box.getByRole('checkbox')).toHaveCount(0);
    await expect(item).not.toHaveClass(/ui-rich-text-editor__task-item/);
    await item.click();
    await pressEnd(page);
    await page.keyboard.type(' now');
    await expect(item).toHaveText('Wash the fruit now');
    await expect(output(page, 'custom-task-html')).toHaveText(
      '<ul data-type="taskList"><li data-task-custom="true"><p>Wash the fruit now</p></li></ul>',
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

  test('UIC-RICH-TEXT-EDITOR-13.4 UIC-RICH-TEXT-EDITOR-13.5 edits with a block, view and plugins from an extension', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'extension');
    await expect(box).toHaveAttribute('data-lab-extended', 'tip');
    await expect(box.getByRole('complementary', { name: 'Tip' })).toHaveText(
      'Ripen them in a bag.',
    );
    await box.locator('p').first().click();
    await pressEnd(page);
    await page.keyboard.press('Enter');
    await page.keyboard.type('!! ');
    await expect(box.getByRole('complementary', { name: 'Tip' })).toHaveCount(2);
    await page.keyboard.type('Store them cool');
    await expect(output(page, 'extension-html')).toContainText(
      '<aside data-tip="true"><p>Store them cool</p></aside>',
    );
  });

  test('UIC-RICH-TEXT-EDITOR-14.1 UIC-RICH-TEXT-EDITOR-14.5 gates edits in an engine host', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const note = page.getByRole('textbox', { name: 'Short note' });
    await expect(note).toHaveClass(/ui-rich-text-engine-content/);
    await note.click();
    await pressEnd(page);
    await page.keyboard.type(' Store cool.');
    await expect(note).toHaveText('Pears ripen off the tree. Store cool.');
    await expect(output(page, 'engine-edits')).toHaveText('12');
    await page.keyboard.type(' Then eat them.');
    await expect(output(page, 'engine-length')).toHaveText('40');
    await expect(note).toHaveText('Pears ripen off the tree. Store cool. Th');
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

  test('UIC-RICH-TEXT-EDITOR-12.1 UIC-RICH-TEXT-EDITOR-12.2 scrolls a long document inside the editor with marked rows', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const field = editor(page, 'long');
    const box = content(page, 'long');
    const surface = field.locator('.ui-rich-text-editor__surface');
    const markers = field.locator('.ui-rich-text-editor__scroll-marker');
    expect(await surface.evaluate((node) => node.clientHeight)).toBe(360);
    expect((await field.boundingBox())?.height).toBeLessThan(600);
    await expect(field.locator('.ui-scroll-region__thumb')).toHaveCount(1);
    await expect(markers).toHaveCount(4);
    expect(
      await markers.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-severity'))),
    ).toEqual(['error', 'error', 'warning', 'warning']);
    const flagged = box.locator('p').nth(480);
    await expect(flagged).toHaveAttribute('data-severity', 'error');
    await expect(flagged).toHaveAttribute('aria-description', 'Blight reported: inspect this row.');
    await expect(box.locator('p').nth(749)).toHaveAttribute('data-severity', 'warning');
    // The second marker spans rows 481 and 482, at their place in the whole document.
    const [mark, rows] = await Promise.all([
      markers.nth(1).evaluate((node) => parseFloat((node as HTMLElement).style.top) / 100),
      surface.evaluate((node) => {
        const row = node.querySelectorAll('.ui-rich-text-editor__content > p')[480];
        const top = (row?.getBoundingClientRect().top ?? 0) - node.getBoundingClientRect().top;
        return (top + node.scrollTop) / node.scrollHeight;
      }),
    ]);
    expect(Math.abs(mark - rows)).toBeLessThan(0.002);
    await box.locator('p').first().click();
    await page.keyboard.press('ControlOrMeta+End');
    // The caret, at the end of the last row, scrolls into the surface's view.
    await expect
      .poll(() =>
        surface.evaluate((node) => {
          const selection = node.ownerDocument.getSelection();
          const last = node.querySelector('.ui-rich-text-editor__content > p:last-child');
          if (!selection?.rangeCount || !last?.contains(selection.focusNode)) return false;
          const caret = selection.getRangeAt(0).getBoundingClientRect();
          const view = node.getBoundingClientRect();
          return caret.bottom <= view.bottom + 1 && caret.top >= view.top - 1;
        }),
      )
      .toBe(true);
    await page.keyboard.type(' Blight.');
    await expect(markers).toHaveCount(5);
    await expect(box.locator('p').last()).toHaveAttribute('data-severity', 'error');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(markers).toHaveCount(4);
    await page.keyboard.press('ControlOrMeta+Home');
    await expect.poll(() => surface.evaluate((node) => node.scrollTop)).toBeLessThan(20);
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
    await expect(box).toHaveText('Pick the pears on Friday.WashPeel');
    await expect(readOnly.getByRole('button', { name: 'Bold' })).toBeDisabled();
    await expect(readOnly.getByRole('checkbox', { name: 'Done' }).first()).toHaveAttribute(
      'aria-readonly',
      'true',
    );
    const checkbox = readOnly.getByRole('checkbox', { name: 'Done' }).nth(1);
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
    await expect(box).toHaveText('Pick the pears on Friday.WashPeel');
    // A read-only editor's link stays a tab stop; a disabled editor's is not one.
    await expect(readOnly.getByRole('link', { name: 'Wash' })).not.toHaveAttribute('tabindex');
    const disabled = matrixCell(page, 'state=disabled chrome=plain');
    await expect(disabled.getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    // Nothing in a disabled editor is a tab stop, its task checkboxes and links included.
    await expect(disabled.getByRole('link', { name: 'Wash' })).toHaveAttribute('tabindex', '-1');
    for (const checkbox of await disabled.getByRole('checkbox', { name: 'Done' }).all()) {
      await expect(checkbox).toBeDisabled();
    }
    await disabled.getByText('Note', { exact: true }).click();
    await page.keyboard.press('Tab');
    await expect(disabled.locator(':focus')).toHaveCount(0);
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

  test('UIC-RICH-TEXT-EDITOR-4.1 keeps a required editor of blank lines empty and its form blocked', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const field = editor(page, 'required');
    const send = page.getByRole('button', { name: 'Send' });
    await content(page, 'required').click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('- ');
    await expect(content(page, 'required').locator('ul')).toHaveCount(1);
    await expect(field).toHaveAttribute('data-validation', 'invalid');
    await send.click();
    await expect(output(page, 'required-submits')).toHaveText('0');
    await content(page, 'required').click();
    await page.keyboard.type('Plums');
    await expect(field).toHaveAttribute('data-validation', 'valid');
    await send.click();
    await expect(output(page, 'required-submits')).toHaveText('1');
  });

  test('UIC-RICH-TEXT-EDITOR-3.5 types at a caret moved while the editor commits a render', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'form');
    await box.click();
    await page.keyboard.press('Home');
    await expect(box).toBeFocused();
    // The caret moves to the end, and the editor renders (bold toggled for the next text, twice)
    // before the browser reports the move.
    await box.evaluate((element) => {
      const paragraph = element.querySelector('p') as HTMLElement;
      const text = paragraph.lastChild as Node;
      document.getSelection()?.collapse(text, text.textContent?.length ?? 0);
      for (let press = 0; press < 2; press += 1) {
        element.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'b', code: 'KeyB', ctrlKey: true, bubbles: true }),
        );
      }
    });
    await page.keyboard.type(' Early.');
    await expect(box).toHaveText('Pick the pears on Friday. Early.');
  });

  test('UIC-RICH-TEXT-EDITOR-7.1 keeps the floating toolbar over its selection when the layout moves', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const box = content(page, 'shifting');
    const floating = page.getByRole('toolbar', { name: 'Moving note formatting' });
    const selectedRect = () =>
      box.evaluate(() => {
        const rect = document.getSelection()?.getRangeAt(0).getBoundingClientRect();
        return { left: rect?.left ?? 0, top: rect?.top ?? 0, right: rect?.right ?? 0 };
      });
    const expectAttached = async () => {
      await expect
        .poll(async () => {
          const range = await selectedRect();
          const toolbar = await floating.boundingBox();
          if (!toolbar) return 'hidden';
          const above = Math.abs(toolbar.y + toolbar.height - range.top) <= 12;
          const beside =
            toolbar.x <= range.right + 8 && toolbar.x + toolbar.width >= range.left - 8;
          return above && beside
            ? 'attached'
            : `toolbar ${JSON.stringify(toolbar)} range ${JSON.stringify(range)}`;
        })
        .toBe('attached');
    };
    await box.click();
    await pressEnd(page);
    await page.keyboard.press('Control+Shift+ArrowLeft');
    await expect(floating).toBeVisible();
    await expectAttached();
    const before = await floating.boundingBox();
    await page.getByRole('button', { name: 'Lower' }).click();
    await expect(box).toBeFocused();
    await expectAttached();
    expect(((await floating.boundingBox())?.y ?? 0) - (before?.y ?? 0)).toBeGreaterThan(140);
    await page.getByRole('button', { name: 'Narrow' }).click();
    await expectAttached();
    await page.setViewportSize({ width: 700, height: 700 });
    await expectAttached();
    // Scrolled out of the window, the range has nothing to show the toolbar with; scrolled back,
    // it does again.
    const { top } = await selectedRect();
    await page.evaluate((offset) => window.scrollBy(0, offset), top + 400);
    await expect(floating).toHaveCount(0);
    await page.evaluate((offset) => window.scrollBy(0, -offset), top + 400);
    await expectAttached();
  });
});
