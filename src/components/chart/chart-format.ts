// How a chart writes its values: per value for names, tooltips and the table, and on its axis.

import type { ReactNode } from 'react';
import type { Key, Tone } from '../../core/props.js';
import type { LinearScale } from '../../utils/linear-scale.js';

/** One drawn value as the chart's callbacks see it: its raw value and where it belongs. */
export interface ChartDatum<At = string> {
  /** The series' id. */
  seriesId: Key;
  /** The series' label. */
  seriesLabel: string;
  /** The series' position among the chart's series, from 0. */
  series: number;
  /** Where the value sits on the other axis: a bar's category, a line point's `x`. */
  at: At;
  /** The value, a finite number. */
  value: number;
}

/** What a custom tooltip shows: the datum, and the text the chart writes for it. */
export interface ChartTooltipContext<At = string> {
  datum: ChartDatum<At>;
  /** The value as the chart writes it in names and the table. */
  value: string;
  /** Where the value sits, as the chart writes it. */
  at: string;
}

/** Formatting and tooltip props a bar or line chart shares. */
export interface ChartFormatProps<At> {
  /**
   * Writes one value in its name, its tooltip and the table, given its datum, for units or
   * precision per series. Defaults to `formatOptions`.
   */
  formatValue?: ((datum: ChartDatum<At>) => string) | undefined;
  /** Writes the value axis's tick labels, such as compact numbers. Defaults to `formatOptions`. */
  formatAxisValue?: ((value: number) => string) | undefined;
  /**
   * Replaces the tooltip's content for the hovered or focused value. The tooltip stays plain:
   * the value's name, not this content, is what assistive technology reads.
   */
  renderTooltip?: ((context: ChartTooltipContext<At>) => ReactNode) | undefined;
}

/** The datum of a drawn value of `series[point.series]`. */
export function toDatum<At>(
  series: ReadonlyArray<{ id: Key; label: string }>,
  point: { series: number; at: At; value: number },
): ChartDatum<At> {
  const entry = series[point.series];
  return {
    seriesId: entry?.id ?? point.series,
    seriesLabel: entry?.label ?? '',
    series: point.series,
    at: point.at,
    value: point.value,
  };
}

/** The writer of each value: the caller's, or the number format. */
export function toDatumFormatter<At>(
  formatValue: ChartFormatProps<At>['formatValue'],
  format: Intl.NumberFormat,
): (datum: ChartDatum<At>) => string {
  return formatValue ?? ((datum) => format.format(datum.value));
}

/** A scale whose tick labels the caller writes, or the scale itself. */
export function withAxisFormat(
  scale: LinearScale,
  formatAxisValue: ((value: number) => string) | undefined,
): LinearScale {
  if (!formatAxisValue) return scale;
  return {
    ...scale,
    map: scale.map,
    invert: scale.invert,
    ticks: () => scale.ticks().map((tick) => ({ ...tick, label: formatAxisValue(tick.value) })),
    format: formatAxisValue,
  };
}

/** What the tooltip of the active value says: the chart's own text, and the caller's content. */
export function toTooltipText<At>(input: {
  active: { series: number; at: At; value: number } | undefined;
  series: ReadonlyArray<{ id: Key; label: string; tone?: Tone | undefined }>;
  writeAt: (at: At) => string;
  writeValue: (datum: ChartDatum<At>) => string;
  renderTooltip: ChartFormatProps<At>['renderTooltip'];
}) {
  const { active, series, writeAt, writeValue, renderTooltip } = input;
  if (!active)
    return { title: '', label: '', series: 0, tone: undefined, value: '', content: null };
  const datum = toDatum(series, active);
  const value = writeValue(datum);
  const at = writeAt(active.at);
  return {
    title: at,
    label: datum.seriesLabel,
    series: active.series,
    tone: series[active.series]?.tone,
    value,
    content: renderTooltip ? renderTooltip({ datum, value, at }) : null,
  };
}
