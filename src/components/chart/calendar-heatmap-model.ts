'use client';

// What a calendar heatmap draws and says: its days, its legend, its summary and its table.

import { useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { getDateTimeFormat } from '../../utils/intl-format.js';
import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import type { ChartTable } from './chart.js';
import {
  type CalendarHeatmapDay,
  type HeatmapCell,
  type HeatmapGeometry,
  type HeatmapGeometryInput,
  type HeatmapScale,
  resolveHeatmapGeometry,
  toDayNumber,
} from './heatmap-geometry.js';
import { useLabelMargin } from './use-chart-box.js';

const monthRoom = 18;

/** A legend entry: a level, or the missing or absent days, with the text that names it. */
export interface HeatmapLegendItem {
  key: string;
  level?: number | undefined;
  state?: 'missing' | 'absent' | undefined;
  label: string;
}

/** A day's text as a date in the locale, read as the calendar day itself, not an instant. */
function useDayFormats() {
  const { locale } = useLocale();
  return useMemo(() => {
    const at = (date: string) => (toDayNumber(date) ?? 0) * 86_400_000;
    const day = getDateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
    const month = getDateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    const weekday = getDateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    return {
      day: (date: string) => day.format(at(date)),
      month: (date: string) => month.format(at(date)),
      weekday: (date: string) => weekday.format(at(date)),
    };
  }, [locale]);
}

export type HeatmapDayFormats = ReturnType<typeof useDayFormats>;

/** The legend: each level by the values it spans, then the missing and absent days drawn. */
function useLegendItems(geometry: HeatmapGeometry | null, format: Intl.NumberFormat) {
  const strings = useUiStrings();
  if (!geometry) return [];
  const { low, levels, step }: HeatmapScale = geometry.scale;
  const items: HeatmapLegendItem[] = [
    { key: 'level-0', level: 0, label: strings.heatmapAtMost(format.format(low)) },
  ];
  for (let level = 1; level <= levels; level += 1) {
    const from = format.format(low + (level - 1) * step);
    const label =
      level === levels
        ? strings.heatmapAtLeast(from)
        : strings.heatmapRange(from, format.format(low + level * step));
    items.push({ key: `level-${level}`, level, label });
  }
  const has = (state: HeatmapCell['state']) => geometry.cells.some((cell) => cell.state === state);
  if (has('missing'))
    items.push({ key: 'missing', state: 'missing', label: strings.heatmapMissing });
  if (has('absent')) items.push({ key: 'absent', state: 'absent', label: strings.noData });
  return items;
}

interface HeatmapModelInput extends Omit<HeatmapGeometryInput, 'margin' | 'locale' | 'isRtl'> {
  element: Element | null;
  format: Intl.NumberFormat;
}

/** The days laid out, their legend, the summary of their values, and the table, built when shown. */
export function useHeatmapModel(input: HeatmapModelInput) {
  const { element, format, ...layout } = input;
  const { days, start, end, firstDayOfWeek, minValue, maxValue, levels, cellSize, width } = layout;
  const strings = useUiStrings();
  const { locale, direction } = useLocale();
  const formats = useDayFormats();
  const weekdayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, day) => formats.weekday(`2026-03-0${day + 1}`)),
    [formats],
  );
  const left = useLabelMargin(element, weekdayLabels);
  const geometry = useMemo(
    () =>
      resolveHeatmapGeometry({
        days,
        start,
        end,
        firstDayOfWeek,
        minValue,
        maxValue,
        levels,
        cellSize,
        width,
        locale,
        margin: { left, top: monthRoom },
        isRtl: direction === 'rtl',
      }),
    [
      days,
      start,
      end,
      firstDayOfWeek,
      minValue,
      maxValue,
      levels,
      cellSize,
      width,
      locale,
      left,
      direction,
    ],
  );
  const legend = useLegendItems(geometry, format);
  const cells = geometry?.cells ?? [];
  const summary = summarizeNumbers(
    cells.flatMap((cell) => (cell.value === null ? [] : [cell.value])),
  );
  const generated =
    summary.count === 0
      ? strings.noData
      : strings.heatmapSummary({
          days: cells.length,
          values: summary.count,
          low: format.format(summary.min),
          high: format.format(summary.max),
        });
  const table = (): ChartTable => ({
    columns: [strings.chartDate, strings.chartAmount],
    rows: cells
      .filter((cell) => cell.state !== 'absent')
      .map((cell) => [
        formats.day(cell.key),
        cell.value === null ? strings.heatmapMissing : format.format(cell.value),
      ]),
  });
  return { geometry, legend, generated, table, formats, isEmpty: summary.count === 0 };
}

export type { CalendarHeatmapDay };
