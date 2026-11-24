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

  test('UIC-MATH-PREVIEW-1.2 scrolls math wider than its box inside the box', async ({
    page,
    lab,
  }) => {
    await lab.open('math-preview');
    for (const display of ['inline', 'display']) {
      const cell = matrixCell(page, { source: 'long sum', display });
      const frame = cell.locator(':scope > div');
      const math = cell.locator('.ui-math-preview__math');
      await expect(math.locator('math')).toBeVisible();
      // The lab's frame grows to fit its math, so the test narrows it to a box the math overflows.
      await frame.evaluate((element: HTMLElement) => {
        element.style.minWidth = '0';
        element.style.width = '200px';
      });
      await expect(math).toHaveAttribute('data-overflowing', 'true');
      const frameBox = await frame.boundingBox();
      const mathBox = await math.boundingBox();
      expect(mathBox && frameBox && mathBox.x + mathBox.width).toBeLessThanOrEqual(
        (frameBox?.x ?? 0) + (frameBox?.width ?? 0) + 0.5,
      );
      expect(await math.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true,
      );
      await expect(math).toHaveAttribute('tabindex', '0');
      await expect(math).toHaveAttribute('data-overflowing', 'true');
    }
  });

  test('UIC-MATH-PREVIEW-4.1 UIC-MATH-PREVIEW-4.2 UIC-CLIPBOARD-1.8 copies an equation, its source and its drawing', async ({
    page,
    lab,
    baseURL,
  }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL ?? 'http://127.0.0.1/').origin,
    });
    await lab.open('math-preview');
    const demo = page.locator('[data-lab-demo="copy"]');
    const result = demo.locator('[data-lab-output="Copy result"]');
    const read = () =>
      page.evaluate(async () => {
        const formats: Record<string, string> = {};
        for (const item of await navigator.clipboard.read())
          for (const type of item.types) {
            const blob = await item.getType(type);
            if (type !== 'image/png') formats[type] = await blob.text();
            else {
              const image = await createImageBitmap(blob);
              const ink = new OffscreenCanvas(image.width, image.height).getContext('2d');
              ink?.drawImage(image, 0, 0);
              const pixels = ink?.getImageData(0, 0, image.width, image.height).data ?? [];
              let dark = 0;
              for (let index = 3; index < pixels.length; index += 4)
                if ((pixels[index] ?? 0) > 200 && (pixels[index - 1] ?? 255) < 60) dark += 1;
              formats[type] =
                `${String(image.width)}x${String(image.height)} inked ${String(dark > 20)}`;
            }
          }
        return formats;
      });
    await demo.getByRole('button', { name: 'Copy equation' }).click();
    await expect(result).toHaveText('equation: rich');
    const equation = await read();
    expect(equation['text/plain']).toMatch(
      /^<math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"/,
    );
    expect(equation['text/plain']).toContain(
      '<annotation encoding="application/x-tex">\\frac{a}{b}</annotation>',
    );
    expect(equation['text/html']).toContain('<mfrac>');
    await demo.getByRole('button', { name: 'Copy LaTeX' }).click();
    await expect(result).toHaveText('source: true');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('\\frac{a}{b}');
    await demo.getByRole('button', { name: 'Copy as image' }).click();
    await expect(result).toHaveText('image: true');
    const image = await read();
    expect(image['image/png']).toBe('48x64 inked true');
    expect(image['text/html']).toMatch(
      /<img src="data:image\/png;base64,[^"]+" width="24" height="32"/,
    );
  });
});
