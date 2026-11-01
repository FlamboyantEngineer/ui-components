import { expect, matrixCell, test } from './fixtures.js';

test.describe('Barcode lab', () => {
  test('UIC-BARCODE-2.1 UIC-BARCODE-2.2 UIC-BARCODE-2.3 UIC-BARCODE-3.1 draws each format with its value and name', async ({
    page,
    lab,
  }) => {
    await lab.open('barcode');
    const expected = [
      ['code128', 'CRATE-42', 'Code 128', 10 + 10 * 11 + 13 + 10],
      ['ean13', '4006381333931', 'EAN-13', 11 + 95 + 7],
      ['upca', '036000291452', 'UPC-A', 9 + 95 + 9],
      ['ean8', '96385074', 'EAN-8', 7 + 67 + 7],
    ] as const;
    for (const [format, text, name, modules] of expected) {
      const hidden = matrixCell(page, `format=${format} value=hidden`).locator('.ui-barcode');
      const shown = matrixCell(page, `format=${format} value=shown`).locator('.ui-barcode');
      await expect(hidden).toHaveAttribute('data-format', format);
      await expect(hidden).toHaveAccessibleName(`${name} barcode: ${text}`);
      await expect(hidden.locator('.ui-barcode__value')).toHaveCount(0);
      await expect(shown.locator('.ui-barcode__value')).toHaveText(text);
      await expect(shown).toHaveAccessibleName(`${name} barcode: ${text}`);
      expect((await hidden.locator('svg').boundingBox())?.width).toBe(modules * 2);
    }
    await lab.expectAccessible();
  });

  test('UIC-BARCODE-2.1 keeps whole-pixel bars and the quiet zones when drawn', async ({
    page,
    lab,
  }) => {
    await lab.open('barcode');
    for (const [cell, width, quiet] of [
      ['moduleWidth=1 quietZone=format minimum', 1, 10],
      ['moduleWidth=2 quietZone=0', 2, 10],
      ['moduleWidth=3 quietZone=15', 3, 15],
    ] as const) {
      const symbol = matrixCell(page, cell).locator('svg');
      // Rasterize the drawn symbol at one device pixel per CSS pixel and read its middle row.
      const runs = await symbol.evaluate(async (svg) => {
        const { width: drawnWidth, height } = svg.getBoundingClientRect();
        const markup = new XMLSerializer().serializeToString(svg);
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = drawnWidth;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context?.drawImage(image, 0, 0, drawnWidth, height);
        const row = context?.getImageData(0, Math.floor(height / 2), drawnWidth, 1).data ?? [];
        const lengths: number[] = [];
        let dark = false;
        for (let x = 0; x < drawnWidth; x += 1) {
          const isDark = (row[x * 4 + 3] ?? 0) > 128 && (row[x * 4] ?? 255) < 128;
          if (x === 0 || isDark !== dark) lengths.push(0);
          dark = isDark;
          lengths[lengths.length - 1] = (lengths.at(-1) ?? 0) + 1;
        }
        return lengths;
      });
      // A light quiet zone at each end, and every bar and space a whole number of modules.
      expect(runs.at(0)).toBe(quiet * width);
      expect(runs.at(-1)).toBe(quiet * width);
      for (const run of runs) expect(run % width).toBe(0);
      expect(Math.max(...runs.slice(1, -1))).toBeLessThanOrEqual(4 * width);
    }
  });

  test('UIC-BARCODE-2.4 UIC-BARCODE-3.1 names invalid values and caller labels', async ({
    page,
    lab,
  }) => {
    await lab.open('barcode');
    const code = (name: string) => matrixCell(page, `case=${name}`).locator('.ui-barcode');
    await expect(code('caller label')).toHaveAccessibleName('Pears, 1 kg');
    await expect(code('caption')).toHaveAccessibleName('Crate 7 label');
    for (const [name, format] of [
      ['checksum', 'EAN-13'],
      ['characters', 'Code 128'],
      ['length', 'UPC-A'],
    ] as const) {
      await expect(code(name)).toHaveAttribute('data-invalid', name);
      await expect(code(name)).toHaveAccessibleName(`This value cannot be encoded in ${format}.`);
      await expect(code(name).locator('svg')).toHaveCount(0);
    }
  });

  test('UIC-BARCODE-1.1 UIC-BARCODE-1.3 encodes a live value and adds or checks the check digit', async ({
    page,
    lab,
  }) => {
    await lab.open('barcode', { theme: 'dark' });
    const demo = page.locator('[data-lab-demo="live"]');
    const code = demo.locator('[data-lab-code="live"]');
    const output = demo.locator('[data-lab-output="symbol"]');
    await expect(output).toHaveText('Shelf B, crate 7, 211 modules, quiet zones 10 and 10');
    await demo.getByRole('radio', { name: 'EAN-13' }).click();
    await expect(code).toHaveAttribute('data-invalid', 'characters');
    const field = demo.getByRole('textbox', { name: 'Value to encode' });
    await field.fill('590123412345');
    await expect(code).toHaveAccessibleName('EAN-13 barcode: 5901234123457');
    await expect(code.locator('.ui-barcode__value')).toHaveText('5901234123457');
    await expect(output).toHaveText('5901234123457, 95 modules, quiet zones 11 and 7');
    await field.fill('5901234123458');
    await expect(output).toHaveText('invalid: checksum');
    await expect(code).toHaveAttribute('data-invalid', 'checksum');
    await lab.expectAccessible('[data-lab-demo="live"]');
  });
});
