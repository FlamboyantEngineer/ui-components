import { toCollectionKey } from '../src/utils/to-collection-key.js';
import type { Page } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function spreadsheet(page: Page) {
  const root = page.locator('[data-lab-demo="spreadsheet"]');
  const grid = root.getByRole('grid', { name: 'Fruit order' });
  return {
    root,
    reference: root.getByRole('textbox', { name: 'Cell reference' }),
    content: root.getByRole('textbox', { name: 'Cell content' }),
    result: root.locator('.ui-formula-bar__result'),
    output: root.locator('[data-lab-output]'),
    cell: (row: number, column: string) =>
      grid.locator(`[data-key="${toCollectionKey(`row-${row}`)}"] > [data-column="${column}"]`),
  };
}

test.describe('Formula Bar lab', () => {
  test('UIC-FORMULA-BAR-2.1 UIC-FORMULA-BAR-3.1 UIC-FORMULA-BAR-3.3 follows the selected cell', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await expect(sheet.reference).toHaveValue('D2');
    await expect(sheet.content).toHaveValue('=B2*C2');
    await expect(sheet.result).toHaveText('Result 2');
    await expect(sheet.root.locator('.ui-code-editor__token[data-token="key"]')).toHaveText([
      'B2',
      'C2',
    ]);
    await expect(sheet.cell(2, 'D')).toHaveText('2');
    await sheet.cell(3, 'B').click();
    await expect(sheet.reference).toHaveValue('B3');
    await expect(sheet.content).toHaveValue('6');
    await sheet.cell(6, 'D').click();
    await expect(sheet.content).toHaveValue('=SUM(D2:D5)');
    await expect(sheet.result).toHaveText('Result 13.4');
    const bar = requireDefined(await sheet.root.locator('.ui-formula-bar').boundingBox());
    const grid = requireDefined(await sheet.root.getByRole('grid').boundingBox());
    expect(bar.y + bar.height).toBeLessThanOrEqual(grid.y + 1);
  });

  test('UIC-FORMULA-BAR-2.2 moves to a typed reference and refuses others', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.reference.click();
    await page.keyboard.type('c4');
    await page.keyboard.press('Enter');
    await expect(sheet.reference).toHaveValue('C4');
    await expect(sheet.content).toHaveValue('0.2');
    await expect(sheet.cell(4, 'C')).toHaveAttribute('data-in-range', 'true');
    await expect(sheet.reference).toBeFocused();
    await page.keyboard.type('E9');
    await page.keyboard.press('Enter');
    await expect(sheet.reference).toHaveAttribute('aria-invalid', 'true');
    await expect(sheet.root.locator('.ui-formula-bar__status')).toHaveText('No cell named E9');
    await page.keyboard.press('Escape');
    await expect(sheet.reference).toHaveValue('C4');
    await expect(sheet.reference).not.toHaveAttribute('aria-invalid');
  });

  test('UIC-FORMULA-BAR-2.2 keeps reference Enter from submitting a form', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const form = page.locator('[data-lab-demo="form"]');
    const reference = form.getByRole('textbox', { name: 'Cell reference' });
    await reference.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('b2');
    await page.keyboard.press('Enter');
    await expect(reference).toHaveValue('B2');
    await page.keyboard.type('Z9');
    await page.keyboard.press('Enter');
    await expect(reference).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('[data-lab-output]')).toHaveText('Submitted 0 times');
    await form.getByRole('button', { name: 'Submit the form' }).click();
    await expect(form.locator('[data-lab-output]')).toHaveText('Submitted 1 times');
  });

  test('UIC-FORMULA-BAR-3.2 commits with Enter and restores with Escape', async ({ page, lab }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await expect(sheet.root.locator('.ui-formula-bar')).toHaveAttribute('data-dirty', 'true');
    await expect(sheet.result).toHaveText('Result 3');
    await expect(sheet.cell(2, 'D')).toHaveText('2');
    await page.keyboard.press('Enter');
    await expect(sheet.output).toHaveText('Last commit: D2 = =B2*C2+1');
    await expect(sheet.cell(2, 'D')).toHaveText('3');
    await expect(sheet.cell(6, 'D')).toHaveText('14.4');
    await expect(sheet.root.locator('.ui-formula-bar')).not.toHaveAttribute('data-dirty');
    await page.keyboard.type('0');
    await page.keyboard.press('Escape');
    await expect(sheet.content).toHaveValue('=B2*C2+1');
    await page.keyboard.type('0');
    await sheet.root.getByRole('button', { name: 'Cancel' }).click();
    await expect(sheet.content).toHaveValue('=B2*C2+1');
  });

  test('UIC-FORMULA-BAR-3.2 keeps a draft uncommitted while the bar is locked', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    const confirm = sheet.root.getByRole('button', { name: 'Confirm' });
    const lock = sheet.root.getByRole('checkbox', { name: 'Lock the bar' });
    await lock.check();
    await expect(confirm).toBeDisabled();
    await expect(sheet.root.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(sheet.output).toHaveText('Last commit: none');
    await lock.uncheck();
    await expect(sheet.content).toHaveValue('=B2*C2+1');
    await confirm.click();
    await expect(sheet.output).toHaveText('Last commit: D2 = =B2*C2+1');
  });

  test('UIC-FORMULA-BAR-3.1 discards a draft left behind when another cell is selected', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await sheet.cell(3, 'B').click();
    await expect(sheet.content).toHaveValue('6');
    await sheet.cell(2, 'D').click();
    await expect(sheet.content).toHaveValue('=B2*C2');
    await expect(sheet.root.locator('.ui-formula-bar')).not.toHaveAttribute('data-dirty');
  });

  test('UIC-FORMULA-BAR-3.5 inserts a function from the fₓ list into the draft', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.cell(5, 'C').click();
    await expect(sheet.content).toHaveValue('1.5');
    await sheet.content.click();
    await page.keyboard.press('Control+a');
    const fx = sheet.root.getByRole('button', { name: 'Insert function' });
    await fx.click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([/^SUM/, /^AVERAGE/, /^MIN/, /^MAX/]);
    await menu.getByRole('menuitem', { name: /^MAX/ }).click();
    // The call wraps the selection, focus is back in the content inside the brackets, and nothing
    // is committed yet.
    await expect(sheet.content).toHaveValue('MAX(1.5)');
    await expect(sheet.content).toBeFocused();
    await expect(sheet.root.locator('.ui-formula-bar')).toHaveAttribute('data-dirty', 'true');
    await expect(sheet.output).toHaveText('Last commit: none');
    await page.keyboard.type(',2');
    await expect(sheet.content).toHaveValue('MAX(1.5,2)');
    await page.keyboard.press('Escape');
    await expect(sheet.content).toHaveValue('1.5');
    // By keyboard: open the list, pick SUM, and confirm it.
    await page.keyboard.press('End');
    await fx.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(fx).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(sheet.content).toBeFocused();
    await expect(sheet.content).toHaveValue('1.5SUM()');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await fx.click();
    await menu.getByRole('menuitem', { name: /^SUM/ }).click();
    await page.keyboard.type('B2:B5');
    await expect(sheet.content).toHaveValue('=SUM(B2:B5)');
    await page.keyboard.press('Enter');
    await expect(sheet.output).toHaveText('Last commit: C5 = =SUM(B2:B5)');
    await expect(sheet.cell(5, 'C')).toHaveText('25');
  });

  test('UIC-FORMULA-BAR-3.3 lays out every state alike, with no room for an empty result', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const parts = (content: string, mode: string) =>
      matrixCell(page, `content=${content} mode=${mode}`)
        .locator('.ui-formula-bar')
        .evaluate((bar) => {
          const box = (element: Element | null) => element?.getBoundingClientRect() ?? null;
          const own = bar.getBoundingClientRect();
          const editor = bar.querySelector('.ui-formula-bar__editor');
          return {
            bar: { left: own.left, right: own.right },
            children: [...bar.children]
              .filter((child) => getComputedStyle(child).position !== 'absolute')
              .map((child) => {
                const rect = child.getBoundingClientRect();
                return { left: rect.left, right: rect.right };
              }),
            editor: box(editor),
            editorBorder: editor ? getComputedStyle(editor).borderTopColor : '',
            result: box(bar.querySelector('.ui-formula-bar__result')),
          };
        });
    const contents = ['formula', 'text', 'empty', 'no cell'];
    const modes = ['editable', 'evaluated', 'read-only', 'disabled'];
    const editable = await parts('empty', 'editable');
    for (const content of contents) {
      for (const mode of modes) {
        const bar = await parts(content, mode);
        const where = `${content}, ${mode}`;
        // Every part stays inside its bar, which is as wide as every other.
        for (const child of bar.children) {
          expect(child.left, where).toBeGreaterThanOrEqual(bar.bar.left);
          expect(child.right, where).toBeLessThanOrEqual(bar.bar.right + 0.5);
        }
        expect(bar.bar.right - bar.bar.left, where).toBeCloseTo(
          editable.bar.right - editable.bar.left,
          0,
        );
        if (mode !== 'read-only') {
          // An untouched content draws no dirty frame.
          expect(bar.editorBorder, where).toBe(editable.editorBorder);
        }
      }
    }
    // An empty cell's evaluation draws no result: its content is as wide as without evaluation.
    const empty = await parts('empty', 'evaluated');
    expect(empty.result).toBeNull();
    expect(requireDefined(empty.editor).width).toBeCloseTo(
      requireDefined(editable.editor).width,
      0,
    );
    const formula = await parts('formula', 'evaluated');
    expect(requireDefined(formula.result).left).toBeGreaterThanOrEqual(
      requireDefined(formula.editor).right,
    );
  });

  test('UIC-FORMULA-BAR-3.2 UIC-FORMULA-BAR-3.4 confirms and cancels in the actions demo, by button and key', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const root = page.locator('[data-lab-demo="actions"]');
    const content = root.getByRole('textbox', { name: 'Cell content' });
    const cancel = root.getByRole('button', { name: 'Cancel' });
    const confirm = root.getByRole('button', { name: 'Confirm' });
    const saved = root.locator('[data-lab-output="saved"]');
    const draft = root.locator('[data-lab-output="draft"]');
    const counts = root.locator('[data-lab-output="counts"]');
    // No pending edit: both buttons are off.
    await expect(cancel).toBeDisabled();
    await expect(confirm).toBeDisabled();
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('5');
    await expect(draft).toHaveText('0.55');
    await expect(cancel).toBeEnabled();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(saved).toHaveText('0.55');
    await expect(draft).toHaveText('none');
    await expect(counts).toHaveText('1 committed, 0 cancelled');
    await expect(confirm).toBeDisabled();
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('9');
    await cancel.click();
    await expect(content).toHaveValue('0.55');
    await expect(saved).toHaveText('0.55');
    await expect(counts).toHaveText('1 committed, 1 cancelled');
    // Without the buttons, Enter and Escape do the same.
    await root.getByText('Show Cancel and Confirm').click();
    await expect(cancel).toHaveCount(0);
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('1');
    await page.keyboard.press('Escape');
    await expect(content).toHaveValue('0.55');
    await page.keyboard.press('End');
    await page.keyboard.type('2');
    await page.keyboard.press('Enter');
    await expect(saved).toHaveText('0.552');
    await expect(counts).toHaveText('2 committed, 2 cancelled');
    await expect(content).toBeFocused();
  });

  test('UIC-FORMULA-BAR-3.6 sizes the whole bar and keeps every size working', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const heights = { xs: 20, sm: 24, md: 28, lg: 32 };
    for (const [size, height] of Object.entries(heights)) {
      for (const layout of ['buttons, 360px', 'keys only, 360px', 'buttons, 280px']) {
        const bar = page.getByRole('group', { name: `Formula bar, ${size}, ${layout}` });
        const boxes = await bar.evaluate((node) => {
          const rect = (element: Element | null) => {
            const box = element?.getBoundingClientRect();
            return box ? { left: box.left, right: box.right, height: box.height } : null;
          };
          return {
            bar: rect(node),
            reference: rect(node.querySelector('.ui-formula-bar__reference')),
            editor: rect(node.querySelector('.ui-formula-bar__editor')),
            // The laid-out parts, leaving out the absolutely placed status and hidden hint.
            parts: [...node.children]
              .filter((child) => getComputedStyle(child).position !== 'absolute')
              .map(rect),
          };
        });
        expect(boxes.reference?.height).toBeCloseTo(height, 0);
        expect(boxes.editor?.height).toBeCloseTo(height, 0);
        // The parts run in order without overlap, inside the bar.
        const parts = boxes.parts.filter((part) => part && part.right - part.left > 1);
        for (const [index, part] of parts.entries()) {
          const next = parts[index + 1];
          if (next && part) expect(part.right).toBeLessThanOrEqual(next.left + 0.5);
        }
        expect(parts.at(-1)?.right ?? 0).toBeLessThanOrEqual((boxes.bar?.right ?? 0) + 0.5);
      }
    }
    // The smallest bar still inserts a function and commits it.
    const bar = page.getByRole('group', { name: 'Formula bar, xs, buttons, 360px' });
    const content = bar.getByRole('textbox', { name: 'Cell content' });
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+');
    await bar.getByRole('button', { name: 'Insert function' }).click();
    await page.getByRole('menuitem', { name: /^SUM/ }).click();
    await expect(content).toHaveValue('=B2*C2+SUM()');
    await bar.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.locator('[data-lab-output="size-xs"]').first()).toHaveText(
      'Saved =B2*C2+SUM()',
    );
  });

  test('UIC-FORMULA-BAR-4.1 passes axe', async ({ page, lab }) => {
    await lab.open('formula-bar');
    await expect(page.getByRole('grid', { name: 'Fruit order' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FORMULA-BAR-3.4 drops the buttons and their room, and commits and cancels by key', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const withButtons = page.locator(
      `${cellSelector('width=320px actions=buttons')} .ui-formula-bar`,
    );
    const keysOnly = page.locator(
      `${cellSelector('width=320px actions=keys only')} .ui-formula-bar`,
    );
    await expect(withButtons.locator('.ui-formula-bar__confirm')).toBeVisible();
    await expect(keysOnly.locator('button')).toHaveCount(0);
    const editorWidth = async (bar: typeof keysOnly) =>
      requireDefined(await bar.locator('.ui-formula-bar__editor').boundingBox()).width;
    // The editor takes the room the buttons left.
    expect(await editorWidth(keysOnly)).toBeGreaterThan((await editorWidth(withButtons)) + 40);
    const content = keysOnly.getByRole('textbox', { name: 'Cell content' });
    await expect(content).toHaveAccessibleDescription(/Enter confirms, Escape cancels\./);
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await expect(keysOnly).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Escape');
    await expect(keysOnly).not.toHaveAttribute('data-dirty');
  });
});
