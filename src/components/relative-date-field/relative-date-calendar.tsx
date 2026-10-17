import { parseDate, type CalendarDate } from '@internationalized/date';
import { useContext, useMemo } from 'react';
import { Calendar, RangeCalendar, SelectStateContext } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { CalendarBody } from '../date-time-field/date-time-field.js';
import {
  toValueDate,
  type RelativeDateBounds,
  type RelativeDateKind,
  type RelativeDateValue,
} from './relative-date.js';

export interface PresetCalendarProps {
  kind: RelativeDateKind;
  value: RelativeDateValue | null;
  bounds: RelativeDateBounds;
  /** The field clock's day, which the calendar shows while there is no value. */
  today: CalendarDate;
  /** Receives the picked day, or the picked range of days. */
  onPick: (picked: CalendarDate | { start: CalendarDate; end: CalendarDate }) => void;
}

const hooks = createHooks('relative-date-field', ['calendar']);

function readDate(text: string | undefined): CalendarDate | null {
  if (!text) return null;
  try {
    return parseDate(text);
  } catch {
    return null;
  }
}

function useCalendarValues(value: RelativeDateValue | null, bounds: RelativeDateBounds) {
  const range = typeof value === 'object' ? value : null;
  const single = typeof value === 'string' ? value : null;
  const start = range?.start;
  const end = range?.end;
  return useMemo(() => {
    const startDate = readDate(start);
    const endDate = readDate(end);
    return {
      date: single ? toValueDate(single) : null,
      range: startDate && endDate ? { start: startDate, end: endDate } : null,
      minValue: readDate(bounds.minValue),
      maxValue: readDate(bounds.maxValue),
    };
  }, [single, start, end, bounds.minValue, bounds.maxValue]);
}

/**
 * The calendar beside the presets (the Date Time Field's calendar parts): picking a day, or a range
 * of days, commits it and closes the popover. Days outside the bounds cannot be picked.
 */
export function PresetCalendar({ kind, value, bounds, today, onPick }: PresetCalendarProps) {
  const select = useContext(SelectStateContext);
  const values = useCalendarValues(value, bounds);
  const pick: PresetCalendarProps['onPick'] = (picked) => {
    onPick(picked);
    select?.close();
  };
  const limits = {
    minValue: values.minValue,
    maxValue: values.maxValue,
    defaultFocusedValue: today,
  };
  if (kind === 'date-range') {
    return (
      <RangeCalendar
        className={hooks.slotClass('calendar')}
        {...limits}
        value={values.range}
        onChange={(range: { start: CalendarDate; end: CalendarDate } | null) => {
          if (range) pick(range);
        }}
      >
        <CalendarBody months={1} heading="text" />
      </RangeCalendar>
    );
  }
  return (
    <Calendar
      className={hooks.slotClass('calendar')}
      {...limits}
      value={values.date}
      onChange={(date: CalendarDate) => pick(date)}
    >
      <CalendarBody months={1} heading="text" />
    </Calendar>
  );
}
