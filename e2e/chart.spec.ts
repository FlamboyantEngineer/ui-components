import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test('UIC-CHART-2.1 UIC-CHART-3.1 UIC-CHART-3.2 keeps numeric and text identities distinct after reordering', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const demo = page.locator('[data-lab-demo="typed-keys"]');
  const numeric = demo.getByRole('button', { name: 'Numeric series' });
  const text = demo.getByRole('button', { name: 'Text series' });
  const hidden = demo.locator('[data-lab-output="typed-hidden"]');
  await numeric.click();
  await expect(hidden).toHaveText('number 1');
  await demo.getByRole('button', { name: 'Reverse typed entries' }).click();
  await expect(numeric).toHaveAttribute('aria-pressed', 'false');
  await expect(text).toHaveAttribute('aria-pressed', 'true');
  await expect(demo.locator(':scope > svg .ui-chart-axis__label')).toHaveText([
    'Text 1',
    'Number 1',
  ]);
  await numeric.click();
  await text.click();
  await expect(hidden).toHaveText('string 1');
  // A bar keeps its element, and its series, when the series reorder.
  const bar = demo.getByRole('img', { name: 'Text series, Second: 5' });
  await bar.evaluate((element) => element.setAttribute('data-lab-mark', 'kept'));
  const series = await bar.getAttribute('data-series');
  await demo.getByRole('button', { name: 'Reverse typed entries' }).click();
  await expect(demo.locator('[data-lab-mark="kept"]')).toHaveAccessibleName(
    'Text series, Second: 5',
  );
  await expect(demo.locator('[data-lab-mark="kept"]')).not.toHaveAttribute(
    'data-series',
    series ?? '',
  );
});
const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const tooltip = (page: Page) => page.locator('.ui-chart__tooltip');

test.describe('Chart lab', () => {
  test('UIC-CHART-6.4 keeps first readings and blanks missing values at repeated coordinates', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const table = page.getByRole('table', { name: 'Repeated readings', exact: true });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).getByRole('cell')).toHaveText(['4', '']);
    await expect(rows.nth(1).getByRole('cell')).toHaveText(['', '3']);
  });

  test('UIC-CHART-1.1 UIC-CHART-3.2 UIC-CHART-4.6 UIC-CHART-5.1 UIC-CHART-5.2 UIC-CHART-8.1 draws grouped and stacked bars both ways', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    await expect(
      page.locator('table[data-lab-matrix="layout orientation"] td[data-lab-cell]'),
    ).toHaveCount(4);
    const grouped = matrixCell(page, 'layout=grouped orientation=vertical');
    const figure = grouped.getByRole('figure', { name: 'Crates by quarter' });
    await expect(figure).toHaveAttribute('data-layout', 'grouped');
    await expect(figure.locator('.ui-bar-chart__bar')).toHaveCount(12);
    await expect(figure.locator('.ui-chart__plot')).toHaveAttribute('width', '420');
    await expect(figure.locator('.ui-chart-axis__grid').first()).toBeAttached();
    const fills = await figure
      .locator('.ui-bar-chart__bar')
      .evaluateAll((bars) => bars.slice(0, 3).map((bar) => getComputedStyle(bar).fill));
    expect(new Set(fills).size).toBe(3);
    const stacked = matrixCell(page, 'layout=stacked orientation=horizontal').getByRole('figure');
    await expect(stacked).toHaveAttribute('data-orientation', 'horizontal');
    const [first, second] = await stacked
      .locator('.ui-bar-chart__bar')
      .evaluateAll((bars) => bars.slice(0, 2).map((bar) => bar.getBoundingClientRect()));
    expect(Math.abs(requireDefined(first).right - requireDefined(second).left)).toBeLessThan(1.5);
    await lab.expectAccessible();
  });

  test('UIC-CHART-2.1 keeps the legend to show a hidden series left alone', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const demo = page.locator('[data-lab-demo="shrinking"]');
    await demo.getByRole('button', { name: 'Pears' }).click();
    await demo.getByRole('button', { name: 'Remove Apples' }).click();
    const pears = demo.getByRole('button', { name: 'Pears' });
    await expect(pears).toHaveAttribute('aria-pressed', 'false');
    await pears.click();
    await expect(demo.getByRole('img', { name: /^Pears/ })).toHaveCount(4);
    await lab.expectAccessible('[data-lab-demo="shrinking"]');
  });

  test('UIC-CHART-6.4 lists every reading with all series hidden', async ({ page, lab }) => {
    await lab.open('chart');
    const table = page.locator('[data-lab-demo="all-hidden"]').getByRole('table');
    await expect(table.getByRole('row')).toHaveCount(9);
    await expect(table.getByRole('row').nth(1)).toHaveText('0104');
    await lab.expectAccessible('[data-lab-demo="all-hidden"]');
  });

  test('UIC-CHART-4.3 moves between unevenly sampled series by x', async ({ page, lab }) => {
    await lab.open('chart');
    const figure = page.locator('[data-lab-demo="uneven"]').getByRole('figure');
    await figure.getByRole('img', { name: 'Hourly reading, 24: 16' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(figure.getByRole('img', { name: 'Spot check, 24: 12' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    await expect(figure.getByRole('img', { name: 'Hourly reading, 0: 10' })).toBeFocused();
    // The reading without a usable hour neither draws nor stretches the value axis.
    await expect(figure.locator('.ui-line-chart__point')).toHaveCount(10);
    await expect(figure.locator('.ui-chart-axis__label').filter({ hasText: '400' })).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="uneven"]');
  });

  test('UIC-CHART-4.2 UIC-CHART-4.3 UIC-CHART-4.4 names, focuses and describes each value', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const figure = matrixCell(page, 'layout=grouped orientation=vertical').getByRole('figure');
    const apples = figure.getByRole('img', { name: 'Apples, Q1: 42' });
    await apples.focus();
    await expect(apples).toHaveAttribute('data-active', 'true');
    await expect(tooltip(page)).toBeVisible();
    await expect(tooltip(page)).toContainText('Q1');
    await expect(tooltip(page).locator('.ui-chart__tooltip-value')).toHaveText('42');
    await page.keyboard.press('ArrowRight');
    await expect(figure.getByRole('img', { name: 'Apples, Q2: 55' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(figure.getByRole('img', { name: 'Pears, Q2: 31' })).toBeFocused();
    await expect(tooltip(page).locator('.ui-chart__tooltip-label')).toHaveText('Pears');
    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toHaveCount(0);
    await figure.getByRole('img', { name: 'Plums, Q3: 26' }).hover();
    await expect(tooltip(page).locator('.ui-chart__tooltip-value')).toHaveText('26');
    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toHaveCount(0);
  });

  test('UIC-CHART-1.3 UIC-CHART-2.1 UIC-CHART-2.3 toggles series and the table view', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const controlled = demo(page, 'controlled');
    const output = controlled.locator('[data-lab-output="hidden"]');
    await expect(output).toHaveText('Hidden: plums; view: chart');
    await expect(controlled.locator('.ui-bar-chart__bar')).toHaveCount(8);
    await controlled.getByRole('button', { name: 'Plums' }).click();
    await expect(output).toHaveText('Hidden: none; view: chart');
    await expect(controlled.locator('.ui-bar-chart__bar')).toHaveCount(12);
    await page.keyboard.press('ArrowLeft');
    await expect(controlled.getByRole('button', { name: 'Pears' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(output).toHaveText('Hidden: pears; view: chart');
    await controlled.getByRole('button', { name: 'Show as table' }).click();
    await expect(output).toHaveText('Hidden: pears; view: table');
    const table = controlled.getByRole('table', { name: 'Crates by quarter' });
    await expect(table.getByRole('row').first()).toHaveText('CategoryApplesPearsPlums');
    await expect(controlled.getByRole('figure')).toHaveAttribute('data-view', 'table');
    await lab.expectAccessible();
  });

  test('UIC-CHART-6.1 UIC-CHART-6.2 draws lines and areas over dates and numbers', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const area = matrixCell(page, 'variant=area').getByRole('figure', { name: 'Sprint burndown' });
    await expect(area).toHaveAttribute('data-variant', 'area');
    await expect(area.locator('.ui-line-chart__area')).toHaveCount(2);
    await expect(area.locator('.ui-line-chart__line').first()).toHaveAttribute('d', /M.*M/);
    await expect(area.getByRole('img', { name: 'Remaining, Mar 2, 2026: 40' })).toBeAttached();
    await expect(area.locator('.ui-chart-axis[data-position="bottom"]')).toContainText('Mar 8');
    const line = matrixCell(page, 'variant=line').locator('.ui-line-chart__line').first();
    expect(await line.evaluate((node) => getComputedStyle(node).fill)).toBe('none');
    await expect(
      demo(page, 'numeric').getByRole('img', { name: 'Build minutes, 1,201: 6.2' }),
    ).toBeAttached();
    await lab.expectAccessible();
  });

  test('UIC-CHART-7.1 UIC-CHART-4.4 draws donut slices around the total', async ({ page, lab }) => {
    await lab.open('chart');
    const donut = matrixCell(page, 'data=results').getByRole('figure', { name: 'Run results' });
    await expect(donut.locator('.ui-donut-chart__slice')).toHaveCount(4);
    await expect(donut.locator('.ui-donut-chart__total')).toHaveText('231 total');
    const passed = donut.getByRole('img', { name: 'Passed: 214, 92.6%' });
    await passed.hover({ position: { x: 110, y: 12 } });
    await expect(tooltip(page).locator('.ui-chart__tooltip-value')).toHaveText('214 (92.6%)');
    const box = await donut.locator('.ui-chart__plot').boundingBox();
    expect([box?.width, box?.height]).toEqual([160, 160]);
    await expect(matrixCell(page, 'data=small').locator('.ui-chart__plot')).toHaveAttribute(
      'width',
      '96',
    );
    const large = page.getByRole('figure', { name: 'Large amounts' });
    await expect(large.getByRole('img', { name: /50%$/ })).toHaveCount(2);
    await expect(large.locator('.ui-donut-chart__slice').first()).toHaveAttribute(
      'd',
      /A80,80 0 0 1 80,160/,
    );
    const stacked = page.getByRole('figure', { name: 'Large stacked amounts' });
    const sizes = await stacked
      .locator('.ui-bar-chart__bar')
      .evaluateAll((bars) =>
        bars.map((bar) => [bar.getAttribute('y'), bar.getAttribute('height')]),
      );
    expect(sizes).toHaveLength(4);
    for (const size of sizes)
      expect(size.every((value) => Number.isFinite(Number(value)))).toBe(true);
    expect(sizes[0]?.[1]).toBe(sizes[1]?.[1]);
  });

  test('UIC-CHART-1.2 UIC-CHART-4.5 shows a summary, a table and an empty chart', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    await expect(matrixCell(page, 'state=summary').locator('.ui-chart__summary')).toBeVisible();
    await expect(matrixCell(page, 'state=summary').locator('.ui-chart__summary')).toHaveText(
      '2 series, 8 values, from 24 to 61',
    );
    await expect(matrixCell(page, 'state=table').getByRole('table')).toBeVisible();
    const empty = matrixCell(page, 'state=empty').getByRole('figure');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty.locator('.ui-chart__empty')).toHaveText('No data');
    await expect(demo(page, 'custom').locator('.ui-chart__summary')).toBeVisible();
    await lab.expectAccessible();
  });
});

test('UIC-CHART-1.4 a custom chart owns its empty state through isEmpty', async ({ page, lab }) => {
  await lab.open('chart');
  const chart = page.locator('[data-lab-demo="custom"]');
  await expect(chart).not.toHaveAttribute('data-empty');
  await expect(chart.getByRole('group', { name: 'Room use cells' })).toBeVisible();
  await page.getByRole('switch', { name: 'No readings yet' }).press('Space');
  await expect(chart).toHaveAttribute('data-empty', 'true');
  await expect(chart.locator('.ui-chart__summary')).toHaveText('No readings yet');
  await expect(chart.locator('[data-lab-custom-empty]')).toBeVisible();
  await expect(chart.getByRole('group', { name: 'Room use cells' })).toHaveCount(0);
  await expect(chart.locator('.ui-chart-legend')).toHaveCount(0);
  await lab.expectAccessible('[data-lab-demo="custom"]');
  await chart.getByRole('button', { name: 'Show as table' }).click();
  await expect(chart.getByRole('table').getByRole('row')).toHaveCount(1);
  await chart.getByRole('button', { name: 'Show as table' }).click();
  await page.getByRole('switch', { name: 'No readings yet' }).press('Space');
  await expect(chart).not.toHaveAttribute('data-empty');
  await expect(chart.getByRole('img', { name: 'Lab B, 16:00: 9 people' })).toBeVisible();
});
