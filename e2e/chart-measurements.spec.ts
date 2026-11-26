import { expect, test } from './fixtures.js';

test('UIC-CHART-14.1 UIC-CHART-15.1 scopes Ctrl+wheel to the pointer and pans a narrow capture', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const plot = chart.getByRole('group', { name: 'Voltage', exact: true });
  await plot.scrollIntoViewIfNeeded();
  const before = await plot.getAttribute('data-range-start');
  const wheel = async (ctrlKey: boolean) =>
    plot.evaluate((el, ctrl) => {
      const box = el.getBoundingClientRect();
      return el.dispatchEvent(
        new WheelEvent('wheel', {
          ctrlKey: ctrl,
          clientX: box.left + box.width * 0.72,
          deltaY: -90,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, ctrlKey);
  expect(await wheel(false)).toBe(true);
  expect(await wheel(true)).toBe(false);
  await expect(plot).not.toHaveAttribute('data-range-start', before ?? '');
  const afterZoom = await plot.getAttribute('data-range-start');
  await plot.focus();
  await page.keyboard.press('ArrowRight');
  await expect(plot).not.toHaveAttribute('data-range-start', afterZoom ?? '');
  await page.keyboard.press('Home');
  await expect(plot).toHaveAttribute('data-range-start', before ?? '');
  expect(await plot.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('UIC-CHART-15.2 UIC-CHART-15.3 drags a cursor and places peak-to-peak from the pointer menu', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const lane = chart.getByRole('region', { name: 'Voltage' });
  const cursor = lane.getByRole('slider', { name: 'A', exact: true });
  const line = cursor.locator('line');
  await line.scrollIntoViewIfNeeded();
  const box = await line.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Missing cursor geometry');
  const start = await cursor.getAttribute('data-coordinate');
  await page.mouse.move(box.x, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 35, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(cursor).not.toHaveAttribute('data-coordinate', start ?? '');
  await lane
    .getByRole('group', { name: 'Voltage' })
    .click({ button: 'right', position: { x: 100, y: 40 } });
  await page.getByRole('menuitem', { name: 'Place cursors at minimum and maximum' }).click();
  await expect(chart).toContainText('Peak-to-peak = 10 V');
});

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
