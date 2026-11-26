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
  await expect(chart.getByRole('button', { name: /pan|zoom|reset/i })).toHaveCount(0);
  const before = await plot.getAttribute('data-range-start');
  const wheel = async (ctrlKey: boolean, deltaY = -90) =>
    plot.evaluate(
      (el, input) => {
        const box = el.getBoundingClientRect();
        return el.dispatchEvent(
          new WheelEvent('wheel', {
            ctrlKey: input.ctrlKey,
            clientX: box.left + box.width * 0.72,
            deltaY: input.deltaY,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      { ctrlKey, deltaY },
    );
  await plot.hover();
  expect(await wheel(false)).toBe(true);
  await page.keyboard.down('Control');
  await expect(plot).toHaveCSS('cursor', 'zoom-in');
  expect(await wheel(true, 90)).toBe(false);
  await expect(plot).toHaveCSS('cursor', 'zoom-out');
  expect(await wheel(true)).toBe(false);
  await expect(plot).toHaveCSS('cursor', 'zoom-in');
  await page.keyboard.up('Control');
  await expect(plot).toHaveCSS('cursor', 'grab');
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
  const other = lane.getByRole('slider', { name: 'B', exact: true });
  const line = cursor.locator('line');
  await line.scrollIntoViewIfNeeded();
  const box = await line.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Missing cursor geometry');
  const start = await cursor.getAttribute('data-coordinate');
  await page.mouse.move(box.x, box.y + box.height / 2);
  await expect(cursor).toHaveCSS('cursor', 'ew-resize');
  await page.mouse.down();
  await expect(lane.getByRole('group', { name: 'Voltage' })).toHaveCSS('cursor', 'ew-resize');
  await expect(cursor).toHaveAttribute('data-dragging', 'true');
  await expect(cursor).toHaveCSS('outline-style', 'none');
  await expect(line).toHaveCSS('stroke-width', '2px');
  await expect(other.locator('line')).toHaveCSS('stroke-width', '1px');
  await page.mouse.move(box.x + 35, box.y + box.height / 2, { steps: 5 });
  await expect(line).toHaveCSS('stroke-width', '2px');
  await page.mouse.up();
  await expect(cursor).not.toHaveAttribute('data-dragging');
  await expect(line).toHaveCSS('stroke-width', '1px');
  await expect(cursor).not.toHaveAttribute('data-coordinate', start ?? '');
  await page.keyboard.press('Tab');
  await expect(other).toBeFocused();
  await expect(other).toHaveCSS('outline-style', 'none');
  await expect(other.locator('line')).toHaveCSS('stroke-width', '2px');
  await lane
    .getByRole('group', { name: 'Voltage' })
    .click({ button: 'right', position: { x: 100, y: 40 } });
  await page.getByRole('menuitem', { name: 'Place cursors at minimum and maximum' }).click();
  const readings = chart.getByRole('table', { name: 'Cursor readings' });
  await expect(
    readings
      .getByRole('row', { name: /^Peak-to-peak/ })
      .getByRole('cell', { name: '10', exact: true }),
  ).toBeVisible();
  await expect(readings.getByRole('row', { name: /^Trigger/ })).toContainText('160.00 ns');
  await expect(readings.getByRole('row', { name: /^Voltage peak/ })).toContainText('324.00 ns');
  await expect(
    chart.getByRole('region', { name: 'Current' }).locator('.ui-linked-line-chart__point'),
  ).toHaveText('Current peak');
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
  await expect(chart.getByRole('button', { name: /pan|zoom|reset/i })).toHaveCount(0);
  await page.mouse.move(end, y);
  await expect(plot).toHaveAttribute('data-gesture', 'idle');
  await page.keyboard.down('Shift');
  await expect(plot).toHaveCSS('cursor', 'zoom-in');
  await page.mouse.down();
  await page.mouse.move(start, y, { steps: 4 });
  await expect(plot.locator('.ui-chart__selection')).toBeVisible();
  await expect(plot).toHaveCSS('cursor', 'crosshair');
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(plot).not.toHaveAttribute('data-range-start', '0');
  await expect(plot).toHaveCSS('cursor', 'grab');
  const zoomed = await plot.getAttribute('data-range-start');
  await page.mouse.down();
  await expect(plot).toHaveCSS('cursor', 'grabbing');
  await page.mouse.move(start + 30, y, { steps: 3 });
  await page.mouse.up();
  await expect(plot).not.toHaveAttribute('data-range-start', zoomed ?? '');
  await expect(plot).toHaveCSS('cursor', 'grab');
  await plot.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Elapsed time' });
  await expect(menu.getByRole('menuitem')).toHaveCount(1);
  await menu.getByRole('menuitem', { name: 'Reset view' }).click();
  await expect(plot).toHaveAttribute('data-range-start', '0');
});

test('UIC-CHART-14.1 clears pointer feedback on cancellation and modifier release outside the plot', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Observation sequence' });
  const plot = chart.getByRole('group', { name: 'Elapsed time' });
  await plot.hover();
  await page.keyboard.down('Shift');
  await expect(plot).toHaveCSS('cursor', 'zoom-in');
  await page.mouse.down();
  await expect(plot).toHaveCSS('cursor', 'crosshair');
  await plot.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await expect(plot).toHaveCSS('cursor', 'zoom-in');
  await page.mouse.up();
  await page.mouse.move(1, 1);
  await expect(plot).toHaveCSS('cursor', 'default');
  await page.keyboard.up('Shift');
  await plot.hover();
  await expect(plot).toHaveCSS('cursor', 'default');
});
