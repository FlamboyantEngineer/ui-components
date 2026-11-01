'use client';

import { useContext } from 'react';
import {
  Button as AriaButton,
  DatePickerStateContext,
  DateRangePickerStateContext,
  DialogTrigger,
  formatIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  Time,
  toCalendarDate,
  type DateValue,
} from '../../primitives/index.js';
import { ClockGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useControllableState } from '../../core/controllable-state.js';
import { CalendarPopover } from './date-time-calendar.js';
import type { DatePickerControlProps } from './date-time-pickers.js';
import { TimeColumns } from './time-columns.js';
import {
  noTime,
  toSecondOfDay,
  wholeDay,
  type DayBounds,
  type TimeParts,
} from './time-columns-model.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';

/** The earliest and latest values a picker takes, as the date objects it edits. */
interface PickerBounds {
  minValue: DateValue | Time | null;
  maxValue: DateValue | Time | null;
}

/** A time, or the time of a date and time, as the columns read it. */
function toTimeParts(value: Partial<TimeParts> | null | undefined): TimeParts | null {
  if (!value || value.hour === undefined) return null;
  return { hour: value.hour, minute: value.minute ?? 0, second: value.second ?? 0 };
}

function toTime({ hour, minute, second }: TimeParts): Time {
  return new Time(hour, minute, second);
}

/** The seconds of a bound's time, or `null` for a bound with no time of day. */
function boundSeconds(bound: DateValue | Time | null): number | null {
  const parts = bound && 'hour' in bound ? toTimeParts(bound) : null;
  return parts ? toSecondOfDay(parts) : null;
}

/**
 * The times of a day the bounds allow: on the bound's own date (or always, for a time without a
 * date), from or up to its time; on a date past a bound, none; without a date, any.
 */
function toDayBounds(
  date: DateValue | null | undefined,
  { minValue, maxValue }: PickerBounds,
  hasDate: boolean,
): DayBounds {
  if (hasDate && !date) return wholeDay;
  const compare = (bound: DateValue | Time) =>
    date && 'day' in bound ? toCalendarDate(date).compare(toCalendarDate(bound)) : 0;
  const bounds = { ...wholeDay };
  if (minValue) {
    const order = compare(minValue);
    if (order < 0) return noTime;
    if (order === 0) bounds.min = boundSeconds(minValue) ?? 0;
  }
  if (maxValue) {
    const order = compare(maxValue);
    if (order > 0) return noTime;
    if (order === 0) bounds.max = boundSeconds(maxValue) ?? wholeDay.max;
  }
  return bounds;
}

type PickerTimeProps = Pick<DatePickerControlProps, 'settings' | 'bounds'>;

/** A date and time's bounds as the date objects the picker edits, in the field's zone. */
function parseDateTimeBounds({ settings, bounds }: PickerTimeProps): PickerBounds {
  const { timeZone, localZone } = settings;
  return {
    minValue: parseIsoDateTime(bounds.minValue, timeZone, localZone),
    maxValue: parseIsoDateTime(bounds.maxValue, timeZone, localZone),
  };
}

/** The time columns under a date and time's calendar, editing the picker's time. */
export function DatePickerTime(props: PickerTimeProps) {
  const { settings } = props;
  const bounds = parseDateTimeBounds(props);
  const strings = useUiStrings();
  const state = useContext(DatePickerStateContext);
  if (!state) return null;
  return (
    <TimeColumns
      label={strings.timeOfDay}
      value={toTimeParts(state.timeValue)}
      onChange={(parts) => state.setTimeValue(toTime(parts))}
      granularity={settings.granularity ?? 'minute'}
      hourCycle={settings.hourCycle}
      bounds={toDayBounds(state.dateValue, bounds, true)}
    />
  );
}

/** The start and end time columns under a range of dates and times' calendar. */
export function DateRangePickerTime(props: PickerTimeProps) {
  const { settings } = props;
  const bounds = parseDateTimeBounds(props);
  const strings = useUiStrings();
  const state = useContext(DateRangePickerStateContext);
  if (!state) return null;
  const shared = {
    granularity: settings.granularity ?? 'minute',
    hourCycle: settings.hourCycle,
  } as const;
  return (
    <div {...hooks.slot('time-range')}>
      <TimeColumns
        {...shared}
        label={strings.startTime}
        value={toTimeParts(state.timeRange?.start)}
        onChange={(parts) => state.setTime('start', toTime(parts))}
        bounds={toDayBounds(state.dateRange?.start, { ...bounds, maxValue: null }, true)}
      />
      <TimeColumns
        {...shared}
        label={strings.endTime}
        value={toTimeParts(state.timeRange?.end)}
        onChange={(parts) => state.setTime('end', toTime(parts))}
        bounds={toDayBounds(state.dateRange?.end, { ...bounds, minValue: null }, true)}
      />
    </div>
  );
}

type TimePickerProps = Pick<
  DatePickerControlProps,
  'mode' | 'state' | 'bounds' | 'settings' | 'onPick' | 'isOpen' | 'defaultOpen' | 'onOpenChange'
>;

/**
 * A time field's clock button and its popover of time columns, with the presets and Clear. The
 * popover stays closed while the field is disabled or read-only, whatever `isOpen` asks.
 */
export function TimePicker(props: TimePickerProps) {
  const strings = useUiStrings();
  const { settings, state, bounds } = props;
  const isLocked = state.isReadOnly || state.isDisabled;
  const granularity = settings.granularity ?? 'minute';
  const value = parseIsoTime(typeof state.value === 'string' ? state.value : null);
  const timeBounds = {
    minValue: parseIsoTime(bounds.minValue),
    maxValue: parseIsoTime(bounds.maxValue),
  };
  const [open, setOpen] = useControllableState(
    props.isOpen,
    Boolean(props.defaultOpen),
    props.onOpenChange,
  );
  return (
    <DialogTrigger
      isOpen={open && !isLocked}
      onOpenChange={(next) => {
        if (!isLocked) setOpen(next);
      }}
    >
      <AriaButton
        className={hooks.slotClass('button')}
        aria-label={strings.chooseTime}
        isDisabled={isLocked}
      >
        <Glyph icon={ClockGlyph} />
      </AriaButton>
      <CalendarPopover mode={props.mode} settings={settings} onPick={props.onPick}>
        <TimeColumns
          label={strings.timeOfDay}
          value={toTimeParts(value)}
          onChange={(parts) => props.onPick(formatIsoDate(toTime(parts), granularity))}
          granularity={granularity}
          hourCycle={settings.hourCycle}
          bounds={toDayBounds(null, timeBounds, false)}
        />
      </CalendarPopover>
    </DialogTrigger>
  );
}
