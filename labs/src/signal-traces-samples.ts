// Deterministic display samples for the signal traces lab: a few smooth, generic signals.

import type {
  SignalChannel,
  SignalSample,
  SignalTimeRange,
} from '../../src/components/signal-traces/index.js';

/** `count` evenly spaced times across `window`, both ends included. */
function sampleTimes(window: SignalTimeRange, count: number): number[] {
  const step = (window[1] - window[0]) / (count - 1);
  return Array.from({ length: count }, (_, index) => window[0] + index * step);
}

/** Samples of `wave` at `count` times across `window`. */
function sample(
  window: SignalTimeRange,
  count: number,
  wave: (time: number) => number | null,
): SignalSample[] {
  return sampleTimes(window, count).map((time) => ({ time, value: wave(time) }));
}

/** Three channels over a window in seconds: a level with a reference and envelope, a rate, a gauge. */
export function createSlowChannels(window: SignalTimeRange, count = 400): SignalChannel[] {
  const level = (time: number) => 5 + 0.6 * Math.sin(time * 9) + 0.15 * Math.sin(time * 61);
  return [
    {
      id: 'level',
      label: 'Level',
      unit: 'V',
      samples: sample(window, count, level),
      reference: sample(window, 40, () => 5),
      envelope: sampleTimes(window, 40).map((time) => ({ time, lower: 4.2, upper: 5.8 })),
    },
    {
      id: 'rate',
      label: 'Rate',
      unit: 'A',
      samples: sample(window, count, (time) => 1.2 * Math.cos(time * 4) * Math.exp(-time / 3)),
      reference: sample(window, 40, () => 0),
    },
    {
      id: 'gauge',
      label: 'Gauge',
      unit: '°C',
      // A gap where the gauge reported nothing.
      samples: sample(window, count, (time) =>
        time % 1 > 0.55 && time % 1 < 0.62 ? null : 21 + 2 * Math.sin(time * 1.7),
      ),
    },
  ];
}

/** A damped ringing step over a few hundred nanoseconds, in seconds, with its settling envelope. */
export function createFastChannels(): SignalChannel[] {
  const window: SignalTimeRange = [0, 400e-9];
  const ring = (time: number) =>
    time < 40e-9 ? 0 : 1 - Math.exp(-(time - 40e-9) / 60e-9) * Math.cos((time - 40e-9) * 1.2e8);
  return [
    {
      id: 'edge',
      label: 'Edge',
      unit: 'V',
      samples: sample(window, 401, ring),
      reference: sample(window, 41, (time) => (time < 40e-9 ? 0 : 1)),
      envelope: sampleTimes(window, 81).map((time) => ({
        time,
        lower: time < 40e-9 ? -0.05 : 1 - Math.exp(-(time - 40e-9) / 60e-9),
        upper: time < 40e-9 ? 0.05 : 1 + Math.exp(-(time - 40e-9) / 60e-9),
      })),
    },
    {
      id: 'sense',
      label: 'Sense',
      unit: 'mA',
      samples: sample(window, 401, (time) => 20 * Math.exp(-Math.abs(time - 60e-9) / 25e-9)),
    },
  ];
}
