'use client';

// A chart's reference lines and value bands: targets, thresholds and highlighted intervals.

import { useMemo } from 'react';
import type { Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import type { LinearScale, ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { chartHooks as hooks } from './chart-hooks.js';
import { type ChartBox, roundCoordinate } from './chart-layout.js';

interface ChartReferenceBase {
  /** Keys the reference across updates. */
  id: Key;
  /** Names the reference beside it and in the chart's summary. */
  label: string;
  /** The semantic tone, published as `data-tone`. */
  tone?: Tone | undefined;
}

/** A line across the plot at one value, such as a target or a threshold. */
export interface ChartReferenceLine<V = number> extends ChartReferenceBase {
  type?: 'line' | undefined;
  value: V;
}

/** A band across the plot between two values, such as a normal range. */
export interface ChartReferenceBand<V = number> extends ChartReferenceBase {
  type: 'band';
  from: V;
  to: V;
}

/** A reference drawn in data coordinates along one axis of a chart. */
export type ChartReference<V = number> = ChartReferenceLine<V> | ChartReferenceBand<V>;

/** The axis a chart's references are placed along. */
export interface ReferenceAxis<V> {
  /** The position of a value along the axis, not clamped; `NaN` when it cannot be placed. */
  map: (value: V) => number;
  /** The value as text, for the summary; empty when it cannot be read. */
  format: (value: V) => string;
  /** `y` when the axis runs up the plot, so its lines are horizontal; `x` when it runs across. */
  direction: 'x' | 'y';
}

/** A placed reference: its box in the plot and where its label starts. */
export interface PlacedReference {
  key: string;
  kind: 'line' | 'band';
  axis: 'x' | 'y';
  tone: Tone | undefined;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
}

/** Room between a label and the edge or line it sits by, in pixels. */
const labelGap = 4;

/** The span a reference covers along its axis, cut to the plot, or `null` when none of it shows. */
function placeSpan<V>(reference: ChartReference<V>, axis: ReferenceAxis<V>, ends: ScaleInterval) {
  const low = Math.min(...ends);
  const high = Math.max(...ends);
  if (reference.type === 'band') {
    const from = axis.map(reference.from);
    const to = axis.map(reference.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
    const start = Math.max(Math.min(from, to), low);
    const end = Math.min(Math.max(from, to), high);
    return start < end ? [start, end] : null;
  }
  const at = axis.map(reference.value);
  return Number.isFinite(at) && at >= low && at <= high ? [at, at] : null;
}

/**
 * Places references along an axis of the plot. A line outside the axis's span, and a value that
 * cannot be placed, draw nothing; a band is cut to the plot. Labels sit at the inline end of a
 * horizontal reference and the top of a vertical one, mirrored in right-to-left reading.
 */
export function placeReferences<V>(
  references: readonly ChartReference<V>[],
  axis: ReferenceAxis<V>,
  layout: { plot: ChartBox; isRtl: boolean },
): PlacedReference[] {
  const { plot, isRtl } = layout;
  const isHorizontal = axis.direction === 'y';
  const ends: ScaleInterval = isHorizontal ? [plot.top, plot.bottom] : [plot.left, plot.right];
  return references.flatMap((reference) => {
    const span = placeSpan(reference, axis, ends);
    if (!span) return [];
    const [start, end] = span.map(roundCoordinate) as [number, number];
    const box = isHorizontal
      ? { x1: plot.left, y1: start, x2: plot.right, y2: end }
      : { x1: start, y1: plot.top, x2: end, y2: plot.bottom };
    const label = isHorizontal
      ? { labelX: isRtl ? plot.left + labelGap : plot.right - labelGap, labelY: start - labelGap }
      : { labelX: isRtl ? end - labelGap : start + labelGap, labelY: plot.top + labelGap };
    if (isHorizontal && reference.type === 'band') label.labelY = start + labelGap;
    return [
      {
        key: `${axis.direction}:${toKeyIdentity(reference.id)}`,
        kind: reference.type ?? 'line',
        axis: axis.direction,
        tone: reference.tone,
        label: reference.label,
        ...box,
        ...label,
      },
    ];
  });
}

/** Each reference as text for the chart's summary: its label and value or range; one whose values cannot be read is left out. */
export function describeReferences<V>(
  references: readonly ChartReference<V>[],
  axis: Pick<ReferenceAxis<V>, 'format'>,
  strings: {
    chartReferenceLine: (label: string, value: string) => string;
    chartReferenceBand: (label: string, from: string, to: string) => string;
  },
): string[] {
  return references.flatMap((reference) => {
    const values = (
      reference.type === 'band' ? [reference.from, reference.to] : [reference.value]
    ).map((value) => axis.format(value));
    if (values.includes('')) return [];
    const [first = '', second = ''] = values;
    return [
      reference.type === 'band'
        ? strings.chartReferenceBand(reference.label, first, second)
        : strings.chartReferenceLine(reference.label, first),
    ];
  });
}

/**
 * The placed references, drawn under the values: decorative, since the summary names them, and
 * letting the pointer through to the values beneath.
 */
export function ChartReferences({ placed }: { placed: readonly PlacedReference[] }) {
  if (placed.length === 0) return null;
  return (
    <g {...hooks.slot('references')} aria-hidden="true" pointerEvents="none">
      {placed.map((reference) => {
        const data = { kind: reference.kind, axis: reference.axis, tone: reference.tone };
        const isHorizontal = reference.axis === 'y';
        return (
          <g key={reference.key} {...hooks.slot('reference', data)}>
            {reference.kind === 'band' ? (
              <rect
                {...hooks.slot('reference-band')}
                x={reference.x1}
                y={reference.y1}
                width={roundCoordinate(reference.x2 - reference.x1)}
                height={roundCoordinate(reference.y2 - reference.y1)}
              />
            ) : (
              <line
                {...hooks.slot('reference-line')}
                x1={reference.x1}
                y1={reference.y1}
                x2={reference.x2}
                y2={reference.y2}
              />
            )}
            <text
              {...hooks.slot('reference-label')}
              x={reference.labelX}
              y={reference.labelY}
              textAnchor={isHorizontal ? 'end' : 'start'}
              dominantBaseline={isHorizontal && reference.kind === 'line' ? 'auto' : 'hanging'}
            >
              {reference.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** An unclamped position along a linear scale, for references beyond its domain. */
export function mapUnclamped(
  scale: { domain: ScaleInterval; range: ScaleInterval },
  value: number,
): number {
  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  if (!Number.isFinite(value) || d0 === d1) return Number.NaN;
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/** A value axis for references: unclamped positions along the scale, values in the chart's format. */
export function toValueReferenceAxis(
  scale: LinearScale,
  format: Intl.NumberFormat,
  direction: 'x' | 'y',
): ReferenceAxis<number> {
  return {
    map: (value) => mapUnclamped(scale, value),
    format: (value) => (Number.isFinite(value) ? format.format(value) : ''),
    direction,
  };
}

/** References along one axis, with their value type settled. */
export interface ReferenceGroup {
  place: (layout: { plot: ChartBox; isRtl: boolean }) => PlacedReference[];
  describe: (strings: ReferenceStrings) => string[];
}

type ReferenceStrings = Parameters<typeof describeReferences>[2];

export function toReferenceGroup<V>(
  references: readonly ChartReference<V>[] | undefined,
  axis: ReferenceAxis<V>,
): ReferenceGroup {
  const list = references ?? [];
  return {
    place: (layout) => placeReferences(list, axis, layout),
    describe: (strings) => describeReferences(list, axis, strings),
  };
}

/** References along one or two axes: placed in the plot, and described for the summary. */
export function useChartReferences(
  groups: readonly ReferenceGroup[],
  plot: ChartBox,
): { placed: PlacedReference[]; described: string[] } {
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  // Kept while the groups and the plot are, so a drawing that skips its render can.
  const placed = useMemo(
    () => groups.flatMap((group) => group.place({ plot, isRtl })),
    [groups, plot, isRtl],
  );
  return { placed, described: groups.flatMap((group) => group.describe(strings)) };
}
