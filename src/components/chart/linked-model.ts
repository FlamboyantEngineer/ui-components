import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import {
  drawBand,
  drawTrace,
  findChannelExtent,
  findNearestSample,
  type LinkedChartChannel,
  type LinkedChartSample,
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
  return {
    channel,
    y,
    samples: orderSamples(channel.samples),
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
    reference: comparison.path,
    band: drawBand(samples, x, y),
    measurements: measureChannel(visible, channel, x.domain),
  };
}

export type DrawnChannel = ReturnType<typeof drawChannel>;

export interface LinkedChartReading {
  channelId: LinkedChartChannel['id'];
  /** Nearest displayed source samples for cursors A and B. */
  samples: readonly [LinkedChartSample | null, LinkedChartSample | null];
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

export function readCursors(
  lanes: readonly DrawnChannel[],
  cursors: ScaleInterval,
): LinkedChartReadout {
  return {
    deltaX: Math.abs(cursors[1] - cursors[0]),
    channels: lanes.map(({ line, channel, measurements, x: axis }) => {
      const read = (x: number) =>
        x >= axis.domain[0] && x <= axis.domain[1]
          ? findNearestSample(line.displayed, x, axis)
          : null;
      const a = read(cursors[0]);
      const b = read(cursors[1]);
      return {
        channelId: channel.id,
        samples: [a, b],
        peakToPeak: measurements.peakToPeak,
        deltaY: a?.y != null && b?.y != null ? b.y - a.y : null,
      };
    }),
  };
}
