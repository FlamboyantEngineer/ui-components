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
  await page.getByRole('tab', { name: 'Elapsed events' }).click();
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
  await page.getByRole('tab', { name: 'Elapsed events' }).click();
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
  await page.getByRole('tab', { name: 'Elapsed events' }).click();
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

test('UIC-CHART-15.2 UIC-CHART-15.3 edits a cursor in units and deletes targeted cursors from a line or row', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const plot = chart.getByRole('group', { name: 'Voltage', exact: true });
  for (const name of ['C', 'D']) {
    await plot.click({ button: 'right', position: { x: 100, y: 50 } });
    await page.getByRole('menuitem', { name: 'Insert cursor' }).click();
    await expect(plot.getByRole('slider', { name, exact: true })).toBeVisible();
  }
  await chart.getByRole('button', { name: /^Edit Cursor C / }).click();
  const field = chart.getByRole('textbox', { name: 'Cursor C', exact: true });
  await field.fill('820 V');
  await field.press('Enter');
  await expect(field).toBeVisible();
  await field.fill('820 ns');
  await field.press('Enter');
  const row = chart
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Edit Cursor name Cursor C', exact: true }) });
  await expect(row).toContainText('820.00 ns');
  const line = plot.getByRole('slider', { name: 'C', exact: true });
  expect(Number(await line.getAttribute('data-coordinate'))).toBeCloseTo(820e-9, 15);
  await line.click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete cursor' }).click();
  await expect(row).toHaveCount(0);
  const remaining = chart
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Edit Cursor name Cursor D', exact: true }) });
  await remaining.getByRole('cell').last().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete cursor' }).click();
  await expect(remaining).toHaveCount(0);
  await expect(plot.getByRole('slider', { name: 'A', exact: true })).toBeVisible();
  await expect(
    chart.getByRole('row', { name: /^Trigger/ }).getByRole('button', { name: /^Edit/ }),
  ).toHaveCount(0);
});

test('UIC-CHART-15.2 opens the pressed cursor menu at a fractional legend edge', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const lane = page.getByRole('region', { name: 'Voltage', exact: true });
  const cursor = lane.getByRole('slider', { name: 'B', exact: true });
  await cursor.scrollIntoViewIfNeeded();
  const { x, y } = await cursor.locator('line').evaluate((line) => {
    const box = line.getBoundingClientRect();
    return { x: box.x, y: Math.floor(box.y + box.height / 2) + 0.75 };
  });
  // A wrapped legend can end between the pointer and the browser's rounded contextmenu position.
  await lane.locator('.ui-chart__legend').evaluate(
    (legend, point) => {
      const box = legend.getBoundingClientRect();
      legend.style.transform = `translate(${point.x - box.left - box.width / 2}px, ${point.y - 0.25 - box.bottom}px)`;
    },
    { x, y },
  );
  await page.mouse.click(x, y, { button: 'right' });
  const remove = page.getByRole('menuitem', { name: 'Delete cursor' });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(cursor).toHaveCount(0);
});

test('UIC-CHART-15.1 links magnitude and phase at the low-pass cutoff', async ({ page, lab }) => {
  await lab.open('chart');
  await page.getByRole('tab', { name: 'Frequency response' }).click();
  const figure = page.getByRole('figure', { name: 'Frequency response' });
  const row = figure.getByRole('row', { name: /^Cutoff/ });
  await expect(row.getByRole('cell', { name: '-3.01', exact: true })).toBeVisible();
  await expect(row.getByRole('cell', { name: '-90.00', exact: true })).toBeVisible();
  await expect(figure.getByRole('slider', { name: 'B', exact: true })).toHaveCount(2);
});

for (const width of [1280, 375]) {
  test(`UIC-CHART-15.2 keeps the readout in place while editing at ${width}px`, async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width, height: 820 });
    await lab.open('chart');
    const chart = page.getByRole('figure', { name: 'Captured signals' });
    const table = chart.getByRole('table', { name: 'Cursor readings' });
    await table.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const geometry = () =>
      table.evaluate((el) => {
        const origin = el.getBoundingClientRect();
        return [el, ...el.querySelectorAll('tr,th,td')].map((cell) => {
          const box = cell.getBoundingClientRect();
          return [box.x - origin.x, box.y - origin.y, box.width, box.height];
        });
      });
    const original = await geometry();
    const time = table.getByRole('button', { name: /^Edit Cursor A / });
    await time.click();
    const input = table.getByRole('textbox', { name: 'Cursor A', exact: true });
    await expect(input).toBeFocused();
    expect(await geometry()).toEqual(original);
    await input.fill('1234567890123456789 V');
    await input.press('Enter');
    await expect(table.getByText(/Enter a position/)).toBeVisible();
    expect(await geometry()).toEqual(original);
    await input.press('Escape');
    await expect(time).toBeFocused();
    expect(await geometry()).toEqual(original);

    await table
      .getByRole('button', { name: 'Edit Cursor name Cursor A', exact: true })
      .press('Enter');
    const name = table.getByRole('textbox', { name: 'Cursor name' });
    await name.fill('Rising edge');
    expect(await geometry()).toEqual(original);
    await name.press('Enter');
    await expect(
      table.getByRole('button', { name: 'Edit Cursor name Cursor Rising edge' }),
    ).toBeFocused();
    await expect(chart.getByRole('slider', { name: 'Rising edge', exact: true })).toHaveCount(2);
    await expect(table.getByRole('rowheader', { name: 'B − Rising edge' })).toBeVisible();
    const cursor = chart.getByRole('slider', { name: 'Rising edge', exact: true }).first();
    await cursor.press('Shift+F10');
    await expect(
      page.getByRole('menuitem', { name: 'Cursor Rising edge', exact: true }),
    ).toBeVisible();
  });
}

test('UIC-CHART-15.2 reports host-calculated peak and peak-to-peak over the interval between live cursors', async ({
  page,
  lab,
}) => {
  await lab.open('chart');
  const table = page
    .getByRole('table', { name: 'Cursor readings' })
    .filter({ has: page.getByRole('rowheader', { name: 'Peak between cursors' }) });
  const peak = table.getByRole('row', { name: /^Peak between cursors/ });
  const span = table.getByRole('row', { name: /^Peak-to-peak between cursors/ });
  const rise = table.getByRole('row', { name: /^Rise time/ });
  const fixedRise = await rise.innerText();
  await expect(peak.getByRole('cell', { name: '5 V', exact: true })).toHaveCount(0);
  await table.getByRole('button', { name: /^Edit Cursor B / }).click();
  const time = table.getByRole('textbox', { name: 'Cursor B', exact: true });
  await time.fill('820 ns');
  await time.press('Enter');
  await expect(peak.getByRole('cell', { name: '5 V', exact: true })).toBeVisible();
  await expect(peak.getByRole('cell', { name: '42 mA', exact: true })).toBeVisible();
  await expect(span.getByRole('cell', { name: '10 V', exact: true })).toBeVisible();
  expect(await rise.innerText()).toBe(fixedRise);
});

for (const width of [1200, 900, 375]) {
  test(`UIC-CHART-2.4 UIC-CHART-15.2 toggles traces and reveals the exact peak row at ${width}px`, async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width, height: 760 });
    await lab.open('chart');
    const chart = page.getByRole('figure', { name: 'Captured signals' });
    const lane = chart.getByRole('region', { name: 'Voltage' });
    const legend = lane.getByRole('toolbar');
    const plot = lane.getByRole('group', { name: 'Voltage' });
    await legend.scrollIntoViewIfNeeded();
    const bounds = await legend.boundingBox();
    const drawing = await plot.boundingBox();
    if (!bounds || !drawing) throw new Error('Missing chart geometry');
    if (drawing.width <= 384) expect(bounds.y + bounds.height).toBeLessThanOrEqual(drawing.y);
    else {
      expect(bounds.y).toBeGreaterThan(drawing.y);
      expect(bounds.y + bounds.height).toBeLessThan(drawing.y + drawing.height);
    }
    const reference = legend.getByRole('button', { name: 'Reference' });
    await reference.click();
    await expect(lane.locator('.ui-linked-line-chart__comparison')).toHaveCount(0);
    await reference.press('Space');
    await expect(lane.locator('.ui-linked-line-chart__comparison')).toBeVisible();
    await plot.press('+');
    const zoomedStart = await plot.getAttribute('data-range-start');
    expect(Number(zoomedStart)).toBeGreaterThan(0);
    const current = chart.getByRole('button', { name: 'Current peak', exact: true });
    const currentRow = chart.getByRole('row', { name: /^Current peak/ });
    const voltageRow = chart.getByRole('row', { name: /^Voltage peak/ });
    await current.locator('text').click();
    await expect(currentRow).toHaveAttribute('aria-current', 'true');
    await expect(currentRow).toBeInViewport();
    await expect(voltageRow).not.toHaveAttribute('aria-current');
    const peak = lane.getByRole('button', { name: 'Voltage peak' });
    await peak.locator('circle').click();
    await expect(voltageRow).toHaveAttribute('aria-current', 'true');
    await expect(currentRow).not.toHaveAttribute('aria-current');
    await current.press('Enter');
    await expect(currentRow).toHaveAttribute('aria-current', 'true');
    await expect(currentRow).toBeInViewport();
    await expect(plot).toHaveAttribute('data-range-start', String(zoomedStart));
  });
}

test('UIC-CHART-15.2 keeps frequency readout columns steady as digit counts change during a drag and resizes with its container', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 1280, height: 780 });
  await lab.open('chart');
  await page.getByRole('tab', { name: 'Frequency response' }).click();
  const chart = page.getByRole('figure', { name: 'Frequency response' });
  const table = chart.getByRole('table', { name: 'Cursor readings' });
  const columns = () =>
    table.getByRole('columnheader').evaluateAll((headers) =>
      headers.map((h) => {
        const { x, width } = h.getBoundingClientRect();
        return [x, width];
      }),
    );
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 780 });
    const lane = chart.getByRole('region', { name: 'Magnitude' });
    const slider = lane.getByRole('slider', { name: 'A', exact: true });
    const line = slider.locator('line');
    await slider.press('Home');
    await line.scrollIntoViewIfNeeded();
    const box = await line.boundingBox();
    const plot = await lane.getByRole('group', { name: 'Magnitude' }).boundingBox();
    if (!box || !plot) throw new Error('Missing frequency plot geometry');
    const before = await columns();
    const y = box.y + box.height / 2;
    const scroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(box.x, y);
    await page.mouse.down();
    const row = table.getByRole('row', { name: /^Edit Cursor name Cursor A\b/ });
    await expect(row).toHaveAttribute('aria-current', 'true');
    const position = row.getByRole('button', { name: /^Edit Cursor A / });
    await expect(position).toContainText('10 Hz');
    const hzDigitCounts = new Set([2]);
    for (const fraction of [0.17, 0.3, 0.45, 0.58, 0.76, 0.88]) {
      await page.mouse.move(plot.x + plot.width * fraction, y, { steps: 3 });
      const label = (await position.innerText()).trim();
      if (label.endsWith(' Hz')) hzDigitCounts.add(label.replace(/[^0-9]/g, '').length);
      expect(await columns()).toEqual(before);
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
    }
    await page.mouse.up();
    expect(hzDigitCounts.size).toBeGreaterThan(1);
    await expect(row).toContainText('kHz');
    await chart
      .getByRole('region', { name: 'Phase' })
      .getByRole('slider', { name: 'B', exact: true })
      .press('ArrowRight');
    await expect(table.getByRole('row', { name: /^Edit Cursor name Cursor B\b/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(row).not.toHaveAttribute('aria-current');
    if (width === 1280) {
      await page.setViewportSize({ width: 375, height: 780 });
      expect(await columns()).not.toEqual(before);
    }
  }
});

test('UIC-CHART-15.1 UIC-CHART-15.2 shows the time axis on both channels and highlights plot elements from any reading cell', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await lab.open('chart');
  const chart = page.getByRole('figure', { name: 'Captured signals' });
  const voltage = chart.getByRole('region', { name: 'Voltage' }),
    current = chart.getByRole('region', { name: 'Current' });
  const ticks = '.ui-chart-axis[data-position="bottom"] .ui-chart-axis__label';
  await expect(voltage.locator(ticks).first()).toContainText('ns');
  await expect(current.locator(ticks)).toHaveText(await voltage.locator(ticks).allTextContents());
  for (const lane of [voltage, current])
    await expect(lane.getByText('Time (ns)', { exact: true })).toBeVisible();
  const full = await voltage.locator(ticks).allTextContents();
  const viewport = voltage.getByRole('group', { name: 'Voltage' });
  await viewport.press('+');
  await expect.poll(() => voltage.locator(ticks).allTextContents()).not.toEqual(full);
  await expect(current.locator(ticks)).toHaveText(await voltage.locator(ticks).allTextContents());
  await viewport.press('Home');
  const table = chart.getByRole('table', { name: 'Cursor readings' });
  const select = async (name: RegExp) => {
    const row = table.getByRole('row', { name });
    await row.getByRole('cell').last().click();
    await expect(row).toHaveAttribute('aria-current', 'true');
  };
  await select(/^Current peak/);
  await expect(current.getByRole('button', { name: 'Current peak' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(voltage.getByRole('button', { name: 'Voltage peak' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await select(/^Trigger/);
  await expect(chart.locator('.ui-chart__reference[data-highlighted]')).toHaveCount(2);
  await select(/^Edit Cursor name Cursor B/);
  for (const lane of [current, voltage])
    await expect(lane.getByRole('slider', { name: 'B', exact: true })).toHaveAttribute(
      'data-highlighted',
      'true',
    );
  await table.getByRole('button', { name: 'B − A' }).press('Enter');
  await expect(chart.locator('[role=slider][data-highlighted]')).toHaveCount(4);
  await select(/^Peak-to-peak Visible range/i);
  await expect(chart.locator('.ui-linked-line-chart__sample-ring')).toHaveCount(4);
  await select(/^Rise time/);
  await expect(voltage.locator('.ui-linked-line-chart__range')).toBeVisible();
  await select(/^Peak between cursors/);
  await expect(chart.locator('.ui-linked-line-chart__sample-ring')).toHaveCount(2);
  await select(/^Peak-to-peak between cursors/);
  await expect(chart.locator('.ui-linked-line-chart__sample-ring')).toHaveCount(4);
});
