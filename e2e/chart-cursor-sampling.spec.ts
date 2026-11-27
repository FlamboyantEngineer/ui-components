import { expect, test } from './fixtures.js';

test('UIC-CHART-15.2 snaps dense readings and interpolates during a narrow, zoomed drag', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await lab.open('chart');
  const capture = page.getByRole('figure', { name: 'Captured signals' });
  await capture.getByRole('button', { name: /^Edit Cursor A / }).click();
  const time = capture.getByRole('textbox', { name: 'Cursor A', exact: true });
  await time.fill('324.01 ns');
  await time.press('Enter');
  const peak = capture.getByRole('row', { name: /^Edit Cursor name Cursor A\b/ });
  await expect(peak.getByRole('button', { name: /^Edit Cursor A / })).toContainText('324.00 ns');
  await expect(peak.getByRole('cell', { name: '5', exact: true })).toBeVisible();
  await expect(peak.getByRole('cell', { name: '42', exact: true })).toBeVisible();
  await expect(peak).not.toContainText('@');
  await page.getByRole('tab', { name: 'Frequency response' }).click();
  const chart = page.getByRole('figure', { name: 'Frequency response' });
  const plot = chart.getByRole('group', { name: 'Magnitude', exact: true });
  for (const [name, frequency] of [
    ['A', '1000 Hz'],
    ['B', '1015.47 Hz'],
  ] as const) {
    await chart.getByRole('button', { name: new RegExp('^Edit Cursor ' + name + ' ') }).click();
    const edit = chart.getByRole('textbox', { name: 'Cursor ' + name, exact: true });
    await edit.fill(frequency);
    await edit.press('Enter');
  }
  await plot.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Zoom between cursors' }).click();
  const a = plot.getByRole('slider', { name: 'A', exact: true });
  const b = plot.getByRole('slider', { name: 'B', exact: true });
  const handle = b.locator('rect');
  await handle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await handle.hover({ position: { x: 4, y: 68 } });
  const left = await a.locator('line').boundingBox();
  const right = await b.locator('line').boundingBox();
  if (!left || !right) throw new Error('Missing frequency cursor');
  const y = right.y + right.height / 2;
  await page.mouse.down();
  await expect(b).toHaveAttribute('data-dragging', 'true');
  await page.mouse.move((left.x + right.x) / 2, y, { steps: 6 });
  await page.mouse.up();
  const row = chart.getByRole('row', { name: /^Edit Cursor name Cursor B\b/ });
  await expect(row.getByRole('cell', { name: /^≈/ })).toHaveCount(2);
  await expect(row).not.toContainText('@');
  expect(Number(await b.getAttribute('data-coordinate'))).toBeCloseTo(1007.7, 0);
  await expect(b).toHaveAttribute('aria-valuetext', /≈/);
  expect(await b.locator('circle').getAttribute('cx')).toBe(
    await b.locator('line').getAttribute('x1'),
  );
  await b.press('Home');
  await expect(row.getByRole('cell', { name: '-3.01', exact: true })).toBeVisible();
  await b.press('ArrowRight');
  await expect(row.getByRole('cell', { name: /^≈/ })).toHaveCount(2);
});
