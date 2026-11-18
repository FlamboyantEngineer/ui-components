import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

/** Each drawn event's start edge as a share of the plot's width, in percent. */
async function readOffsets(timeline: Locator, edge: 'left' | 'right' = 'left') {
  return timeline.locator('.ui-event-timeline__plot').evaluate((plot, side) => {
    const box = plot.getBoundingClientRect();
    return [...plot.querySelectorAll<HTMLElement>('.ui-event-timeline__event')].map((event) => {
      const rect = event.getBoundingClientRect();
      const kind = event.dataset.kind;
      // A marker is a target centred on its time; an interval starts at its time.
      const start =
        kind === 'marker' ? rect.left + rect.width / 2 : side === 'left' ? rect.left : rect.right;
      const share = side === 'left' ? start - box.left : box.right - start;
      return Math.round((share / box.width) * 1000) / 10;
    });
  }, edge);
}

test.describe('Event Timeline lab', () => {
  test('UIC-EVENT-TIMELINE-1.1 UIC-EVENT-TIMELINE-1.3 UIC-EVENT-TIMELINE-1.4 draws events at exact shares in lanes', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const timeline = matrixCell(page, 'content=markers and intervals').getByRole('group', {
      name: 'Run: markers and intervals',
    });
    expect(await readOffsets(timeline)).toEqual([0, 10, 46.7, 46.7, 61.7, 66.7, 93.3]);
    const warmUp = await timeline.getByRole('button', { name: 'Warm-up' }).boundingBox();
    const plot = await timeline.locator('.ui-event-timeline__plot').boundingBox();
    expect(Math.round(((warmUp?.width ?? 0) / (plot?.width ?? 1)) * 1000) / 10).toBe(26.7);
    // The coincident samples sit in separate lanes, one above the other.
    const sampleA = await timeline.getByRole('button', { name: 'Sample A' }).boundingBox();
    const sampleB = await timeline.getByRole('button', { name: 'Sample B' }).boundingBox();
    expect(sampleA?.x).toBe(sampleB?.x);
    expect((sampleB?.y ?? 0) - (sampleA?.y ?? 0)).toBeGreaterThanOrEqual(28);
    await expect(timeline).toHaveCSS('--ui-event-timeline-lanes', '3');
    await lab.expectAccessible();
  });

  test('UIC-EVENT-TIMELINE-1.4 stacks three coincident markers', async ({ page, lab }) => {
    await lab.open('event-timeline');
    const timeline = matrixCell(page, 'content=coincident').getByRole('group');
    const tops = await Promise.all(
      ['Open', 'Open again', 'Echo'].map(
        async (name) =>
          (await timeline.getByRole('button', { name, exact: true }).boundingBox())?.y ?? 0,
      ),
    );
    expect(new Set(tops).size).toBe(3);
  });

  test('UIC-EVENT-TIMELINE-1.3 UIC-EVENT-TIMELINE-1.5 keeps microsecond and sub-microsecond durations proportional', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const sub = matrixCell(page, 'content=sub-microsecond').getByRole('group');
    expect(await readOffsets(sub)).toEqual([12, 31, 70]);
    const glitch = await sub.getByRole('button', { name: 'Glitch' }).boundingBox();
    const plot = await sub.locator('.ui-event-timeline__plot').boundingBox();
    expect(Math.round(((glitch?.width ?? 0) / (plot?.width ?? 1)) * 1000) / 10).toBe(4.5);
    await expect(sub.locator('.ui-event-timeline__tick-label').last()).toHaveText('0.0000010');
    await expect(sub.locator('.ui-event-timeline__unit')).toHaveText('s');
    const micro = matrixCell(page, 'content=microseconds').getByRole('group');
    await expect(micro.getByRole('button', { name: 'Pulse' })).toHaveAccessibleDescription(
      'At 0.0000025\u00a0s, lasting 0.0000004\u00a0s',
    );
    await expect(micro.getByRole('row').nth(2)).toHaveText(
      /Pulse\s*0\.0000025\u00a0s\s*0\.0000004\u00a0s/,
    );
  });

  test('UIC-EVENT-TIMELINE-1.6 keeps the axis without events', async ({ page, lab }) => {
    await lab.open('event-timeline');
    const empty = matrixCell(page, 'content=empty').getByRole('group', { name: 'Run: empty' });
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty.locator('.ui-event-timeline__empty')).toHaveText('No data');
    await expect(empty.locator('.ui-event-timeline__tick-label')).toHaveText([
      '0',
      '2',
      '4',
      '6',
      '8',
      '10',
    ]);
    await expect(empty.getByRole('button')).toHaveCount(0);
  });

  test('UIC-EVENT-TIMELINE-2.1 UIC-EVENT-TIMELINE-2.2 moves through time by keyboard and shows details', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const timeline = matrixCell(page, 'content=markers and intervals').getByRole('group', {
      name: 'Run: markers and intervals',
    });
    await timeline.getByRole('button', { name: 'Start' }).focus();
    await page.keyboard.press('ArrowRight');
    const warmUp = timeline.getByRole('button', { name: 'Warm-up' });
    await expect(warmUp).toBeFocused();
    await expect(warmUp).toHaveAttribute('data-current', 'true');
    const details = timeline.locator('.ui-event-timeline__details');
    await expect(details.locator('.ui-event-timeline__details-label')).toHaveText('Warm-up');
    await expect(details.locator('.ui-event-timeline__details-list')).toHaveText(
      /Start\s*1\.5\u00a0ms\s*Duration\s*4\u00a0ms/,
    );
    await expect(warmUp).toHaveAccessibleDescription(
      'At 1.5\u00a0ms, lasting 4\u00a0ms Heater on until the reading settles.',
    );
    await page.keyboard.press('End');
    await expect(timeline.getByRole('button', { name: 'Stop' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(timeline.getByRole('button', { name: 'Start' })).toBeFocused();
    await timeline.getByRole('button', { name: 'Fault' }).click();
    await expect(details.locator('.ui-event-timeline__details-body')).toHaveText(
      'Reading out of bounds.',
    );
    await lab.expectAccessible();
  });

  test('UIC-EVENT-TIMELINE-2.2 follows the host controlled current event', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const demo = page.locator('[data-lab-demo="controlled"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('.ui-event-timeline__details-label')).toHaveText('Pause');
    await demo.getByRole('button', { name: 'Next event' }).click();
    await expect(demo.locator('.ui-event-timeline__details-label')).toHaveText('Fault');
    await expect(demo.getByRole('button', { name: 'Fault' })).toHaveAttribute('tabindex', '0');
    await demo.getByRole('button', { name: 'Sample A' }).click();
    await expect(demo.getByText('Current: sample-a')).toBeVisible();
  });

  test('UIC-EVENT-TIMELINE-1.3 UIC-EVENT-TIMELINE-3.1 cuts intervals at the range and lists every event', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const demo = page.locator('[data-lab-demo="clipped"]');
    await expect(demo.getByRole('button', { name: 'Warm-up' })).toHaveAttribute(
      'data-clipped',
      'start',
    );
    await expect(demo.getByRole('button', { name: 'Pause' })).toHaveAttribute(
      'data-clipped',
      'end',
    );
    await expect(demo.getByRole('button', { name: 'Start' })).toHaveCount(0);
    const table = demo.getByRole('table', { name: 'Middle of the run' });
    await expect(table.getByRole('rowheader')).toHaveText([
      'Start',
      'Warm-up',
      'Sample A',
      'Sample B',
      'Pause',
      'Fault',
      'Stop',
    ]);
  });

  test('UIC-EVENT-TIMELINE-1.5 UIC-EVENT-TIMELINE-3.1 writes the caller formats in the details and the table', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const demo = page.locator('[data-lab-demo="formatters"]');
    await expect(demo.locator('.ui-event-timeline__tick-label')).toHaveText([
      '0',
      '2,000',
      '4,000',
      '6,000',
      '8,000',
    ]);
    await expect(demo.locator('.ui-event-timeline__details-list')).toHaveText(
      /Start\s*2,500 ns\s*Duration\s*400 ns/,
    );
    await expect(demo.getByRole('row').nth(3)).toHaveText(/Echo\s*6,000 ns\s*1,500 ns/);
  });

  test('UIC-EVENT-TIMELINE-2.2 updates the details when the data window changes', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const demo = page.locator('[data-lab-demo="window"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('.ui-event-timeline__details-list')).toHaveText(/5\u00a0ms/);
    await demo.getByRole('button', { name: 'Next window' }).click();
    await expect(demo.locator('.ui-event-timeline__details-list')).toHaveText(/15\u00a0ms/);
    await expect(demo.getByRole('button', { name: 'Window 2 open' })).toBeVisible();
    await expect(demo.locator('.ui-event-timeline__tick-label').first()).toHaveText('10');
    expect(await readOffsets(demo.getByRole('group', { name: 'Data window' }))).toEqual([
      10, 50, 60,
    ]);
  });

  test('UIC-EVENT-TIMELINE-1.3 UIC-EVENT-TIMELINE-2.1 runs from the right edge right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('event-timeline');
    const demo = page.locator('[data-lab-demo="rtl"]');
    await demo.scrollIntoViewIfNeeded();
    const timeline = demo.getByRole('group', { name: 'Run, right to left' });
    const offsets = await readOffsets(timeline, 'right');
    expect(offsets[0]).toBeLessThan(offsets[3] ?? 0);
    await timeline.getByRole('button', { name: 'Open', exact: true }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(timeline.getByRole('button', { name: 'Open again' })).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="rtl"]');
  });
});
