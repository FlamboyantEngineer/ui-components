import { expect, test } from './fixtures.js';

test('UIC-CHART-15.4 follows a moving cursor before pointer release and drags a Y handle independently on a narrow plot', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const lane = chart.getByRole('region', { name: 'Voltage' });
  const b = lane.getByRole('slider', { name: 'B', exact: true });
  const end = lane.getByRole('slider', { name: 'Edge delay · End' });
  const delay = chart.getByRole('row', { name: /^Edge delay/ });
  await expect(delay).toContainText('80.00 ns');
  await b.scrollIntoViewIfNeeded();
  const line = await b.locator('line').boundingBox();
  if (!line) throw new Error('Expected a visible cursor');
  const y = line.y + line.height / 2;
  await page.mouse.move(line.x, y);
  await page.mouse.down();
  await page.mouse.move(line.x + 24, y, { steps: 4 });
  const moved = Number(await b.getAttribute('data-coordinate'));
  expect(moved).toBeGreaterThan(240e-9);
  await expect(end).toHaveAttribute('data-coordinate', String(moved));
  await expect(delay).toContainText(((moved - 160e-9) * 1e9).toFixed(2) + ' ns');
  await page.mouse.up();
  const base = lane.getByRole('slider', { name: 'Voltage excursion · Start' });
  const peak = lane.getByRole('slider', { name: 'Voltage excursion · End' });
  await base.scrollIntoViewIfNeeded();
  const diamond = await base.locator('path').boundingBox();
  if (!diamond) throw new Error('Expected a visible endpoint');
  await page.mouse.move(diamond.x + diamond.width / 2, diamond.y + diamond.height / 2);
  await page.mouse.down();
  await page.mouse.move(diamond.x + diamond.width / 2, diamond.y - 18, { steps: 4 });
  expect(Number(await base.getAttribute('data-coordinate'))).toBeGreaterThan(0);
  await expect(peak).toHaveAttribute('data-coordinate', '5');
  await expect(chart.getByRole('row', { name: /^Voltage excursion/ })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await page.mouse.up();
  await peak.press('Home');
  await expect(peak).not.toHaveAttribute('data-snapped', 'true');
  await expect(lane.getByRole('button', { name: 'Voltage peak', exact: true })).toBeVisible();
});

test('UIC-CHART-15.4 creates, binds, releases and removes a differential pair with the keyboard', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const lane = chart.getByRole('region', { name: 'Voltage' });
  const menu = (name: string) => page.getByRole('menuitem', { name, exact: true });
  const plot = lane.getByRole('group', { name: 'Voltage', exact: true });
  await plot.press('Shift+F10');
  await menu('Differential cursors').press('ArrowRight');
  await menu('Add ΔY cursor').press('Enter');
  const start = lane.getByRole('slider', { name: 'ΔY 1 · Start' });
  await expect(start).toBeVisible();
  await start.press('Shift+F10');
  await menu('ΔY 1 · Start').press('ArrowRight');
  await page
    .getByRole('menu', { name: 'ΔY 1 · Start' })
    .getByRole('menuitem', { name: 'Cursor B', exact: true })
    .press('Enter');
  await expect(start).toHaveAttribute('data-snapped', 'true');
  const previous = await start.getAttribute('data-coordinate');
  await lane.getByRole('slider', { name: 'B', exact: true }).press('Home');
  await expect(start).not.toHaveAttribute('data-coordinate', previous ?? '');
  await start.press('Shift+F10');
  await menu('ΔY 1 · Start').press('ArrowRight');
  await menu('Free position').press('Enter');
  await expect(start).not.toHaveAttribute('data-snapped', 'true');
  await chart.getByRole('row', { name: /^ΔY 1/ }).getByRole('button').press('Shift+F10');
  await menu('Delete cursor').press('Enter');
  await expect(start).toHaveCount(0);
});

test('UIC-CHART-15.4 drags a free X endpoint across a snapped cutoff on a logarithmic axis', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  await page.getByRole('tab', { name: 'Frequency response' }).click();
  const chart = page.getByRole('figure', { name: 'Frequency response' });
  const magnitude = chart.getByRole('region', { name: 'Magnitude' });
  const phase = chart.getByRole('region', { name: 'Phase' });
  const start = magnitude.getByRole('slider', { name: 'Frequency span · Start' });
  await start.scrollIntoViewIfNeeded();
  const handle = await start.locator('path').boundingBox();
  const cutoff = await magnitude
    .getByRole('slider', { name: 'Frequency span · End' })
    .locator('path')
    .boundingBox();
  if (!handle || !cutoff) throw new Error('Expected both frequency endpoints');
  const y = handle.y + handle.height / 2;
  await page.mouse.move(handle.x + handle.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(cutoff.x + cutoff.width / 2 + 24, y, { steps: 4 });
  const value = await start.getAttribute('data-coordinate');
  expect(Number(value)).toBeGreaterThan(1000);
  await expect(phase.getByRole('slider', { name: 'Frequency span · Start' })).toHaveAttribute(
    'data-coordinate',
    String(value),
  );
  await expect(phase.getByRole('slider', { name: 'Frequency span · End' })).toHaveAttribute(
    'data-coordinate',
    '1000',
  );
  await expect(
    chart
      .getByRole('row', { name: /^Frequency span/ })
      .getByRole('cell')
      .first(),
  ).toHaveText(/^-/);
  await page.mouse.up();
});
