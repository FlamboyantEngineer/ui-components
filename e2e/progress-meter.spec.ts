import { expect, test } from './fixtures.js';

test.describe('ProgressBar meter mode', () => {
  test('UIC-PROGRESS-BAR-21.1 UIC-PROGRESS-BAR-21.5 UIC-PROGRESS-BAR-22.1 draws named meters with 4, 6 and 8 pixel tracks', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cells = page
      .locator('[data-lab-family="progress-meter-cases"]')
      .locator('table[data-lab-matrix="value size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 3);
    for (const [size, height] of [
      ['sm', 4],
      ['md', 6],
      ['lg', 8],
    ] as const) {
      const cell = page
        .locator('[data-lab-family="progress-meter-cases"]')
        .locator(`[data-lab-cell="value=40 size=${size}"]`);
      const meter = cell.getByRole('meter', { name: 'Storage' });
      await expect(meter).toHaveAttribute('aria-valuenow', '40');
      await expect(meter).toHaveAttribute('aria-valuetext', '40%');
      const track = await cell.locator('.ui-progress-bar__track').boundingBox();
      expect(track?.height).toBe(height);
    }
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-21.2 UIC-PROGRESS-BAR-21.3 fills to the value and words it', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const partial = page
      .locator('[data-lab-family="progress-meter-cases"]')
      .locator('[data-lab-cell="value=40 size=md"]');
    const track = await partial.locator('.ui-progress-bar__track').boundingBox();
    const fill = await partial.locator('.ui-progress-bar__fill').boundingBox();
    expect(Math.round(((fill?.width ?? 0) / (track?.width ?? 1)) * 100)).toBe(40);
    await expect(partial.locator('.ui-progress-bar__value')).toHaveText('40%');
    const option = (name: string) =>
      page
        .locator('[data-lab-family="progress-meter-cases"]')
        .locator(`[data-lab-cell="option=${name}"]`);
    await expect(option('unit').locator('.ui-progress-bar__value')).toHaveText('40 GB');
    await expect(option('value label').getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      '40 of 100 photos',
    );
    await expect(option('value hidden').locator('.ui-progress-bar__value')).toHaveCount(0);
    await expect(option('aria-label only').getByRole('meter', { name: 'Storage' })).toBeVisible();
    await expect(option('aria-label only').locator('.ui-progress-bar__label')).toHaveCount(0);
  });

  test('UIC-PROGRESS-BAR-21.6 UIC-PROGRESS-BAR-21.7 colours each tone and judges thresholds', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const fillColour = (cell: string) =>
      page
        .locator('[data-lab-family="progress-meter-cases"]')
        .locator(`[data-lab-cell="${cell}"] .ui-progress-bar__fill`)
        .evaluate((node) => getComputedStyle(node).backgroundColor);
    const tones = ['neutral', 'success', 'warning', 'danger'];
    const colours = await Promise.all(tones.map((tone) => fillColour(`tone=${tone}`)));
    expect(new Set(colours).size).toBe(4);
    const judged = {
      'optimum=low is best value=10': 'success',
      'optimum=low is best value=90': 'danger',
      'optimum=high is best value=10': 'danger',
      'optimum=high is best value=90': 'success',
      'optimum=middle is best value=10': 'warning',
      'optimum=middle is best value=55': 'success',
    };
    for (const [cell, tone] of Object.entries(judged)) {
      await expect(
        page
          .locator('[data-lab-family="progress-meter-cases"]')
          .locator(`[data-lab-cell="${cell}"] .ui-progress-bar`),
      ).toHaveAttribute('data-tone', tone);
      expect(await fillColour(cell)).toBe(colours[tones.indexOf(tone)]);
    }
  });

  test('UIC-PROGRESS-BAR-21.7 UIC-PROGRESS-BAR-22.2 changes tone as a stepped value crosses thresholds', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const demo = page
      .locator('[data-lab-family="progress-meter-cases"]')
      .locator('[data-lab-demo="disk"]');
    const meter = demo.getByRole('meter', { name: 'Disk used' });
    const use = demo.getByRole('button', { name: 'Use 10 GB' });
    await expect(meter).toHaveAttribute('data-tone', 'success');
    await use.click();
    await use.click();
    await expect(meter).toHaveAttribute('aria-valuetext', '70 of 100 GB');
    await expect(meter).toHaveAttribute('data-tone', 'warning');
    await use.click();
    await use.click();
    await expect(meter).toHaveAttribute('data-tone', 'danger');
    await expect(demo.locator('.ui-progress-bar__value')).toHaveText('90 of 100 GB');
    // The meter is output only: Tab moves from the page to the first button, past the meter.
    await meter.click();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'Free 10 GB' })).toBeFocused();
    await lab.expectAccessible();
  });
});
