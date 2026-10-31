import type { Locator } from '@playwright/test';
import { cellSelector, expect, familySelector, test } from './fixtures.js';

const family = familySelector('progress-segment-cases');

/** Each segment's left edge and width, rounded to whole pixels. */
async function segmentBoxes(bar: Locator) {
  return bar.locator('.ui-progress-bar__segment').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    }),
  );
}

test.describe('Progress Bar segments', () => {
  for (const theme of ['light', 'dark']) {
    test(`UIC-PROGRESS-BAR-4.1 UIC-PROGRESS-BAR-4.2 UIC-PROGRESS-BAR-4.3 draws equal segments with a striped current unit (${theme})`, async ({
      page,
      lab,
    }) => {
      await lab.open('progress-bar', { theme });
      const bar = page
        .locator(family)
        .locator(cellSelector('progress=partial size=md'))
        .getByRole('progressbar', { name: 'Stages' });
      await expect(bar).toHaveAttribute('aria-valuenow', '1');
      await expect(bar).toHaveAttribute('aria-valuetext', '1 of 7 done, 14%, Draft in progress');
      await expect(bar.locator('.ui-progress-bar__value')).toHaveText('1/7 · 14%');

      const boxes = await segmentBoxes(bar);
      expect(boxes).toHaveLength(7);
      const widths = new Set(boxes.map((box) => Math.round(box.width)));
      expect(widths.size).toBe(1);
      const styleOf = (state: string) =>
        bar
          .locator(`.ui-progress-bar__segment[data-state="${state}"]`)
          .first()
          .evaluate((node) => {
            const style = getComputedStyle(node);
            return { colour: style.backgroundColor, image: style.backgroundImage };
          });
      const [complete, current, pending] = await Promise.all(
        ['complete', 'current', 'pending'].map(styleOf),
      );
      expect(current?.image).toContain('repeating-linear-gradient');
      expect(complete?.image).toBe('none');
      expect(complete?.colour).not.toBe(pending?.colour);
      await lab.expectAccessible(family);
    });
  }

  test('UIC-PROGRESS-BAR-4.4 UIC-PROGRESS-BAR-4.5 reads aggregate, empty and finished sequences', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cell = (name: string) => page.locator(family).locator(cellSelector(name));
    const aggregate = cell('progress=no current size=md').getByRole('progressbar');
    await expect(aggregate).toHaveAttribute('aria-valuetext', '3 of 7 done, 43%');
    await expect(aggregate.locator('[data-state="current"]')).toHaveCount(0);
    const done = cell('progress=complete size=md').getByRole('progressbar');
    await expect(done).toHaveAttribute('data-complete', 'true');
    const empty = cell('option=empty').getByRole('progressbar');
    await expect(empty).toHaveAttribute('aria-valuetext', '0 of 0 done, 0%');
    await expect(empty).not.toHaveAttribute('data-complete');
    const invalid = cell('option=invalid').getByRole('progressbar');
    await expect(invalid.locator('[data-state="current"]')).toHaveCount(1);
  });

  test('UIC-PROGRESS-BAR-4.8 fits many segments in narrow containers', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const cells = page
      .locator(family)
      .locator('table[data-lab-matrix="count width"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 3);
    for (const cell of await cells.all()) {
      const bar = cell.getByRole('progressbar');
      const root = await bar.boundingBox();
      const track = await bar.locator('.ui-progress-bar__track').boundingBox();
      const label = await bar.locator('.ui-progress-bar__label').boundingBox();
      const value = await bar.locator('.ui-progress-bar__value').boundingBox();
      if (!root || !track || !label || !value) throw new Error('Segmented bar parts are missing');
      expect(track.x + track.width).toBeLessThanOrEqual(root.x + root.width + 0.5);
      expect(Math.abs(label.y - value.y)).toBeLessThan(4);
      const boxes = await segmentBoxes(bar);
      expect(boxes.every((box) => box.width > 0)).toBe(true);
      expect(boxes.at(-1)?.right ?? 0).toBeLessThanOrEqual(track.x + track.width + 0.5);
    }
  });

  test('UIC-PROGRESS-BAR-4.3 moves the current unit as stages finish', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const demo = page.locator(family).locator('[data-lab-demo="segments-step"]');
    const bar = demo.getByRole('progressbar', { name: 'Publishing stages' });
    const finish = demo.getByRole('button', { name: 'Finish stage' });
    await finish.click();
    await expect(bar).toHaveAttribute('aria-valuetext', '2 of 7 done, 29%, Review in progress');
    await expect(bar.locator('.ui-progress-bar__segment').nth(2)).toHaveAttribute(
      'data-state',
      'current',
    );
    for (let step = 0; step < 5; step += 1) await finish.click();
    await expect(bar).toHaveAttribute('aria-valuetext', '7 of 7 done, 100%');
    await expect(bar).toHaveAttribute('data-complete', 'true');
    await expect(finish).toBeDisabled();
  });
});
