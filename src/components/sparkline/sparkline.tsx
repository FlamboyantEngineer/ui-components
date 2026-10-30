'use client';

import { useId, type Ref } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  resolveSparklineGeometry,
  type SparklineGeometry,
  type SparklineMarker,
} from './sparkline-geometry.js';

export type { SparklineMarker } from './sparkline-geometry.js';

/** `line` draws the values as a line; `area` also fills the space under it. */
export type SparklineVariant = 'line' | 'area';

export interface SparklineProps extends BaseProps, AriaLabellingProps {
  /** The series, in order. Values that are not finite numbers leave gaps. */
  values: readonly number[];
  /** Line or filled area. Defaults to `line`. */
  variant?: SparklineVariant | undefined;
  /** The values to mark with a dot: the lowest, the highest and the last. */
  markers?: readonly SparklineMarker[] | undefined;
  /** The value at the bottom edge, to compare sparklines on one scale. Defaults to the lowest value. */
  minValue?: number | undefined;
  /** The value at the top edge. Defaults to the highest value. */
  maxValue?: number | undefined;
  /** Drawing width, in pixels. Defaults to 80. */
  width?: number | undefined;
  /** Drawing height, in pixels. Defaults to 24. */
  height?: number | undefined;
  /** How the values in the accessible summary are formatted. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The `<svg>` element. */
  ref?: Ref<SVGSVGElement> | undefined;
}

const hooks = createHooks('sparkline', ['area', 'line', 'marker']);

/** The text that describes the series: its lowest, highest and last values, or that it has none. */
function useSeriesSummary(
  points: SparklineGeometry['points'],
  formatOptions: Intl.NumberFormatOptions | undefined,
): string {
  const strings = useUiStrings();
  const { min, max, last } = points;
  const format = useNumberFormatter(formatOptions);
  if (!min || !max || !last) return strings.noData;
  return strings.seriesSummary({
    low: format.format(min.value),
    high: format.format(max.value),
    last: format.format(last.value),
  });
}

/**
 * A word-sized drawing of a series of numbers with no axes, such as a week of daily counts, named
 * by its label and described by its lowest, highest and last values.
 */
export function Sparkline({
  values,
  variant = 'line',
  markers = [],
  minValue,
  maxValue,
  width = 80,
  height = 24,
  formatOptions,
  className,
  'aria-describedby': describedBy,
  ...rest
}: SparklineProps) {
  const summaryId = useId();
  const geometry = resolveSparklineGeometry({ values, width, height, minValue, maxValue });
  const summary = useSeriesSummary(geometry.points, formatOptions);
  const isEmpty = geometry.points.last === undefined;
  return (
    <svg
      {...rest}
      {...hooks.root({ className, data: { variant, empty: isEmpty } })}
      role="img"
      aria-describedby={describedBy ? `${summaryId} ${describedBy}` : summaryId}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      focusable="false"
    >
      <desc id={summaryId}>{summary}</desc>
      {variant === 'area' && !isEmpty ? <path {...hooks.slot('area')} d={geometry.area} /> : null}
      {isEmpty ? null : <path {...hooks.slot('line')} d={geometry.line} fill="none" />}
      {markers.map((marker) => {
        const point = geometry.points[marker];
        return point ? (
          <circle
            key={marker}
            {...hooks.slot('marker', { marker })}
            cx={point.x}
            cy={point.y}
            r={2}
          />
        ) : null;
      })}
    </svg>
  );
}
