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
  const [bottom, top] = lane.y.range;
  const { minSample, maxSample } = lane.measurements;
  return (
    <g aria-hidden="true" pointerEvents="none" clipPath={`url(#${clip})`}>
      {extrema && [minSample, maxSample].map((p, i) => p && sampleRing(lane, p, 'extreme-' + i))}
      {highlights.map((target, i) => {
        if (target.channelId !== undefined && target.channelId !== lane.channel.id) return null;
        if (target.type === 'sample') return sampleRing(lane, target, i);
        if (target.type !== 'interval') return null;
        const low = Math.max(lane.x.domain[0], Math.min(target.from, target.to));
        const high = Math.min(lane.x.domain[1], Math.max(target.from, target.to));
        if (!(low < high)) return null;
        const x = lane.x.map(low),
          end = lane.x.map(high);
        return (
          <rect
            key={i}
            {...hooks.slot('range')}
            x={x}
            y={top}
            width={end - x}
            height={bottom - top}
          />
        );
      })}
    </g>
  );
}
