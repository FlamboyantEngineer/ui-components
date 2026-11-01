import { expect, matrix, matrixCell, test } from './fixtures.js';

test.describe('ProgressBar circular shape', () => {
  test('UIC-PROGRESS-BAR-11.1 UIC-PROGRESS-BAR-11.5 draws named rings in three sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cells = matrix(page, 'progress-ring-cases').locator(
      'table[data-lab-matrix="state size"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(5 * 3);
    for (const [size, edge] of [
      ['sm', 16],
      ['md', 24],
      ['lg', 32],
    ] as const) {
      const cell = matrixCell(page, `state=42% size=${size}`, { family: 'progress-ring-cases' });
      const ring = cell.getByRole('progressbar', { name: 'Completed 42%' });
      await expect(ring).toHaveAttribute('aria-valuenow', '42');
      const box = await cell.locator('.ui-progress-bar__ring').boundingBox();
      expect(box?.width).toBe(edge);
      expect(box?.height).toBe(edge);
    }
  });

  test('UIC-PROGRESS-BAR-11.2 UIC-PROGRESS-BAR-11.4 draws the ratio and an unmeasured arc', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const fill = (state: string) =>
      matrixCell(page, `state=${state} size=md`, { family: 'progress-ring-cases' }).locator(
        `.ui-progress-bar__fill`,
      );
    for (const [state, offset] of [
      ['0%', '100'],
      ['42%', '58'],
      ['99%', '1'],
    ] as const) {
      await expect(fill(state)).toHaveAttribute('stroke-dashoffset', offset);
    }
    await expect(fill('100%')).not.toHaveAttribute('stroke-dasharray');
    await expect(fill('100%')).not.toHaveAttribute('stroke-dashoffset');
    const indeterminate = matrixCell(page, 'state=indeterminate size=md', {
      family: 'progress-ring-cases',
    }).getByRole('progressbar');
    await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    const stroke = await matrixCell(page, 'state=42% size=md', { family: 'progress-ring-cases' })
      .locator('.ui-progress-bar__fill')
      .evaluate((node) => getComputedStyle(node).strokeWidth);
    expect(stroke).toBe('4px');
  });

  test('UIC-PROGRESS-BAR-11.5 shows labels and value text beside the ring', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    await expect(
      matrixCell(page, 'option=value label', { family: 'progress-ring-cases' }).locator(
        '.ui-progress-bar__value',
      ),
    ).toHaveText('3 of 4');
    await expect(
      matrixCell(page, 'option=visible label', { family: 'progress-ring-cases' }).getByRole(
        'progressbar',
        {
          name: 'Completed',
        },
      ),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-11.7 colours each status and marks a full ring complete', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const ring = (tone: string, progress: string) =>
      matrixCell(page, `tone=${tone} progress=${progress}`, {
        family: 'progress-ring-cases',
      }).locator(`.ui-progress-bar`);
    const stroke = (tone: string, progress: string) =>
      ring(tone, progress)
        .locator('.ui-progress-bar__fill')
        .evaluate((node) => getComputedStyle(node).stroke);
    await expect(ring('warning', '100%')).toHaveAttribute('data-complete', 'true');
    await expect(ring('warning', '60%')).toHaveAttribute('data-tone', 'warning');
    const colours = new Set(
      await Promise.all(
        ['neutral', 'success', 'warning', 'danger'].map((tone) => stroke(tone, '60%')),
      ),
    );
    expect(colours.size).toBe(4);
    await lab.expectAccessible();
  });
});

test('UIC-PROGRESS-BAR-11.4 circular indeterminate arcs rotate around the ring center in every size', async ({
  page,
  lab,
}) => {
  await lab.open('progress-bar');
  for (const size of ['sm', 'md', 'lg']) {
    const root = matrixCell(page, `state=indeterminate size=${size}`, {
      family: 'progress-ring-cases',
    });
    const centers = await root.evaluate((node) => {
      const ring = node.querySelector('.ui-progress-bar__ring');
      const fill = node.querySelector('.ui-progress-bar__fill');
      const animation = ring?.getAnimations()[0];
      if (!ring || !fill || !animation) throw new Error('The ring is not animating.');
      animation.pause();
      return [0, 200, 400, 600].map((time) => {
        animation.currentTime = time;
        const outer = ring.getBoundingClientRect(),
          inner = fill.getBoundingClientRect();
        return {
          x: inner.x + inner.width / 2 - outer.x - outer.width / 2,
          y: inner.y + inner.height / 2 - outer.y - outer.height / 2,
          fillAnimations: fill.getAnimations().length,
        };
      });
    });
    for (const center of centers) {
      expect(center.x).toBeCloseTo(0, 2);
      expect(center.y).toBeCloseTo(0, 2);
      expect(center.fillAnimations).toBe(0);
    }
  }
});

test.describe('ProgressBar circular shape on a dense screen', () => {
  test.use({ deviceScaleFactor: 3 });

  test('UIC-PROGRESS-BAR-11.2 closes a full ring with no seam at the top', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    for (const size of ['md', 'lg']) {
      const ring = matrixCell(page, `state=100% size=${size}`, {
        family: 'progress-ring-cases',
      }).locator('.ui-progress-bar__ring');
      const shot = (await ring.screenshot({ scale: 'device' })).toString('base64');
      // The painted pixels across the top of the stroke, around where the fill starts and ends.
      const row = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) return [];
        context.drawImage(image, 0, 0);
        const y = Math.round((3 / 32) * image.height);
        const pixels = context.getImageData(Math.round(image.width / 2) - 4, y, 9, 1).data;
        return Array.from({ length: 9 }, (_, index) =>
          Array.from(pixels.slice(index * 4, index * 4 + 3)),
        );
      }, shot);
      const first = row[0] ?? [];
      for (const pixel of row) {
        pixel.forEach((channel, index) =>
          expect(Math.abs(channel - (first[index] ?? 0))).toBeLessThanOrEqual(8),
        );
      }
    }
  });
});
