import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Code Editor lab coverage', () => {
  test('UIC-CODE-EDITOR-3.1 UIC-CODE-EDITOR-3.5 keeps marks, tips and F8 without the problem list', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const area = demo(page, 'list-diagnostics');
    const input = area.getByRole('textbox', { name: 'Source without a problem list' });
    await expect(output(page, 'list-diagnostics')).toHaveText('listDiagnostics: false');
    await expect(area.locator('.ui-code-editor__diagnostic')).toHaveCount(0);
    // The warning marks its whole first line; the error marks its range.
    await expect(area.locator('.ui-code-editor__mark')).toHaveText([
      'let',
      ' basket = ',
      '"apples"',
      'baskit',
    ]);
    await input.click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('F8');
    await expect(area.locator('.ui-code-editor__announcement')).toHaveText(/Unknown name "baskit"/);
    await expect(page.getByRole('tooltip')).toHaveText(/Unknown name "baskit"/);
    await page.keyboard.press('Shift+F8');
    await expect(area.locator('.ui-code-editor__announcement')).toHaveText(
      'Prefer const for values never reassigned.',
    );
    await page.keyboard.press('Escape');
    await area.getByRole('button', { name: 'List the problems' }).click();
    await expect(output(page, 'list-diagnostics')).toHaveText('listDiagnostics: true');
    await expect(area.locator('.ui-code-editor__diagnostic')).toHaveCount(2);
    await lab.expectAccessible('[data-lab-demo="list-diagnostics"]');
  });

  test('UIC-CODE-EDITOR-3.2 marks a source invalid with an error described from outside', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const input = demo(page, 'invalid').getByRole('textbox', { name: 'Order settings' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Add a "count" to the order settings.');
    await expect(demo(page, 'invalid').locator('.ui-code-editor__diagnostic')).toHaveCount(0);
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type(', "count": 2');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(output(page, 'invalid')).toHaveText('The order settings are complete.');
  });

  test('UIC-CODE-EDITOR-1.8 UIC-CODE-EDITOR-1.2 never resizes with resize none and shows the tokenizer helper output', async ({
    page,
    lab,
  }) => {
    await lab.open('code-editor');
    const fixed = page.locator('[data-lab-editor="resize-none"]');
    await expect(fixed).toHaveAttribute('data-resize', 'none');
    await expect(fixed.locator('.ui-code-editor__surface')).toHaveCSS('resize', 'none');
    const helper = demo(page, 'tokenizer');
    await expect(output(page, 'tokens')).toContainText('// "ripe":comment');
    await helper.getByRole('button', { name: 'text' }).click();
    await expect(output(page, 'tokens')).toHaveText('pick 3 from basket // "ripe":plain');
    await helper.getByRole('button', { name: 'Custom syntax' }).click();
    await expect(output(page, 'tokens')).toContainText('pick:keyword');
    await expect(output(page, 'tokens')).toContainText('3:number');
    await expect(output(page, 'tokens')).toContainText('basket:keyword');
    await lab.expectAccessible('[data-lab-demo="tokenizer"]');
  });
});
