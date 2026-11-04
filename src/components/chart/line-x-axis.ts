// The x axis of a line chart: ISO 8601 dates on a time scale, or numbers on a linear one.

import { getDateTimeFormat, getNumberFormat } from '../../utils/intl-format.js';
import { createLinearScale, type ScaleTick } from '../../utils/linear-scale.js';
import { readTimeInstant } from '../../utils/read-time-instant.js';
import { createTimeScale } from '../../utils/time-scale.js';

/** Where a value sits along a line chart's x axis: an ISO 8601 date or date-time, or a number. */
export type LineChartX = string | number;

interface LineXAxisOptions {
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
/** The lowest and highest readable values, or `undefined` without any. */
function findExtent(values: readonly LineChartX[], read: (value: LineChartX) => number) {
  let extent: [LineChartX, LineChartX] | undefined;
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    const at = read(value);
    if (!Number.isFinite(at)) continue;
    extent ??= [value, value];
    if (at < low) {
      low = at;
      extent[0] = value;
    }
    if (at >= high) {
      high = at;
      extent[1] = value;
    }
  }
  return extent;
}

/** Reads x values as dates in `timeZone`; anything else is unreadable. */
const createTimeReader = (timeZone: string) => (value: LineChartX) =>
  typeof value === 'string' ? readTimeInstant(value, timeZone) : Number.NaN;

/** Reads x values as numbers; anything else is unreadable. */
const readNumber = (value: LineChartX) => (typeof value === 'number' ? value : Number.NaN);

/**
 * How a line chart reads its x values, as `createLineXAxis` does: the kind follows the first value,
 * and a value it cannot read is `NaN`.
 */
export function createLineXReader(
  values: readonly LineChartX[],
  timeZone: string,
): (value: LineChartX) => number {
  return typeof values[0] === 'number' ? readNumber : createTimeReader(timeZone);
}

function createTimeAxis(options: LineXAxisOptions): LineXAxis {
  const { range, timeZone, locale, tickCount } = options;
  const read = createTimeReader(timeZone);
  const extent = findExtent(options.values, read) as readonly [string, string] | undefined;
  const scale = createTimeScale({ domain: extent ?? ['', ''], range, timeZone, locale });
  const date = getDateTimeFormat(locale, { dateStyle: 'medium', timeZone });
  const dateTime = getDateTimeFormat(locale, {
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
  const read = readNumber;
  const extent = findExtent(options.values, read) as readonly [number, number] | undefined;
  const scale = createLinearScale({
    domain: extent ?? [0, 0],
    range: options.range,
    tickCount: options.tickCount,
    locale: options.locale,
  });
  const labels = getNumberFormat(options.locale);
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
