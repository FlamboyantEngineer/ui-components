import { expect, test } from './fixtures.js';

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
    const area = page.locator('[data-lab-cell="variant=area markers=min max last"]');
    const image = area.getByRole('img', { name: 'Daily sign-ups' });
    await expect(image).toHaveAttribute('data-variant', 'area');
    const box = await image.boundingBox();
    expect([box?.width, box?.height]).toEqual([80, 24]);
    await expect(image.locator('.ui-sparkline__area')).toHaveCount(1);
    await expect(image.locator('.ui-sparkline__marker')).toHaveCount(3);
    const line = page.locator('[data-lab-cell="variant=line markers=none"] .ui-sparkline__line');
    expect(await line.evaluate((node) => getComputedStyle(node).fill)).toBe('none');
    expect(await line.evaluate((node) => getComputedStyle(node).strokeWidth)).toBe('1.5px');
    await expect(
      page.locator('[data-lab-cell="variant=line markers=none"] .ui-sparkline__marker'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-SPARKLINE-1.3 UIC-SPARKLINE-2.2 breaks at gaps and describes each series', async ({
    page,
    lab,
  }) => {
    await lab.open('sparkline');
    const gaps = page.locator('[data-lab-cell="shape=gaps"] .ui-sparkline__line');
    expect((await gaps.getAttribute('d'))?.match(/M/g)).toHaveLength(3);
    const empty = page.locator('[data-lab-cell="shape=empty"]').getByRole('img');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty).toHaveAccessibleDescription('No data');
    await expect(
      page.locator('[data-lab-cell="shape=rising"]').getByRole('img'),
    ).toHaveAccessibleDescription('Low 2, high 11, last 11');
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
    expect(east).toBeGreaterThan(north!);
    expect(north).toBeGreaterThan(south!);
    const ticks = page.locator('[data-lab-demo="ticks"] [data-lab-tick]');
    await expect(ticks).toHaveText(['Feb 2026', 'Mar 2026']);
    await expect(page.locator('[data-lab-demo="ticks"] p')).toHaveText(
      'Value ticks: 0, 5, 10, 15, 20, 25, 30',
    );
  });
});
