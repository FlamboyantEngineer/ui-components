import { expect, test } from './fixtures.js';

test('UIC-CHART-16.1 reaches both observations at zero and keeps exact interval details', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Observation sequence' });
  const first = chart.getByRole('img', { name: /^Observation 1,/ });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(chart.getByRole('img', { name: /^Observation 2,/ })).toBeFocused();
  await chart.getByRole('button', { name: 'Show as table' }).click();
  await expect(chart.getByRole('row', { name: /^Observation 1 / })).toContainText('2.5e-7');
});

test('UIC-CHART-14.1 zooms to a dragged interval, pans, then restores the capture', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Observation sequence' });
  const plot = chart.getByRole('group', { name: 'Elapsed time' });
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  if (!box) throw new Error('Missing plot geometry');
  const y = box.y + box.height / 2;
  const start = box.x + box.width * 0.3;
  const end = box.x + box.width * 0.6;
  await page.keyboard.down('Shift');
  await page.mouse.move(end, y);
  await page.mouse.down();
  await page.mouse.move(start, y, { steps: 4 });
  await expect(plot.locator('.ui-chart__selection')).toBeVisible();
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(plot).not.toHaveAttribute('data-range-start', '0');
  const zoomed = await plot.getAttribute('data-range-start');
  await page.mouse.down();
  await page.mouse.move(start + 30, y, { steps: 3 });
  await page.mouse.up();
  await expect(plot).not.toHaveAttribute('data-range-start', zoomed ?? '');
  await plot.dblclick();
  await expect(plot).toHaveAttribute('data-range-start', '0');
});
