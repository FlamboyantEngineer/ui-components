import { expect, test } from './fixtures.js';

test.describe('ProgressBar circular shape', () => {
  test('UIC-PROGRESS-BAR-11.1 UIC-PROGRESS-BAR-11.5 draws named rings in three sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cells = page
      .locator('[data-lab-family="progress-ring-cases"]')
      .locator('table[data-lab-matrix="state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 3);
    for (const [size, edge] of [
      ['sm', 16],
      ['md', 24],
      ['lg', 32],
    ] as const) {
      const cell = page
        .locator('[data-lab-family="progress-ring-cases"]')
        .locator(`[data-lab-cell="state=42% size=${size}"]`);
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
    for (const [state, offset] of [
      ['0%', '100'],
      ['42%', '58'],
      ['100%', '0'],
    ] as const) {
      await expect(
        page
          .locator('[data-lab-family="progress-ring-cases"]')
          .locator(`[data-lab-cell="state=${state} size=md"] .ui-progress-bar__fill`),
      ).toHaveAttribute('stroke-dashoffset', offset);
    }
    const indeterminate = page
      .locator('[data-lab-family="progress-ring-cases"]')
      .locator('[data-lab-cell="state=indeterminate size=md"]')
      .getByRole('progressbar');
    await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    const stroke = await page
      .locator('[data-lab-family="progress-ring-cases"]')
      .locator('[data-lab-cell="state=42% size=md"] .ui-progress-bar__fill')
      .evaluate((node) => getComputedStyle(node).strokeWidth);
    expect(stroke).toBe('4px');
  });

  test('UIC-PROGRESS-BAR-11.5 shows labels and value text beside the ring', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    await expect(
      page
        .locator('[data-lab-family="progress-ring-cases"]')
        .locator('[data-lab-cell="option=value label"] .ui-progress-bar__value'),
    ).toHaveText('3 of 4');
    await expect(
      page
        .locator('[data-lab-family="progress-ring-cases"]')
        .locator('[data-lab-cell="option=visible label"]')
        .getByRole('progressbar', {
          name: 'Completed',
        }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-11.7 colours each status and marks a full ring complete', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const ring = (tone: string, progress: string) =>
      page
        .locator('[data-lab-family="progress-ring-cases"]')
        .locator(`[data-lab-cell="tone=${tone} progress=${progress}"] .ui-progress-bar`);
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
    const root = page
      .locator('[data-lab-family="progress-ring-cases"]')
      .locator(`[data-lab-cell="state=indeterminate size=${size}"]`);
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
