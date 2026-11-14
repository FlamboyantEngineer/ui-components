import { requireDefined } from '../src/utils/require-defined.js';
import { expect, matrix, matrixCell, test } from './fixtures.js';

test.describe('Sparkline lab', () => {
  test('UIC-SCALES-1.1 UIC-SCALES-1.3 UIC-SCALES-1.5 UIC-SCALES-2.3 UIC-SCALES-2.4 handles extreme scale domains', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    for (const domain of ['adjacent', 'tiny', 'subnormal', 'wide']) {
      const example = matrix(page, 'sparkline').locator(`[data-lab-scale="${domain}"]`);
      await expect(example.locator('[data-lab-output="positions"]')).toHaveText('0, 100');
      const ticks = example.locator('[data-lab-output="ticks"]');
      await expect(ticks).not.toBeEmpty();
      await expect(ticks).not.toContainText(/NaN|Infinity|∞/);
    }
    await expect(
      matrix(page, 'sparkline').locator('[data-lab-scale="tiny"] [data-lab-output="ticks"]'),
    ).toContainText('E-110');
    await expect(matrix(page, 'sparkline').locator('[data-lab-output="tick-budget"]')).toHaveText(
      '1001',
    );
    await expect(
      matrix(page, 'sparkline').locator('[data-lab-output="calendar-limit"]'),
    ).toHaveText('9999-12-30, 9999-12-31');
    await expect(
      matrix(page, 'sparkline').locator('[data-lab-output="calendar-count"]'),
    ).toHaveText('2026-01-01, 2026-02-01');
  });

  test('UIC-CHART-12.1 UIC-CHART-12.4 UIC-CHART-13.1 draws named lines and areas with markers', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const cells = matrix(page, 'sparkline').locator(
      'table[data-lab-matrix="variant markers"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(2 * 3);
    const area = matrixCell(matrix(page, 'sparkline'), 'variant=area markers=min max last');
    const image = area.getByRole('img', { name: 'Daily sign-ups' });
    await expect(image).toHaveAttribute('data-variant', 'area');
    const box = await image.boundingBox();
    expect([box?.width, box?.height]).toEqual([80, 24]);
    await expect(image.locator('.ui-sparkline__area')).toHaveCount(1);
    await expect(image.locator('.ui-sparkline__marker')).toHaveCount(3);
    const line = matrixCell(matrix(page, 'sparkline'), 'variant=line markers=none').locator(
      '.ui-sparkline__line',
    );
    expect(await line.evaluate((node) => getComputedStyle(node).fill)).toBe('none');
    expect(await line.evaluate((node) => getComputedStyle(node).strokeWidth)).toBe('1.5px');
    await expect(
      matrixCell(matrix(page, 'sparkline'), 'variant=line markers=none').locator(
        '.ui-sparkline__marker',
      ),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-CHART-12.3 UIC-CHART-13.2 breaks at gaps and describes each series', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const gaps = matrixCell(matrix(page, 'sparkline'), 'shape=gaps').locator('.ui-sparkline__line');
    expect((await gaps.getAttribute('d'))?.match(/M/g)).toHaveLength(2);
    await expect(
      matrixCell(matrix(page, 'sparkline'), 'shape=gaps').locator('.ui-sparkline__dot'),
    ).toHaveCount(1);
    const empty = matrixCell(matrix(page, 'sparkline'), 'shape=empty').getByRole('img');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty).toHaveAccessibleDescription('No data');
    await expect(
      matrixCell(matrix(page, 'sparkline'), 'shape=rising').getByRole('img'),
    ).toHaveAccessibleDescription('Low 2, high 11, last 11');
    await expect(
      matrix(page, 'sparkline').locator('[data-lab-demo="percent"]'),
    ).toHaveAccessibleDescription('Low 2.1%, high 4.1%, last 4.1%');
  });

  test('UIC-CHART-12.2 compares rows on a shared range and places scale ticks', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const lastHeight = async (name: string) => {
      const image = page.getByRole('img', { name: `${name} visits this week` });
      const marker = await image.locator('.ui-sparkline__marker').boundingBox();
      const frame = await image.boundingBox();
      return (frame?.y ?? 0) + (frame?.height ?? 0) - (marker?.y ?? 0);
    };
    const [north, south, east] = await Promise.all(['North', 'South', 'East'].map(lastHeight));
    expect(east).toBeGreaterThan(requireDefined(north));
    expect(north).toBeGreaterThan(requireDefined(south));
    const ticks = matrix(page, 'sparkline').locator('[data-lab-demo="ticks"] [data-lab-tick]');
    await expect(ticks).toHaveText(['Feb 2026', 'Mar 2026']);
    await expect(matrix(page, 'sparkline').locator('[data-lab-demo="ticks"] p')).toHaveText(
      'Value ticks: 0, 5, 10, 15, 20, 25, 30',
    );
  });

  test('UIC-CHART-12.1 UIC-CHART-12.2 UIC-CHART-12.3 shows sparse and constant series', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const cell = (shape: string, variant: string) =>
      matrixCell(matrix(page, 'sparkline'), `shape=${shape} variant=${variant}`).getByRole('img');
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

  test('UIC-CHART-12.3 redraws a live random trace and pauses', async ({ page, lab }) => {
    await page.clock.install();
    await lab.open('chart');
    const demo = matrix(page, 'sparkline').locator('[data-lab-demo="random-trace"]');
    const reading = demo.locator('[data-lab-output="reading"]');
    const line = demo.locator('.ui-sparkline__line');
    await page.clock.runFor(2_000);
    await expect(reading).toHaveText(/^Current value \d+$/);
    const drawn = await line.getAttribute('d');
    await page.clock.runFor(1_000);
    await expect(line).not.toHaveAttribute('d', drawn ?? '');
    await demo.getByRole('button', { name: 'Pause trace' }).click();
    await expect(reading).toHaveText('Paused');
    const paused = await line.getAttribute('d');
    await page.clock.runFor(2_000);
    await expect(line).toHaveAttribute('d', paused ?? '');
    await demo.getByRole('button', { name: 'Resume trace' }).click();
    await page.clock.runFor(1_000);
    await expect(line).not.toHaveAttribute('d', paused ?? '');
    await expect(reading).toHaveText(/^Current value \d+$/);
    await lab.expectAccessible();
  });
});
