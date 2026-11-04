// The options of a time picker's columns (hours, minutes, seconds and the day period), which of
// them the bounds allow, and the time a pick or a wheel step makes (specs/DATE-TIME-FIELD.md,
// UIC-DATE-TIME-FIELD-4.6).

import type { DateTimeFieldGranularity } from './date-values.js';

/** A time of day, as the columns read and write it. */
export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
}

/** The seconds of a day, from midnight, that a time may take: `min` to `max`, both included. */
export interface DayBounds {
  min: number;
  max: number;
}

export type TimeColumnUnit = 'hour' | 'minute' | 'second' | 'dayPeriod';

interface TimeOption {
  /** The hour (of the period in a 12 hour cycle), minute or second; 0 for AM and 1 for PM. */
  id: number;
  isDisabled: boolean;
}

export interface TimeColumn {
  unit: TimeColumnUnit;
  options: readonly TimeOption[];
  /** The option the time holds, or `null` without a time. */
  selected: number | null;
}

interface ColumnSettings {
  granularity: DateTimeFieldGranularity;
  hourCycle: 12 | 24;
  bounds: DayBounds;
}

const secondsPerDay = 86_400;

/** A whole day: any time is allowed. */
export const wholeDay: DayBounds = { min: 0, max: secondsPerDay - 1 };

/** No time of the day is allowed, as on a day outside the bounds. */
export const noTime: DayBounds = { min: secondsPerDay, max: -1 };

export function toSecondOfDay({ hour, minute, second }: TimeParts): number {
  return hour * 3600 + minute * 60 + second;
}

function fromSecondOfDay(seconds: number): TimeParts {
  return {
    hour: Math.floor(seconds / 3600),
    minute: Math.floor((seconds % 3600) / 60),
    second: seconds % 60,
  };
}

/** The seconds one step of the granularity spans. */
function stepOf(granularity: DateTimeFieldGranularity): number {
  if (granularity === 'hour') return 3600;
  return granularity === 'minute' ? 60 : 1;
}

/** An option is disabled when none of the seconds it spans, `start` to `end`, is allowed. */
function option(id: number, [start, end]: [number, number], bounds: DayBounds): TimeOption {
  return { id, isDisabled: end < bounds.min || start > bounds.max };
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

/**
 * The columns a time picker shows for `value`: hours (of the period in a 12 hour cycle), minutes
 * and seconds down to the granularity, and the day period in a 12 hour cycle. A minute or second
 * is disabled when the bounds allow none of its time within the chosen hour (or minute), and an
 * hour or a period when they allow none of its time at all.
 */
export function buildTimeColumns(value: TimeParts | null, settings: ColumnSettings): TimeColumn[] {
  const { granularity, hourCycle, bounds } = settings;
  const time = value ?? { hour: 0, minute: 0, second: 0 };
  const is12 = hourCycle === 12;
  const period = time.hour >= 12 ? 1 : 0;
  const hourBase = is12 ? period * 12 : 0;
  const hours: TimeColumn = {
    unit: 'hour',
    options: range(is12 ? 12 : 24).map((id) =>
      option(id, [(hourBase + id) * 3600, (hourBase + id) * 3600 + 3599], bounds),
    ),
    selected: value ? value.hour - hourBase : null,
  };
  const columns = [hours];
  const hourStart = time.hour * 3600;
  if (granularity !== 'hour') {
    columns.push({
      unit: 'minute',
      options: range(60).map((id) =>
        option(id, [hourStart + id * 60, hourStart + id * 60 + 59], bounds),
      ),
      selected: value ? value.minute : null,
    });
  }
  if (granularity === 'second') {
    const minuteStart = hourStart + time.minute * 60;
    columns.push({
      unit: 'second',
      options: range(60).map((id) => option(id, [minuteStart + id, minuteStart + id], bounds)),
      selected: value ? value.second : null,
    });
  }
  if (is12) {
    columns.push({
      unit: 'dayPeriod',
      options: [0, 1].map((id) => option(id, [id * 43_200, id * 43_200 + 43_199], bounds)),
      selected: value ? period : null,
    });
  }
  return columns;
}

/** Brings a time within the bounds, on a whole step of the granularity. */
function clampToBounds(seconds: number, bounds: DayBounds, step: number): number {
  if (seconds < bounds.min) return Math.ceil(bounds.min / step) * step;
  if (seconds > bounds.max) return Math.floor(bounds.max / step) * step;
  return seconds;
}

/**
 * The time a pick of `id` in the `unit` column makes from `value` (midnight without one): the other
 * parts kept, and the time brought within the bounds when the pick leaves them, so picking an hour
 * whose kept minutes the bounds refuse moves to the nearest allowed minute.
 */
export function pickTimePart(
  value: TimeParts | null,
  { unit, id }: { unit: TimeColumnUnit; id: number },
  settings: Pick<ColumnSettings, 'granularity' | 'hourCycle' | 'bounds'>,
): TimeParts {
  const time = value ?? { hour: 0, minute: 0, second: 0 };
  const period = time.hour >= 12 ? 1 : 0;
  const next = { ...time };
  if (unit === 'hour') next.hour = settings.hourCycle === 12 ? period * 12 + id : id;
  else if (unit === 'minute') next.minute = id;
  else if (unit === 'second') next.second = id;
  else next.hour = (time.hour % 12) + id * 12;
  const step = stepOf(settings.granularity);
  const seconds = Math.floor(toSecondOfDay(next) / step) * step;
  return fromSecondOfDay(clampToBounds(seconds, settings.bounds, step));
}

/**
 * The option a wheel step moves to from the selected one: the next enabled option (`1`) or the
 * previous (`-1`), wrapping around the column; without a selection, the first or the last enabled.
 */
export function stepTimeOption(column: TimeColumn, direction: 1 | -1): number | null {
  const enabled = column.options.filter((entry) => !entry.isDisabled).map((entry) => entry.id);
  const ids = direction === 1 ? enabled : enabled.reverse();
  const { selected } = column;
  if (selected === null) return ids[0] ?? null;
  const ahead = ids.find((id) => (direction === 1 ? id > selected : id < selected));
  return ahead ?? ids[0] ?? null;
}
