import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const plotOf = (scope: Locator) => scope.getByRole('group', { name: 'Signal traces' });
const rangeOf = (scope: Locator) => scope.locator('.ui-signal-traces__range');
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

/** The two numbers a range's text holds, such as `1.2 s to 3.2 s`. */
async function readNumbers(text: Locator): Promise<[number, number]> {
  const [start = '', end = ''] = (await text.textContent())?.match(/-?[\d.]+/g) ?? [];
  return [Number(start), Number(end)];
}

/** The horizontal middle and a point inside the first channel's band of a plot, in the viewport. */
async function plotPoint(plot: Locator, share: number) {
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  if (!box) throw new Error('The plot has no box.');
  return { x: box.x + box.width * share, y: box.y + 60 };
}

test.describe('Signal Traces lab', () => {
  test('UIC-SIGNAL-TRACES-1.1 UIC-SIGNAL-TRACES-1.2 UIC-SIGNAL-TRACES-1.4 draws stacked channels on one time axis and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const linked = demo(page, 'linked');
    await expect(linked.locator('.ui-signal-traces__channel')).toHaveCount(3);
    await expect(linked.locator('.ui-signal-traces__time-axis')).toHaveCount(1);
    await expect(linked.locator('.ui-signal-traces__value-axis')).toHaveCount(3);
    await expect(linked.locator('.ui-signal-traces__reference')).toHaveCount(2);
    await expect(linked.locator('.ui-signal-traces__envelope')).toHaveCount(1);
    // The gauge's gap breaks its trace into separate runs.
    const gauge = linked.locator('.ui-signal-traces__trace[data-channel="2"]');
    expect((await gauge.getAttribute('d'))?.match(/M/g)?.length).toBeGreaterThan(1);
    // The plot fills the measured width, and the bands do not overlap.
    const drawing = await linked.locator('.ui-signal-traces__drawing').boundingBox();
    const plot = await plotOf(linked).boundingBox();
    expect(Math.abs((drawing?.width ?? 0) - (plot?.width ?? 0))).toBeLessThan(2);
    const bands = await linked
      .locator('.ui-signal-traces__channel')
      .evaluateAll((elements) =>
        elements.map((element) => (element as SVGGraphicsElement).getBBox()),
      );
    for (let index = 1; index < bands.length; index += 1) {
      const previous = bands[index - 1];
      const band = bands[index];
      expect((previous?.y ?? 0) + (previous?.height ?? 0)).toBeLessThanOrEqual((band?.y ?? 0) + 1);
    }
    await lab.expectAccessible('[data-lab-demo="linked"]');
  });

  test('UIC-SIGNAL-TRACES-2.3 pans, zooms and resets from the keyboard and the toolbar', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const linked = demo(page, 'linked');
    const plot = plotOf(linked);
    await expect(rangeOf(linked)).toHaveText('0 s to 4 s');
    await plot.focus();
    await page.keyboard.press('+');
    await expect(rangeOf(linked)).toHaveText('1 s to 3 s');
    await expect(output(page, 'range')).toHaveText('1 s 3 s');
    await page.keyboard.press('ArrowRight');
    await expect(rangeOf(linked)).toHaveText('1.2 s to 3.2 s');
    await page.keyboard.press('-');
    await expect(rangeOf(linked)).toHaveText('0 s to 4 s');
    await linked.getByRole('button', { name: 'Zoom in' }).click();
    await linked.getByRole('button', { name: 'Zoom in' }).click();
    await expect(rangeOf(linked)).toHaveText('1.5 s to 2.5 s');
    await linked.getByRole('button', { name: 'Reset zoom' }).click();
    await expect(rangeOf(linked)).toHaveText('0 s to 4 s');
    await expect(linked.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();
  });

  test('UIC-SIGNAL-TRACES-2.2 pans by dragging and zooms with the Ctrl wheel at the pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const linked = demo(page, 'linked');
    const plot = plotOf(linked);
    await plot.focus();
    await page.keyboard.press('+');
    await expect(rangeOf(linked)).toHaveText('1 s to 3 s');
    const from = await plotPoint(plot, 0.6);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 60, from.y, { steps: 4 });
    await page.mouse.up();
    await expect(rangeOf(linked)).not.toHaveText('1 s to 3 s');
    const [panned] = await readNumbers(output(page, 'range'));
    expect(panned).toBeGreaterThan(1);
    const at = await plotPoint(plot, 0.5);
    await page.mouse.move(at.x, at.y);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Control');
    await expect(async () => {
      const [start, end] = await readNumbers(output(page, 'range'));
      expect(end - start).toBeLessThan(1.5);
    }).toPass();
  });

  test('UIC-SIGNAL-TRACES-3.1 UIC-SIGNAL-TRACES-3.2 moves linked cursors and reads every channel', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const linked = demo(page, 'linked');
    const first = linked.getByRole('slider', { name: 'Cursor 1' });
    const second = linked.getByRole('slider', { name: 'Cursor 2' });
    await expect(first).toHaveAttribute('aria-valuetext', '1.333 s');
    await expect(second).toHaveAttribute('aria-valuetext', '2.667 s');
    const table = linked.getByRole('table', { name: 'Cursor readings' });
    await expect(table.getByRole('row')).toHaveCount(5);
    await expect(linked.locator('.ui-signal-traces__delta')).toHaveText('Time difference: 1.333 s');
    await first.focus();
    await page.keyboard.press('Home');
    await expect(first).toHaveAttribute('aria-valuetext', '0 s');
    await expect(table.getByRole('row').nth(1)).toHaveText(/0 s/);
    await expect(linked.locator('.ui-signal-traces__delta')).toHaveText('Time difference: 2.667 s');
    await expect(output(page, 'cursors')).toHaveText('0 s 2.667 s');
    // Dragging the second cursor's handle moves it to the time under the pointer.
    await second.scrollIntoViewIfNeeded();
    const handle = await second.boundingBox();
    const plot = await plotOf(linked).boundingBox();
    if (!handle || !plot) throw new Error('The cursor has no box.');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 20);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 80, handle.y + 20, { steps: 4 });
    await page.mouse.up();
    await expect(rangeOf(linked)).toHaveText('0 s to 4 s');
    const valueNow = Number(await second.getAttribute('aria-valuenow'));
    expect(valueNow).toBeGreaterThan(2.667);
    await expect(linked.locator('.ui-signal-traces__cursor-line')).toHaveCount(2);
  });

  test('UIC-SIGNAL-TRACES-1.3 UIC-SIGNAL-TRACES-2.1 draws a sub-microsecond window with controlled state', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const fast = demo(page, 'fast');
    await expect(rangeOf(fast)).toHaveText('20 ns to 220 ns');
    await expect(fast.locator('.ui-signal-traces__time-axis .ui-chart-axis__label')).toContainText([
      /\d+ ns/,
    ]);
    await expect(fast.locator('.ui-signal-traces__delta')).toHaveText('Time difference: 60 ns');
    const plot = plotOf(fast);
    await plot.focus();
    for (let step = 0; step < 12; step += 1) await page.keyboard.press('+');
    const [start, end] = await readNumbers(rangeOf(fast));
    expect(end - start).toBeLessThan(0.1);
    expect(end - start).toBeGreaterThan(0);
    await expect(fast.locator('.ui-signal-traces__trace[data-channel="0"]')).toHaveAttribute(
      'd',
      /^M/,
    );
    await page.keyboard.press('0');
    await expect(rangeOf(fast)).toHaveText('0 ns to 400 ns');
    await expect(output(page, 'fast-range')).toHaveText('0 ns 400 ns');
    await fast.getByRole('button', { name: 'Cursors to view edges' }).click();
    await expect(fast.getByRole('slider', { name: 'Cursor 2' })).toHaveAttribute(
      'aria-valuetext',
      '400 ns',
    );
    await expect(fast.locator('.ui-signal-traces__delta')).toHaveText('Time difference: 400 ns');
    await lab.expectAccessible('[data-lab-demo="fast"]');
  });

  test('UIC-SIGNAL-TRACES-1.5 shows an empty channel beside one with data', async ({
    page,
    lab,
  }) => {
    await lab.open('signal-traces');
    const empty = demo(page, 'empty');
    const idle = empty.locator('.ui-signal-traces__channel[data-channel="1"]');
    await expect(idle).toHaveAttribute('data-empty', 'true');
    await expect(idle.locator('.ui-signal-traces__empty')).toHaveText('No data');
    await expect(empty.locator('.ui-signal-traces__channel[data-channel="0"]')).not.toHaveAttribute(
      'data-empty',
    );
    const row = empty.getByRole('row', { name: /Idle/ });
    await expect(row.getByRole('cell')).toHaveText(['', '']);
  });

  test('UIC-SIGNAL-TRACES-2.4 starts again over a changed data window', async ({ page, lab }) => {
    await lab.open('signal-traces');
    const rolling = demo(page, 'window');
    await expect(rangeOf(rolling)).toHaveText('0.5 s to 1 s');
    await rolling.getByRole('button', { name: 'Next window' }).click();
    await expect(output(page, 'window')).toHaveText('2 s 4 s');
    await expect(rangeOf(rolling)).toHaveText('2 s to 4 s');
    await expect(rolling.getByRole('slider', { name: 'Cursor 1' })).toHaveAttribute(
      'aria-valuetext',
      '2.667 s',
    );
    await expect(rolling.locator('.ui-signal-traces__trace[data-channel="0"]')).toHaveAttribute(
      'd',
      /^M/,
    );
  });
});
