import type { Key } from '../../core/props.js';
import type { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { ChartReferenceLine } from './chart-references.js';
import { findNearestSample } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';
import type { LinkedChartCursor } from './use-chart-cursors.js';

/** A number is a free position in source units. An object follows the identified chart element. */
export type LinkedChartEndpoint =
  | number
  | { type: 'point'; channelId: Key; id: Key }
  | { type: 'sample'; channelId: Key; x: number }
  | { type: 'cursor'; name: string }
  | { type: 'marker' | 'reference'; id: Key };

/** X pairs span the linked plots. Y pairs measure amplitude in a single channel. */
export type LinkedChartDifferential = {
  id: Key;
  label: string;
  from: LinkedChartEndpoint;
  to: LinkedChartEndpoint;
} & ({ axis: 'x' } | { axis: 'y'; channelId: Key });

export interface LinkedChartDifferentialReading {
  cursor: LinkedChartDifferential;
  from: number | null;
  to: number | null;
  /** Signed to minus from in source units. Null when either endpoint is unavailable. */
  delta: number | null;
}

export interface DifferentialSources {
  lanes: readonly DrawnChannel[];
  cursors: readonly LinkedChartCursor[];
  markers: readonly ChartReferenceLine[];
  references: readonly ChartReferenceLine[];
}

export function differentialKey(id: Key) {
  return 'differential:' + toKeyIdentity(id);
}

function readPoint(
  pair: LinkedChartDifferential,
  end: Extract<LinkedChartEndpoint, { type: 'point' | 'sample' }>,
  sources: DifferentialSources,
) {
  if (pair.axis === 'y' && pair.channelId !== end.channelId) return null;
  const lane = sources.lanes.find((l) => l.channel.id === end.channelId);
  if (!lane) return null;
  if (end.type === 'point') return lane.points.find((p) => p.id === end.id)?.[pair.axis];
  const sample = findNearestSample(lane.source, end.x, lane.x);
  return sample?.x === end.x ? sample[pair.axis] : null;
}

function projectPosition(
  pair: LinkedChartDifferential,
  x: number | undefined,
  sources: DifferentialSources,
) {
  if (pair.axis === 'x' || x === undefined) return x;
  const lane = sources.lanes.find((l) => l.channel.id === pair.channelId);
  if (
    !lane ||
    !Number.isFinite(lane.x.map(x)) ||
    x < (lane.source[0]?.x ?? Infinity) ||
    x > (lane.source.at(-1)?.x ?? -Infinity)
  )
    return null;
  return findNearestSample(lane.source, x, lane.x)?.y;
}

function anchoredValue(
  pair: LinkedChartDifferential,
  end: LinkedChartEndpoint,
  sources: DifferentialSources,
) {
  if (typeof end === 'number') return end;
  if (end.type === 'point' || end.type === 'sample') return readPoint(pair, end, sources);
  const x =
    end.type === 'cursor'
      ? sources.cursors.find((c) => c.name === end.name)?.x
      : (end.type === 'marker' ? sources.markers : sources.references).find((r) => r.id === end.id)
          ?.value;
  return projectPosition(pair, x, sources);
}

/** Resolve against current keyed data on each render, independently of drawing reduction and zoom. */
export function readDifferential(
  cursor: LinkedChartDifferential,
  sources: DifferentialSources,
): LinkedChartDifferentialReading {
  const scale =
    cursor.axis === 'x'
      ? sources.lanes[0]?.x
      : sources.lanes.find((l) => l.channel.id === cursor.channelId)?.y;
  const value = (end: LinkedChartEndpoint) => {
    const n = anchoredValue(cursor, end, sources);
    return n != null && Number.isFinite(n) && Number.isFinite(scale?.map(n)) ? n : null;
  };
  const from = value(cursor.from),
    to = value(cursor.to);
  const delta = to !== null && from !== null ? to - from : null;
  return { cursor, from, to, delta: Number.isFinite(delta) ? delta : null };
}

export function endpointLabel(
  end: LinkedChartEndpoint,
  sources: DifferentialSources,
  s: ReturnType<typeof useUiStrings>,
) {
  if (typeof end === 'number') return s.chartFreePosition;
  switch (end.type) {
    case 'cursor':
      return s.chartCursor(sources.cursors.find((c) => c.name === end.name)?.label ?? end.name);
    case 'sample':
      return (
        sources.lanes.find((l) => l.channel.id === end.channelId)?.x.format(end.x) ?? String(end.x)
      );
    case 'point':
      return (
        sources.lanes
          .find((l) => l.channel.id === end.channelId)
          ?.points.find((p) => p.id === end.id)?.label ?? String(end.id)
      );
    default:
      return (
        (end.type === 'marker' ? sources.markers : sources.references).find((r) => r.id === end.id)
          ?.label ?? String(end.id)
      );
  }
}
