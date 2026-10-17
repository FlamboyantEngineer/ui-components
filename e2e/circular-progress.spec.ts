import { expect, test } from './fixtures.js';

test.describe('Circular Progress lab', () => {
  test('UIC-CIRCULAR-PROGRESS-1.1 UIC-CIRCULAR-PROGRESS-1.5 draws named rings in three sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('circular-progress');
    const cells = page.locator('table[data-lab-matrix="state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 3);
    for (const [size, edge] of [
      ['sm', 16],
      ['md', 24],
      ['lg', 32],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="state=42% size=${size}"]`);
      const ring = cell.getByRole('progressbar', { name: 'Completed 42%' });
      await expect(ring).toHaveAttribute('aria-valuenow', '42');
      const box = await cell.locator('.ui-circular-progress__ring').boundingBox();
      expect(box?.width).toBe(edge);
      expect(box?.height).toBe(edge);
    }
  });

  test('UIC-CIRCULAR-PROGRESS-1.2 UIC-CIRCULAR-PROGRESS-1.4 draws the ratio and an unmeasured arc', async ({
    page,
    lab,
  }) => {
    await lab.open('circular-progress');
    for (const [state, offset] of [
      ['0%', '100'],
      ['42%', '58'],
      ['100%', '0'],
    ] as const) {
      await expect(
        page.locator(`[data-lab-cell="state=${state} size=md"] .ui-circular-progress__fill`),
      ).toHaveAttribute('stroke-dashoffset', offset);
    }
    const indeterminate = page
      .locator('[data-lab-cell="state=indeterminate size=md"]')
      .getByRole('progressbar');
    await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    const stroke = await page
      .locator('[data-lab-cell="state=42% size=md"] .ui-circular-progress__fill')
      .evaluate((node) => getComputedStyle(node).strokeWidth);
    expect(stroke).toBe('4px');
  });

  test('UIC-CIRCULAR-PROGRESS-1.5 shows labels and value text beside the ring', async ({
    page,
    lab,
  }) => {
    await lab.open('circular-progress');
    await expect(
      page.locator('[data-lab-cell="option=value label"] .ui-circular-progress__value'),
    ).toHaveText('3 of 4');
    await expect(
      page.locator('[data-lab-cell="option=visible label"]').getByRole('progressbar', {
        name: 'Completed',
      }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-CIRCULAR-PROGRESS-1.7 colours each status and marks a full ring complete', async ({
    page,
    lab,
  }) => {
    await lab.open('circular-progress');
    const ring = (tone: string, progress: string) =>
      page.locator(`[data-lab-cell="tone=${tone} progress=${progress}"] .ui-circular-progress`);
    const stroke = (tone: string, progress: string) =>
      ring(tone, progress)
        .locator('.ui-circular-progress__fill')
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
