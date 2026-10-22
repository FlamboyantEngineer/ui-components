// The slices of a donut chart, from its values and size (specs/CHART.md).

import { roundCoordinate } from './chart-layout.js';
import { resolveAmountShares } from '../../utils/resolve-amount-shares.js';

/** A drawn segment: its position among the chart's segments and its value. */
export interface DonutGeometryValue {
  series: number;
  value: number;
}

export interface DonutGeometryInput {
  /** The segments drawn, without the hidden ones. */
  values: readonly DonutGeometryValue[];
  /** The outer diameter, in pixels. */
  diameter: number;
}

/** One drawn slice. */
export interface DonutSlice {
  key: string;
  series: number;
  /** Its position among the drawn slices. */
  index: number;
  value: number;
  /** Its share of the total, from 0 to 1. */
  share: number;
  /** Path data of the ring segment. */
  path: string;
}

export interface DonutGeometry {
  slices: DonutSlice[];
  /** The sum of the drawn values. */
  total: number;
}

/** The inner radius as a share of the outer radius. */
const holeShare = 0.6;

/** The point `radius` from the centre at `turn` (0 at the top, clockwise, 1 a full turn). */
function pointAt(centre: number, radius: number, turn: number): string {
  const angle = turn * 2 * Math.PI;
  const x = roundCoordinate(centre + radius * Math.sin(angle));
  const y = roundCoordinate(centre - radius * Math.cos(angle));
  return `${x},${y}`;
}

/** A ring segment from `start` to `end` turns; a whole ring is drawn as two halves. */
function describeRingSegment(
  { centre, outer, inner }: { centre: number; outer: number; inner: number },
  start: number,
  end: number,
): string {
  if (end - start >= 1) {
    return (
      describeRingSegment({ centre, outer, inner }, start, start + 0.5) +
      describeRingSegment({ centre, outer, inner }, start + 0.5, end)
    );
  }
  const large = end - start > 0.5 ? 1 : 0;
  const outerArc = `M${pointAt(centre, outer, start)}A${outer},${outer} 0 ${large} 1 ${pointAt(centre, outer, end)}`;
  return `${outerArc}L${pointAt(centre, inner, end)}A${inner},${inner} 0 ${large} 0 ${pointAt(centre, inner, start)}Z`;
}

/**
 * Lays segments out around a ring, clockwise from the top, each spanning its share of the total.
 * Values that are not finite, positive numbers draw no slice. Coordinates are rounded to two
 * decimals.
 */
export function resolveDonutGeometry({ values, diameter }: DonutGeometryInput): DonutGeometry {
  const { amounts, total } = resolveAmountShares(values, ({ value }) => value);
  const outer = diameter / 2;
  const ring = { centre: outer, outer, inner: outer * holeShare };
  const slices: DonutSlice[] = [];
  let turn = 0;
  for (const {
    item: { series },
    value,
    share,
  } of amounts) {
    if (value === 0) continue;
    slices.push({
      key: String(series),
      series,
      index: slices.length,
      value,
      share,
      path: describeRingSegment(ring, turn, turn + share),
    });
    turn += share;
  }
  return { slices, total };
}
