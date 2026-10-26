import { expect, test } from './fixtures.js';

test.describe('Stat Tile lab', () => {
  test('UIC-STAT-TILE-1.1 UIC-STAT-TILE-1.3 UIC-STAT-TILE-1.4 UIC-STAT-TILE-2.1 judges each trend against its goal', async ({
    page,
    lab,
  }) => {
    await lab.open('stat-tile');
    const cells = page.locator('table[data-lab-matrix="goal delta"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 3);
    const tile = (cell: string) => page.locator(`[data-lab-cell="${cell}"]`).getByRole('region');
    await expect(tile('goal=increase delta=rise').locator('.ui-stat-tile__value')).toHaveText(
      '1,284',
    );
    const judged = {
      'goal=increase delta=rise': ['up', 'success', '+12'],
      'goal=increase delta=fall': ['down', 'danger', '-8'],
      'goal=decrease delta=rise': ['up', 'danger', '+12'],
      'goal=decrease delta=fall': ['down', 'success', '-8'],
      'goal=none delta=rise': ['up', 'neutral', '+12'],
      'goal=increase delta=flat': ['flat', 'neutral', '0'],
    } as const;
    const colours = new Map<string, string>();
    for (const [cell, [trend, tone, text]] of Object.entries(judged)) {
      await expect(tile(cell)).toHaveAttribute('data-trend', trend);
      await expect(tile(cell)).toHaveAttribute('data-tone', tone);
      const delta = tile(cell).locator('.ui-stat-tile__delta');
      await expect(delta).toHaveText(text);
      await expect(delta.locator('.ui-stat-tile__trend-icon')).toHaveAttribute(
        'data-glyph',
        `trend-${trend}`,
      );
      colours.set(tone, await delta.evaluate((node) => getComputedStyle(node).color));
    }
    expect(new Set(colours.values()).size).toBe(3);
    await lab.expectAccessible();
  });

  test('UIC-STAT-TILE-1.2 UIC-STAT-TILE-1.5 formats values and loads', async ({ page, lab }) => {
    await lab.open('stat-tile');
    const cell = (value: string) => page.locator(`[data-lab-cell="value=${value}"]`);
    await expect(cell('percent').locator('.ui-stat-tile__value')).toHaveText('99.87%');
    await expect(cell('percent').locator('.ui-stat-tile__delta')).toHaveText('-0.04%');
    await expect(cell('currency').locator('.ui-stat-tile__value')).toHaveText('€48K');
    await expect(cell('worded').locator('.ui-stat-tile__value')).toHaveText('Healthy');
    await expect(cell('no delta').locator('.ui-stat-tile__delta')).toHaveCount(0);
    const loading = cell('loading').getByRole('region', { name: 'Costs' });
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('.ui-card__skeleton')).toBeVisible();
  });

  test('UIC-STAT-TILE-1.1 UIC-STAT-TILE-1.5 holds charts, links and presses as a card', async ({
    page,
    lab,
  }) => {
    await lab.open('stat-tile');
    const dashboard = page.locator('[data-lab-demo="dashboard"]');
    const builds = dashboard.getByRole('region', { name: 'Daily builds' });
    await expect(builds.getByRole('link', { name: 'Daily builds' })).toHaveAttribute(
      'href',
      '#builds',
    );
    const chart = await builds.locator('.ui-stat-tile__chart .ui-sparkline').boundingBox();
    const body = await builds.locator('.ui-card__body').boundingBox();
    expect(Math.round(chart?.width ?? 0)).toBe(Math.round((body?.width ?? 0) - 32));
    await expect(
      dashboard.getByRole('region', { name: 'Checks' }).getByRole('group'),
    ).toBeVisible();
    await expect(
      dashboard.getByRole('region', { name: 'Storage' }).getByRole('meter'),
    ).toBeVisible();
    const pressable = page.locator('[data-lab-demo="pressable"]');
    await pressable.locator('.ui-stat-tile__value').click();
    await pressable.getByRole('button', { name: 'Open requests' }).click();
    await expect(pressable.locator('.ui-stat-tile__description')).toHaveText('Opened 2 times');
    await lab.expectAccessible();
  });
});
