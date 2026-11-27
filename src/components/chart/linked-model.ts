import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import { type LinkedChartCursorSample, readCursorSample } from './cursor-sampling.js';
import {
  drawBand,
  drawTrace,
  findChannelExtent,
  findNearestSample,
  type LinkedChartChannel,
  measureChannel,
  orderSamples,
  sliceSamples,
} from './linked-channel.js';
import {
  type ChartAxisScale,
  createNumericAxis,
  findAxisExtent,
  isAxisRange,
  isAxisValue,
} from './numeric-axis.js';

export function prepareChannel(channel: LinkedChartChannel, height: number) {
  const kind = channel.yScale ?? 'linear';
  const domain =
    channel.yRange && isAxisRange(channel.yRange, kind)
      ? channel.yRange
      : findChannelExtent(channel);
  const y = createNumericAxis({
    domain,
    range: [height - 28, 12],
    kind,
    format: channel.formatY,
    tickCount: 4,
  });
  const samples = orderSamples(channel.samples);
  return {
    channel,
    y,
    samples,
    measured: samples.filter((p) => isAxisValue(p.y ?? NaN, kind)),
    reference: orderSamples(channel.reference ?? []),
  };
}

/** Scan the original grid once per capture, including comparison-only and band-only channels. */
export function getCaptureDomain(channels: readonly LinkedChartChannel[], kind: ChartAxisScale) {
  let hasData = false;
  function* coordinates() {
    for (const channel of channels) {
      const validY = (value: number | null | undefined) =>
        isAxisValue(value ?? NaN, channel.yScale ?? 'linear');
      for (const p of channel.samples) {
        if (!isAxisValue(p.x, kind)) continue;
        if (
          validY(p.y) ||
          (validY(p.lower) && validY(p.upper) && Number(p.lower) <= Number(p.upper))
        )
          hasData = true;
        yield p.x;
      }
      for (const p of channel.reference ?? []) {
        if (!isAxisValue(p.x, kind)) continue;
        if (validY(p.y)) hasData = true;
        yield p.x;
      }
    }
  }
  const extent = findAxisExtent(coordinates(), kind);
  return { hasData, extent };
}

export function drawChannel(prepared: ReturnType<typeof prepareChannel>, x: LinearScale) {
  const { channel, y } = prepared;
  const samples = sliceSamples(prepared.samples, x.domain);
  const visible = samples.filter((p) => Number.isFinite(x.map(p.x)));
  const line = drawTrace(samples, x, y);
  const comparison = drawTrace(sliceSamples(prepared.reference, x.domain), x, y);
  return {
    channel,
    x,
    y,
    line,
    source: prepared.samples,
    measured: prepared.measured,
    reference: comparison.path,
    band: drawBand(samples, x, y),
    points: (channel.points ?? []).filter((p) => Number.isFinite(p.y) && Number.isFinite(p.x)),
    measurements: measureChannel(visible, channel, x.domain),
  };
}

export type DrawnChannel = ReturnType<typeof drawChannel>;

export interface LinkedChartReading {
  channelId: LinkedChartChannel['id'];
  /** Full-resolution readings at A and B. Interpolated values carry interpolated: true. */
  samples: readonly [LinkedChartCursorSample | null, LinkedChartCursorSample | null];
  /** Signed amplitude difference B minus A, in this channel's units. */
  deltaY: number | null;
  /** Full-resolution peak-to-peak amplitude over the visible x range. */
  peakToPeak: number | null;
}

export interface LinkedChartReadout {
  /** Absolute separation in the host's x units, also for logarithmic axes. */
  deltaX: number;
  channels: readonly LinkedChartReading[];
}

export function readDisplayedSample(lane: DrawnChannel, at: number) {
  return at >= lane.x.domain[0] && at <= lane.x.domain[1]
    ? findNearestSample(lane.line.displayed, at, lane.x)
    : null;
}

export function readCursors(
  lanes: readonly DrawnChannel[],
  cursors: ScaleInterval,
): LinkedChartReadout {
  return {
    deltaX: Math.abs(cursors[1] - cursors[0]),
    channels: lanes.map((lane) => {
      const { channel, measurements } = lane;
      const a = readCursorSample(lane, cursors[0]);
      const b = readCursorSample(lane, cursors[1]);
      return {
        channelId: channel.id,
        samples: [a, b],
        peakToPeak: measurements.peakToPeak,
        deltaY: a?.y != null && b?.y != null ? b.y - a.y : null,
      };
    }),
  };
}
