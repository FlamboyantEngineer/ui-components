import type { ScaleInterval } from '../../utils/linear-scale.js';
import { differentialKey, type LinkedChartDifferentialReading } from './chart-differentials.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { LinkedChartHighlight } from './linked-measurements.js';
import type { DrawnChannel } from './linked-model.js';

function sampleRing(
  lane: DrawnChannel,
  point: { x: number; y: number | null },
  key: string | number,
) {
  if (point.y === null) return null;
  const cx = lane.x.map(point.x);
  const cy = lane.y.map(point.y);
  return Number.isFinite(cx) && Number.isFinite(cy) ? (
    <circle key={key} {...hooks.slot('sample-ring')} cx={cx} cy={cy} r={5} fill="none" />
  ) : null;
}

/** Intersect in data units before mapping: this also clips an interval whose handles are both offscreen. */
function intervalBox(lane: DrawnChannel, axis: 'x' | 'y', ends: ScaleInterval) {
  const scale = lane[axis];
  const low = Math.max(scale.domain[0], Math.min(...ends));
  const high = Math.min(scale.domain[1], Math.max(...ends));
  if (!(low < high)) return null;
  const [left, right] = lane.x.range;
  const [bottom, top] = lane.y.range;
  const a = scale.map(low),
    b = scale.map(high);
  return axis === 'x'
    ? { x: a, y: top, width: b - a, height: bottom - top }
    : { x: left, y: b, width: right - left, height: a - b };
}

export function DifferentialBands({
  lane,
  readings,
  selected,
}: {
  lane: DrawnChannel;
  readings: readonly LinkedChartDifferentialReading[];
  selected: string | undefined;
}) {
  return readings.map(({ cursor, from, to }) => {
    if (
      from === null ||
      to === null ||
      (cursor.axis === 'y' && cursor.channelId !== lane.channel.id)
    )
      return null;
    const box = intervalBox(lane, cursor.axis, [from, to]);
    if (!box) return null;
    const key = differentialKey(cursor.id);
    return (
      <rect
        key={key}
        {...hooks.slot('delta-band', {
          axis: cursor.axis,
          key: cursor.id,
          highlighted: key === selected,
        })}
        {...box}
        aria-hidden="true"
        pointerEvents="none"
        fill="currentColor"
        fillOpacity={0.08}
      />
    );
  });
}

/** Selection overlays use source coordinates and never intercept plot gestures. */
export function MeasurementHighlights({
  lane,
  highlights,
  extrema,
  clip,
}: {
  lane: DrawnChannel;
  highlights: readonly LinkedChartHighlight[];
  extrema: boolean;
  clip: string;
}) {
  const { minSample, maxSample } = lane.measurements;
  return (
    <g aria-hidden="true" pointerEvents="none" clipPath={`url(#${clip})`}>
      {extrema && [minSample, maxSample].map((p, i) => p && sampleRing(lane, p, 'extreme-' + i))}
      {highlights.map((target, i) => {
        if (target.channelId !== undefined && target.channelId !== lane.channel.id) return null;
        if (target.type === 'sample') return sampleRing(lane, target, i);
        if (target.type !== 'interval') return null;
        const box = intervalBox(lane, 'x', [target.from, target.to]);
        return box ? <rect key={i} {...hooks.slot('range')} {...box} /> : null;
      })}
    </g>
  );
}
