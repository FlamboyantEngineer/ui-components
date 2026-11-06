'use client';

import { useContext, useMemo } from 'react';
import {
  Calendar,
  type CalendarDate,
  parseIsoDate,
  RangeCalendar,
  SelectStateContext,
} from '../../primitives/index.js';
import { CalendarBody, type DateRangeValue } from '../date-time-field/date-time-field.js';
import {
  type RelativeDateBounds,
  type RelativeDateFieldMode,
  type RelativeDateValue,
  toValueDate,
} from './relative-date.js';
import { relativeDateFieldHooks as hooks } from './relative-date-field-hooks.js';

interface PresetCalendarProps {
  kind: RelativeDateFieldMode;
  value: RelativeDateValue | null;
  bounds: RelativeDateBounds;
  /**
   * The field clock's `YYYY-MM-DD` day, which the calendar shows while there is no value; unknown
   * before the clock may be read.
   */
  today: string | undefined;
  /** Receives the picked `YYYY-MM-DD` day, or the picked range of days. */
  onPick: (picked: string | DateRangeValue) => void;
}

function useCalendarValues(value: RelativeDateValue | null, bounds: RelativeDateBounds) {
  const range = typeof value === 'object' ? value : null;
  const single = typeof value === 'string' ? value : null;
  const start = range?.start;
  const end = range?.end;
  return useMemo(() => {
    const startDate = parseIsoDate(start);
    const endDate = parseIsoDate(end);
    return {
      date: single ? parseIsoDate(toValueDate(single, bounds.timeZone)) : null,
      range: startDate && endDate ? { start: startDate, end: endDate } : null,
      minValue: parseIsoDate(bounds.minValue),
      maxValue: parseIsoDate(bounds.maxValue),
    };
  }, [single, start, end, bounds.minValue, bounds.maxValue, bounds.timeZone]);
}

/**
 * The calendar beside the presets (the Date Time Field's calendar parts): picking a day, or a range
 * of days, commits it and closes the popover. Days outside the bounds cannot be picked.
 */
export function PresetCalendar({ kind, value, bounds, today, onPick }: PresetCalendarProps) {
  const select = useContext(SelectStateContext);
  const values = useCalendarValues(value, bounds);
  const pick = (picked: string | DateRangeValue) => {
    onPick(picked);
    select?.close();
  };
  const limits = {
    minValue: values.minValue,
    maxValue: values.maxValue,
    defaultFocusedValue:
      values.date ?? values.range?.start ?? (today ? parseIsoDate(today) : undefined),
  };
  if (kind === 'date-range') {
    return (
      <RangeCalendar
        className={hooks.slotClass('calendar')}
        {...limits}
        value={values.range}
        onChange={(range: { start: CalendarDate; end: CalendarDate } | null) => {
          if (range) pick({ start: range.start.toString(), end: range.end.toString() });
        }}
      >
        <CalendarBody />
      </RangeCalendar>
    );
  }
  return (
    <Calendar
      className={hooks.slotClass('calendar')}
      {...limits}
      value={values.date}
      onChange={(date: CalendarDate) => pick(date.toString())}
    >
      <CalendarBody />
    </Calendar>
  );
}
