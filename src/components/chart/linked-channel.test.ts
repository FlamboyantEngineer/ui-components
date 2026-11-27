import { describe, expect, it } from 'vitest';
import { drawChannel, prepareChannel, readCursors } from './linked-model.js';
import { createNumericAxis } from './numeric-axis.js';

const samples = Array.from({ length: 20000 }, (_, x) => ({
  x: x * 1e-11,
  y: x === 8500 ? 4 : x === 8501 ? -3 : x === 9000 ? null : 0,
  lower: -1,
  upper: 1,
}));
const channel = { id: 'v', label: 'Voltage', threshold: 1, samples };
const prepare = prepareChannel(channel, 180);
const axis = createNumericAxis({ kind: 'linear', domain: [0, 19999e-11], range: [0, 200] });

describe('linked measurements', () => {
  it('UIC-CHART-15.1 UIC-CHART-15.2 preserves same-pixel extremes in source order and breaks at missing samples', () => {
    const lane = drawChannel(prepare, axis);
    expect(lane.line.displayed.length).toBeLessThan(810);
    expect(lane.line.displayed.filter((p) => p.y === 4 || p.y === -3)).toEqual(
      samples.slice(8500, 8502),
    );
    expect(lane.line.path.match(/M/g)).toHaveLength(2);
    expect(lane.band).toContain('Z');
    expect(lane.measurements).toMatchObject({
      min: samples[8501]?.x,
      max: samples[8500]?.x,
      peakToPeak: 7,
      outside: samples[8500]?.x,
    });
    const zoom = createNumericAxis({
      kind: 'linear',
      domain: [8495e-11, 8510e-11],
      range: [0, 200],
    });
    const detailed = drawChannel(prepare, zoom);
    const readout = readCursors([detailed], [8498e-11, 8501e-11]);
    expect(readout.channels[0]?.samples[0]).toBe(samples[8498]);
    expect(readout.channels[0]?.samples[1]).toBe(samples[8501]);
    expect(readout.channels[0]?.deltaY).toBe(-3);
    expect(readout.deltaX).toBeCloseTo(3e-11, 20);
  });
  it('UIC-CHART-15.3 interpolates threshold crossings on raw adjacent samples and excludes missing runs', () => {
    const data = {
      ...channel,
      samples: [
        { x: 0, y: 0 },
        { x: 1, y: null },
        { x: 2, y: 2 },
        { x: 3, y: 0 },
        { x: 4, y: 2 },
      ],
    };
    const x = createNumericAxis({ kind: 'linear', domain: [0, 4], range: [0, 200] });
    expect(drawChannel(prepareChannel(data, 120), x).measurements).toMatchObject({
      rising: 3.5,
      falling: 2.5,
      outside: undefined,
    });
  });
  it('UIC-CHART-15.2 interpolates amplitudes along a logarithmic x axis', () => {
    const data = {
      ...channel,
      samples: [
        { x: 1, y: 5 },
        { x: 10, y: 2 },
      ],
    };
    const x = createNumericAxis({ kind: 'log', domain: [1, 10], range: [0, 200] });
    const result = readCursors([drawChannel(prepareChannel(data, 120), x)], [2, 4]);
    for (const reading of result.channels[0]?.samples ?? []) {
      expect(reading?.interpolated).toBe(true);
      expect(reading?.y).toBeCloseTo(5 - 3 * Math.log10(reading?.x ?? NaN), 12);
    }
  });
});
