// The x axis of a line chart: ISO 8601 dates on a time scale, or numbers on a linear one.

import { createLinearScale, type ScaleTick } from '../../utils/linear-scale.js';
import { createTimeScale } from '../../utils/time-scale.js';

/** Where a value sits along a line chart's x axis: an ISO 8601 date or date-time, or a number. */
export type LineChartX = string | number;

export interface LineXAxisOptions {
  /** Every x value drawn. */
  values: readonly LineChartX[];
  /** The positions the lowest and highest values map to. */
  range: readonly [number, number];
  /** About how many ticks to make. */
  tickCount: number;
  timeZone: string;
  locale: string;
}

export interface LineXAxis {
  /** The x value as a sortable number (epoch milliseconds for dates); `NaN` when unreadable. */
  read(value: LineChartX): number;
  /** The position of an x value. */
  map(value: LineChartX): number;
  /** The x value as text: a medium date (with the time for a date-time), or a number. */
  format(value: LineChartX): string;
  ticks: Array<ScaleTick<LineChartX>>;
}

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const dayLength = 86_400_000;

/** Reads ISO 8601 texts in `timeZone` as epoch milliseconds, through a one-day time scale. */
function createInstantReader(timeZone: string) {
  const day = createTimeScale({
    domain: ['2000-01-01', '2000-01-02'],
    range: [0, dayLength],
    timeZone,
  });
  const origin = Date.parse(day.invert(0));
  return (text: string) => origin + day.map(text);
}

/** The lowest and highest readable values, or `undefined` without any. */
function findExtent(values: readonly LineChartX[], read: (value: LineChartX) => number) {
  const readable = values.filter((value) => Number.isFinite(read(value)));
  if (readable.length === 0) return undefined;
  const sorted = [...readable].sort((a, b) => read(a) - read(b));
  return [sorted[0]!, sorted.at(-1)!] as const;
}

function createTimeAxis(options: LineXAxisOptions): LineXAxis {
  const { range, timeZone, locale, tickCount } = options;
  const instant = createInstantReader(timeZone);
  const read = (value: LineChartX) => (typeof value === 'string' ? instant(value) : Number.NaN);
  const extent = findExtent(options.values, read) as readonly [string, string] | undefined;
  const scale = createTimeScale({ domain: extent ?? ['', ''], range, timeZone, locale });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone });
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  });
  return {
    read,
    map: (value) => (typeof value === 'string' ? scale.map(value) : Number.NaN),
    format: (value) => {
      const at = read(value);
      if (!Number.isFinite(at)) return '';
      return (dateOnly.test(String(value)) ? date : dateTime).format(at);
    },
    ticks: scale.ticks({ count: tickCount }),
  };
}

function createNumberAxis(options: LineXAxisOptions): LineXAxis {
  const read = (value: LineChartX) => (typeof value === 'number' ? value : Number.NaN);
  const extent = findExtent(options.values, read) as readonly [number, number] | undefined;
  const scale = createLinearScale({
    domain: extent ?? [0, 0],
    range: options.range,
    tickCount: options.tickCount,
    locale: options.locale,
  });
  const labels = new Intl.NumberFormat(options.locale);
  return {
    read,
    map: (value) => scale.map(read(value)),
    format: (value) => (Number.isFinite(read(value)) ? labels.format(read(value)) : ''),
    ticks: extent ? scale.ticks() : [],
  };
}

/**
 * The x axis of a line chart. Text values make a time axis read in `timeZone`, ticked on calendar
 * boundaries; numbers make a linear axis. The kind follows the first value; values of the other
 * kind are unreadable.
 */
export function createLineXAxis(options: LineXAxisOptions): LineXAxis {
  return typeof options.values[0] === 'number'
    ? createNumberAxis(options)
    : createTimeAxis(options);
}
