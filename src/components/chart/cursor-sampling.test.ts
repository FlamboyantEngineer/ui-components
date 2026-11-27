import { expect, it } from 'vitest';
import { readCursorSample, snapCursorX } from './cursor-sampling.js';
import type { LinkedChartSample } from './linked-channel.js';
import { drawChannel, prepareChannel } from './linked-model.js';
import { createNumericAxis } from './numeric-axis.js';

const axis = createNumericAxis({ kind: 'linear', domain: [0, 100], range: [0, 200] });
function draw(samples: LinkedChartSample[], x = axis) {
  return drawChannel(prepareChannel({ id: 1, label: 'Trace', samples }, 120), x);
}

it('UIC-CHART-15.2 snaps to full-resolution samples omitted by drawing reduction', () => {
  const samples = Array.from({ length: 10001 }, (_, i) => ({ x: i / 100, y: i % 71 }));
  const lane = draw(samples);
  const sample = samples.find((p) => !lane.line.displayed.includes(p));
  if (!sample) throw new Error('Expected the dense trace to be reduced');
  const x = snapCursorX([lane], sample.x + 0.003);
  expect(x).toBe(sample.x);
  expect(readCursorSample(lane, x)).toBe(sample);
});

it('UIC-CHART-15.2 snaps by pixel distance and evaluates independent grids at one coordinate', () => {
  const a = draw([
    { x: 20, y: 4 },
    { x: 80, y: 10 },
  ]);
  const b = draw([
    { x: 12, y: 10 },
    { x: 28, y: 14 },
  ]);
  expect(snapCursorX([a], 24)).toBe(20);
  expect(snapCursorX([b, a], 24)).toBe(20);
  expect(snapCursorX([a], 50)).toBe(50);
  expect(readCursorSample(a, 50)).toMatchObject({ x: 50, interpolated: true });
  expect(readCursorSample(a, 50)?.y).toBeCloseTo(7);
  expect(readCursorSample(b, 20)?.y).toBeCloseTo(12);
  expect(readCursorSample(b, 50)).toBeNull();
});

it('UIC-CHART-15.2 preserves null breaks and omits values outside the data or viewport', () => {
  const lane = draw([
    { x: 1, y: 1 },
    { x: 30, y: null },
    { x: 60, y: NaN },
    { x: 70, y: 8 },
  ]);
  for (const x of [0, 20, 30, 50, 60, 65, 80]) expect(readCursorSample(lane, x)).toBeNull();
  expect(snapCursorX([lane], 31)).toBe(31);
  const zoom = createNumericAxis({ kind: 'linear', domain: [20, 50], range: [0, 200] });
  const zoomed = draw(
    [
      { x: 19.9, y: 1 },
      { x: 20.2, y: 2 },
    ],
    zoom,
  );
  expect(snapCursorX([zoomed], 20)).toBe(20.2);
  expect(readCursorSample(zoomed, 19.9)).toBeNull();
});

it('UIC-CHART-15.2 interpolates on a log-log segment and rejects nonpositive log amplitudes', () => {
  const x = createNumericAxis({ kind: 'log', domain: [1, 100], range: [0, 200] });
  const samples = [
    { x: 1, y: 1 },
    { x: 10, y: 100 },
    { x: 100, y: 0 },
  ];
  const lane = drawChannel(
    prepareChannel({ id: 1, label: 'Gain', samples, yScale: 'log' }, 120),
    x,
  );
  expect(snapCursorX([lane], 10 ** 1.07)).toBe(10);
  expect(readCursorSample(lane, Math.sqrt(10))?.y).toBeCloseTo(10, 12);
  expect(readCursorSample(lane, 42)).toBeNull();
  expect(readCursorSample(lane, 100)).toBeNull();
});
