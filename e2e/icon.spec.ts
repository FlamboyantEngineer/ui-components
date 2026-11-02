import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Icon lab', () => {
  test('UIC-ICON-1.1 UIC-ICON-1.2 draws every glyph in three box sizes', async ({ page, lab }) => {
    await lab.open('icon');
    const cells = page.locator('table[data-lab-matrix="glyph size"] td[data-lab-cell]');
    const rows = await page.locator('table[data-lab-matrix="glyph size"] tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(26);
    expect(await cells.count()).toBe(rows * 3);
    for (const [size, pixels] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const box = await matrixCell(page, `glyph=close size=${size}`)
        .locator(`.ui-icon`)
        .boundingBox();
      expect(box?.width).toBe(pixels);
      expect(box?.height).toBe(pixels);
      const glyph = await matrixCell(page, `glyph=close size=${size}`)
        .locator(`.ui-icon__glyph`)
        .boundingBox();
      expect(glyph?.width).toBe(pixels);
    }
  });

  test('UIC-ICON-1.3 exposes only labelled icons to assistive technology', async ({
    page,
    lab,
  }) => {
    await lab.open('icon');
    const labelled = matrixCell(page, 'source=glyph naming=labelled size=md');
    await expect(labelled.getByRole('img', { name: 'Information' })).toBeVisible();
    const decorative = page.locator(
      `${cellSelector('source=glyph naming=decorative size=md')} .ui-icon`,
    );
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await lab.expectAccessible();
  });

  test('UIC-ICON-1.5 sizes an inherited icon from the surrounding font', async ({ page, lab }) => {
    await lab.open('icon');
    for (const fontSize of [12, 16, 24]) {
      const icon = matrixCell(page, `fontSize=${fontSize} glyph=info`).locator(`.ui-icon`);
      await expect(icon).toHaveAttribute('data-size', 'inherit');
      const box = await icon.boundingBox();
      expect(box?.width).toBe(fontSize);
      expect(box?.height).toBe(fontSize);
    }
  });

  test('UIC-ICON-1.2 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('icon', { stylesheet: 'none' });
    await expect(page.locator('.ui-icon').first()).toBeVisible();
  });

  test('UIC-PROVIDER-2.1 keeps the dots of the help, info, error and warning glyphs at small sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('icon');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme,
      );
      const inks = await page.locator('[data-lab-dots] svg').evaluateAll(async (glyphs) => {
        /** The alpha channel of `glyph` drawn at its device size, with its path data `d`. */
        const draw = async (glyph: Element, d: string, width: number) => {
          const clone = glyph.cloneNode(true) as Element;
          clone.setAttribute('width', String(width));
          clone.setAttribute('height', String(width));
          clone.setAttribute('stroke', getComputedStyle(glyph).color);
          clone.querySelector('path')?.setAttribute('d', d);
          const image = new Image();
          image.src = 'data:image/svg+xml,' + encodeURIComponent(clone.outerHTML);
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = width;
          const context = canvas.getContext('2d') as CanvasRenderingContext2D;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, width, width).data;
        };
        const results: Array<{ glyph: string; size: number; ink: number }> = [];
        for (const glyph of glyphs) {
          const d = glyph.querySelector('path')?.getAttribute('d') ?? '';
          // Each of these glyphs draws its dot as its last subpath.
          const withoutDot = d.slice(0, Math.max(d.lastIndexOf('M'), d.lastIndexOf('m')));
          const width = Math.round(glyph.getBoundingClientRect().width * window.devicePixelRatio);
          const [full, bare] = await Promise.all([
            draw(glyph, d, width),
            draw(glyph, withoutDot, width),
          ]);
          let ink = 0;
          for (let index = 3; index < full.length; index += 4) {
            ink = Math.max(ink, (full[index] ?? 0) - (bare[index] ?? 0));
          }
          const name = glyph.closest('[data-glyph]')?.getAttribute('data-glyph') ?? '';
          results.push({ glyph: name, size: width, ink });
        }
        return results;
      });
      expect(inks).toHaveLength(12);
      for (const { glyph, size, ink } of inks)
        expect(ink, `${theme} ${glyph} at ${size}px`).toBeGreaterThan(48);
    }
  });
});

test('UIC-ICON-1.1 passes each icon source through toIconProps', async ({ page, lab }) => {
  await lab.open('icon');
  const row = (name: string) =>
    page.locator(`[data-lab-case="icon-sources"] [data-lab-source="${name}"]`);
  await expect(row('component').locator('[data-lab-output="props"]')).toHaveText('icon: component');
  await expect(row('component').getByRole('img', { name: 'Icon from component' })).toHaveAttribute(
    'data-glyph',
    'check',
  );
  await expect(row('element').locator('[data-lab-output="props"]')).toHaveText('children: element');
  await expect(row('element').locator('.ui-icon rect')).toHaveCount(1);
  for (const name of ['null', 'undefined', 'false']) {
    await expect(row(name).locator('[data-lab-output="props"]')).toHaveText(`children: ${name}`);
    await expect(row(name).locator('.ui-icon')).toHaveCount(0);
  }
  await lab.expectAccessible();
});
