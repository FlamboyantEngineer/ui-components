import { expect, matrixCell, test } from './fixtures.js';

test.describe('Math Preview lab', () => {
  test('UIC-MATH-PREVIEW-1.1 UIC-MATH-PREVIEW-1.2 typesets every state inline and as display math', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    for (const display of ['inline', 'display']) {
      const preview = (source: string) =>
        matrixCell(page, { display, source }).locator('.ui-math-preview');
      await expect(preview('valid')).toHaveAttribute('data-status', 'ready');
      await expect(preview('valid')).toHaveAttribute('data-display', display);
      const math = preview('valid').locator('math');
      if (display === 'display') await expect(math).toHaveAttribute('display', 'block');
      else await expect(math).not.toHaveAttribute('display', 'block');
      await expect(preview('invalid')).toHaveAttribute('data-status', 'invalid');
      await expect(preview('invalid').locator('.ui-math-preview__source')).toHaveText('\\frac{1}{');
      await expect(preview('empty')).toHaveAttribute('data-status', 'empty');
      await expect(preview('too long').locator('.ui-math-preview__error')).toContainText('10');
    }
    const inline = await page
      .locator('[data-lab-demo="inline"] .ui-math-preview')
      .first()
      .boundingBox();
    expect(inline?.height).toBeLessThan(40);
    await lab.expectAccessible();
  });

  test('UIC-MATH-PREVIEW-1.4 renders nothing active from untrusted source', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="untrusted"]');
    await expect(demo.locator('.ui-math-preview')).toHaveCount(4);
    await expect(demo.locator('a, [href], [style], [onclick]')).toHaveCount(0);
    await expect(demo.locator('[mathcolor="red"]').first()).toBeAttached();
  });

  test('UIC-MATH-PREVIEW-2.1 UIC-MATH-PREVIEW-2.2 previews while typing, commits on blur and restores on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="field"]');
    const input = demo.getByRole('textbox', { name: 'Equation' });
    const root = demo.locator('.ui-math-field');
    await expect(root).toHaveAttribute('data-status', 'ready');
    await input.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' + \\frac{');
    await expect(root).toHaveAttribute('data-status', 'invalid');
    await expect(demo.locator('.ui-math-field__status')).not.toBeEmpty();
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('\\int_0^1 x^2 \\, dx = \\frac{1}{3}');
    await expect(root).toHaveAttribute('data-status', 'ready');
    await page.keyboard.type(' + 1');
    await page.getByRole('heading', { name: 'Math field' }).click();
    await expect(demo.locator('[data-lab-output="Committed source"]')).toHaveText(
      '\\int_0^1 x^2 \\, dx = \\frac{1}{3} + 1',
    );
  });

  test('UIC-MATH-PREVIEW-1.3 keeps the last math shown, marked stale, while newer source typesets', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="slow"]');
    const preview = demo.locator('.ui-math-preview');
    await expect(preview).toHaveAttribute('data-status', 'ready');
    await demo.getByRole('textbox', { name: 'Slow renderer' }).click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' = c^2');
    await expect(preview).toHaveAttribute('data-stale', 'true');
    await expect(preview.locator('math')).toBeAttached();
    await expect(preview).not.toHaveAttribute('data-stale');
    await expect(preview.locator('math')).toContainText('c');
  });

  test('UIC-MATH-PREVIEW-3.1 UIC-MATH-PREVIEW-3.2 typesets to an element without React', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="element"]');
    const valid = demo.locator('li').first();
    await expect(valid.locator('math mi').first()).toHaveText('e');
    expect(await valid.locator('math').evaluate((math) => math.namespaceURI)).toBe(
      'http://www.w3.org/1998/Math/MathML',
    );
    await expect(demo.locator('li').nth(1)).toContainText('Unexpected end of input');
    await expect(demo.locator('li').nth(1).locator('math')).toHaveCount(0);
  });

  test('UIC-MATH-PREVIEW-2.3 edits inline math in place, submitting on Enter and cancelling on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="in-place"]');
    await demo.getByRole('button', { name: 'Edit formula' }).click();
    const editor = demo.getByRole('textbox', { name: 'Formula' });
    await expect(editor).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.type(' h');
    await page.keyboard.press('Enter');
    const edit = demo.getByRole('button', { name: 'Edit formula' });
    await expect(edit).toBeFocused();
    await expect(edit.locator('annotation')).toHaveText(String.raw`\pi r^2 h`);
    await edit.press('Enter');
    await page.keyboard.type('x');
    await page.keyboard.press('Escape');
    await expect(edit.locator('annotation')).toHaveText(String.raw`\pi r^2 h`);
    await lab.expectAccessible('[data-lab-demo="in-place"]');
  });
});
