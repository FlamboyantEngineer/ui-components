import { requireDefined } from '../src/utils/require-defined.js';
import { expect, matrixCell, test } from './fixtures.js';

test.describe('Sparkline lab', () => {
  test('UIC-SCALES-1.1 UIC-SCALES-1.3 UIC-SCALES-1.5 UIC-SCALES-2.3 UIC-SCALES-2.4 handles extreme scale domains', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    for (const domain of ['adjacent', 'tiny', 'subnormal', 'wide']) {
      const example = page.locator(`[data-lab-scale="${domain}"]`);
      await expect(example.locator('[data-lab-output="positions"]')).toHaveText('0, 100');
      const ticks = example.locator('[data-lab-output="ticks"]');
      await expect(ticks).not.toBeEmpty();
      await expect(ticks).not.toContainText(/NaN|Infinity|∞/);
    }
    await expect(page.locator('[data-lab-scale="tiny"] [data-lab-output="ticks"]')).toContainText(
      'E-110',
    );
    await expect(page.locator('[data-lab-output="tick-budget"]')).toHaveText('1001');
    await expect(page.locator('[data-lab-output="calendar-limit"]')).toHaveText(
      '9999-12-30, 9999-12-31',
    );
    await expect(page.locator('[data-lab-output="calendar-count"]')).toHaveText(
      '2026-01-01, 2026-02-01',
    );
  });

  test('UIC-SPARKLINE-1.1 UIC-SPARKLINE-1.4 UIC-SPARKLINE-2.1 draws named lines and areas with markers', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    const cells = page.locator('table[data-lab-matrix="variant markers"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 3);
    const area = matrixCell(page, 'variant=area markers=min max last');
    const image = area.getByRole('img', { name: 'Daily sign-ups' });
    await expect(image).toHaveAttribute('data-variant', 'area');
    const box = await image.boundingBox();
    expect([box?.width, box?.height]).toEqual([80, 24]);
    await expect(image.locator('.ui-sparkline__area')).toHaveCount(1);
    await expect(image.locator('.ui-sparkline__marker')).toHaveCount(3);
    const line = matrixCell(page, 'variant=line markers=none').locator('.ui-sparkline__line');
    expect(await line.evaluate((node) => getComputedStyle(node).fill)).toBe('none');
    expect(await line.evaluate((node) => getComputedStyle(node).strokeWidth)).toBe('1.5px');
    await expect(
      matrixCell(page, 'variant=line markers=none').locator('.ui-sparkline__marker'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-SPARKLINE-1.3 UIC-SPARKLINE-2.2 breaks at gaps and describes each series', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    const gaps = matrixCell(page, 'shape=gaps').locator('.ui-sparkline__line');
    expect((await gaps.getAttribute('d'))?.match(/M/g)).toHaveLength(2);
    await expect(matrixCell(page, 'shape=gaps').locator('.ui-sparkline__dot')).toHaveCount(1);
    const empty = matrixCell(page, 'shape=empty').getByRole('img');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty).toHaveAccessibleDescription('No data');
    await expect(matrixCell(page, 'shape=rising').getByRole('img')).toHaveAccessibleDescription(
      'Low 2, high 11, last 11',
    );
    await expect(page.locator('[data-lab-demo="percent"]')).toHaveAccessibleDescription(
      'Low 2.1%, high 4.1%, last 4.1%',
    );
  });

  test('UIC-SPARKLINE-1.2 compares rows on a shared range and places scale ticks', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    const lastHeight = async (name: string) => {
      const image = page.getByRole('img', { name: `${name} visits this week` });
      const marker = await image.locator('.ui-sparkline__marker').boundingBox();
      const frame = await image.boundingBox();
      return (frame?.y ?? 0) + (frame?.height ?? 0) - (marker?.y ?? 0);
    };
    const [north, south, east] = await Promise.all(['North', 'South', 'East'].map(lastHeight));
    expect(east).toBeGreaterThan(requireDefined(north));
    expect(north).toBeGreaterThan(requireDefined(south));
    const ticks = page.locator('[data-lab-demo="ticks"] [data-lab-tick]');
    await expect(ticks).toHaveText(['Feb 2026', 'Mar 2026']);
    await expect(page.locator('[data-lab-demo="ticks"] p')).toHaveText(
      'Value ticks: 0, 5, 10, 15, 20, 25, 30',
    );
  });

  test('UIC-SPARKLINE-1.1 UIC-SPARKLINE-1.2 UIC-SPARKLINE-1.3 shows sparse and constant series', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    const cell = (shape: string, variant: string) =>
      matrixCell(page, `shape=${shape} variant=${variant}`).getByRole('img');
    /** Each visible dot's centre, in the drawing's own coordinates. */
    const dotCentres = (image: ReturnType<typeof cell>) =>
      image.locator('.ui-sparkline__dot').evaluateAll((dots) =>
        dots.map((dot) => {
          const box = (dot as SVGGraphicsElement).getBBox();
          return box.width > 0 && box.height > 0
            ? [box.x + box.width / 2, box.y + box.height / 2]
            : null;
        }),
      );
    const bounds = (image: ReturnType<typeof cell>, part: string) =>
      image.locator(`.ui-sparkline__${part}`).evaluate((node) => {
        const path = node as SVGPathElement;
        const { y, height } = path.getBBox();
        return { top: y, bottom: y + height, length: path.getTotalLength() };
      });

    for (const variant of ['line', 'area']) {
      const single = cell('single', variant);
      await expect(single).not.toHaveAttribute('data-empty');
      expect(await dotCentres(single)).toEqual([[40, 12]]);
      await expect(single.locator('.ui-sparkline__line')).toHaveCount(0);
      expect(await dotCentres(cell('isolated', variant))).toEqual([
        [3, 21],
        [40, 12],
        [77, 3],
      ]);
      await expect(cell('isolated', variant).locator('.ui-sparkline__line')).toHaveCount(0);
    }
    const mixed = cell('mixed', 'line');
    expect(await dotCentres(mixed)).toHaveLength(1);
    expect(
      (await mixed.locator('.ui-sparkline__line').getAttribute('d'))?.match(/M/g),
    ).toHaveLength(2);

    const positive = cell('positive', 'area');
    expect(await bounds(positive, 'line')).toMatchObject({ top: 12, bottom: 12, length: 74 });
    expect(await bounds(positive, 'area')).toMatchObject({ top: 12, bottom: 21 });
    expect(await bounds(cell('negative', 'area'), 'area')).toMatchObject({ top: 3, bottom: 12 });
    const zero = cell('zero', 'area');
    expect(await bounds(zero, 'line')).toMatchObject({ top: 12, bottom: 12, length: 74 });
    expect(await bounds(zero, 'area')).toMatchObject({ top: 12, bottom: 12 });
    await expect(zero).toHaveAccessibleDescription('Low 0, high 0, last 0');
    await lab.expectAccessible();
  });

  test('UIC-SPARKLINE-1.3 traces the measured frame rate live and pauses', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('sparkline');
    const demo = page.locator('[data-lab-demo="frame-rate"]');
    const reading = demo.locator('[data-lab-output="frame rate"]');
    // Frames come every 16 ms of the installed clock: about 60 per second.
    await page.clock.runFor(2_000);
    await expect(reading).toHaveText(/^(59|60|61|62|63) frames per second$/);
    const line = demo.locator('.ui-sparkline__line');
    const drawn = await line.getAttribute('d');
    await page.clock.runFor(1_000);
    await expect(line).not.toHaveAttribute('d', drawn ?? '');
    // A stall longer than a second (a hidden tab) leaves a gap, not a catch-up spike.
    const segments = async () => ((await line.getAttribute('d')) ?? '').split('M').length - 1;
    expect(await segments()).toBe(1);
    await page.clock.fastForward(5_000);
    await page.clock.runFor(1_000);
    await expect.poll(segments).toBe(2);
    await expect(reading).toHaveText(/^(59|60|61|62|63) frames per second$/);
    await demo.getByRole('button', { name: 'Pause trace' }).click();
    await expect(reading).toHaveText('Paused');
    const paused = await line.getAttribute('d');
    await page.clock.runFor(2_000);
    await expect(line).toHaveAttribute('d', paused ?? '');
    await demo.getByRole('button', { name: 'Resume trace' }).click();
    await page.clock.runFor(1_000);
    await expect(reading).toHaveText(/frames per second$/);
    await lab.expectAccessible();
  });
});
