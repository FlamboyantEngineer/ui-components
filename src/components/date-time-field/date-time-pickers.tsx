'use client';

import { type FocusEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import { useToday } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import { CalendarGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Button as AriaButton,
  Calendar,
  DatePicker,
  DateRangePicker,
  type DateValue,
  formatIsoDate,
  Group,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  RangeCalendar,
  TimeField,
  toCalendarDate,
  toZoned,
} from '../../primitives/index.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import {
  type FieldControlProps,
  FieldPreviousValue,
  type FieldState,
  toAriaControlProps,
} from '../field/field.js';
import { DateDraftScope } from './date-draft.js';
import { Segments } from './date-segments.js';
import {
  CalendarBody,
  CalendarPopover,
  type DateTimeFieldCalendarHeading,
  type DateTimeFieldPreset,
} from './date-time-calendar.js';
import type { DateTimeFieldDateState } from './date-time-field.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';
import { DatePickerTime, DateRangePickerTime } from './date-time-time-picker.js';
import {
  type DateBounds,
  type DateFieldValue,
  type DateRangeValue,
  type DateTimeFieldMode,
  type DateValueOptions,
  toSingleMode,
} from './date-values.js';
import { isTimeUnit, TimeStepButtons, type TimeUnit } from './time-segment-steps.js';

/** How the pickers edit and offer values, beyond the value itself. */
export interface DateControlSettings extends DateValueOptions {
  /** Shows the hours of a day in 12 or 24, whatever the locale's. */
  hourCycle?: 12 | 24 | undefined;
  /** Leaves the time zone out of a zoned value's segments. */
  hideTimeZone?: boolean | undefined;
  /** Refuses `YYYY-MM-DD` dates in the calendar and marks typed ones invalid. */
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
  presets: readonly DateTimeFieldPreset<DateFieldValue>[];
  calendarHeading: DateTimeFieldCalendarHeading;
  /** Whether the field would take a value, so the presets it refuses are disabled. */
  isPickable: (value: DateFieldValue) => boolean;
  /** A required field offers no Clear action. */
  isRequired: boolean;
  /** Whether Clear has a value to clear. */
  canClear: boolean;
}

/** What every picker of a date-time field receives. */
export interface DatePickerControlProps {
  control: FieldControlProps;
  state: FieldState<DateFieldValue>;
  mode: DateTimeFieldMode;
  bounds: DateBounds;
  settings: DateControlSettings;
  /** The committed value as text, shown before the input while the field is dirty. */
  previous: string | null;
  /** Sets a value the reader picked or typed. */
  onPick: (value: DateFieldValue) => void;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

/** A date or a date and time text as the value the date pickers edit, or `null`. */
function toPickerValue(
  text: string | null | undefined,
  mode: 'date' | 'date-time',
  { timeZone, localZone }: DateValueOptions,
) {
  return mode === 'date' ? parseIsoDate(text) : parseIsoDateTime(text, timeZone, localZone);
}

/** The building block's unavailable-date check, asking the caller's about the calendar date. */
function toUnavailableCheck(isDateUnavailable: DateControlSettings['isDateUnavailable']) {
  if (!isDateUnavailable) return undefined;
  return (date: DateValue) => isDateUnavailable(toCalendarDate(date).toString());
}

function pickerProps({ control, settings }: DatePickerControlProps) {
  return {
    ...toAriaControlProps(control),
    className: hooks.slotClass('picker'),
    hourCycle: settings.hourCycle,
  };
}

/**
 * The props the date pickers share: open state, the time settings and unavailable dates. The
 * calendar stays closed while the field is disabled or read-only, whatever `isOpen` asks, and one
 * open when the field locks closes; the caller's `isOpen` is not reported changed.
 */
function useDatePickerProps(props: DatePickerControlProps) {
  const { isOpen, defaultOpen, onOpenChange, settings, mode, state } = props;
  const hasTime = toSingleMode(mode) === 'date-time';
  const [open, setOpen] = useControllableState(isOpen, Boolean(defaultOpen), onOpenChange);
  const isLocked = state.isReadOnly || state.isDisabled;
  return {
    ...pickerProps(props),
    isOpen: open && !isLocked,
    onOpenChange: (next: boolean) => {
      if (!isLocked) setOpen(next);
    },
    granularity: hasTime ? (settings.granularity ?? 'minute') : ('day' as const),
    hideTimeZone: settings.hideTimeZone,
    isDateUnavailable: toUnavailableCheck(settings.isDateUnavailable),
  };
}

/**
 * A zoned starting point, so an empty date-time field in a time zone types zoned values: midnight
 * of today by the provider's clock in that zone, once the clock may be read.
 */
function usePlaceholderValue({ mode, settings }: DatePickerControlProps) {
  const zone = toSingleMode(mode) === 'date-time' ? settings.timeZone : undefined;
  const day = useToday(zone);
  return useMemo(() => {
    const date = zone ? parseIsoDate(day) : null;
    return date && zone ? toZoned(date, zone) : undefined;
  }, [zone, day]);
}

function useBoundValues({ mode, bounds, settings }: DatePickerControlProps) {
  const single = toSingleMode(mode) === 'date' ? 'date' : 'date-time';
  const { timeZone, localZone } = settings;
  const { minValue, maxValue } = bounds;
  return useMemo(
    () => ({
      minValue: toPickerValue(minValue, single, { timeZone, localZone }),
      maxValue: toPickerValue(maxValue, single, { timeZone, localZone }),
    }),
    [single, timeZone, localZone, minValue, maxValue],
  );
}

function PreviousValue({ previous }: { previous: string | null }) {
  return previous ? (
    <FieldPreviousValue className={hooks.slotClass('previous')}>{previous}</FieldPreviousValue>
  ) : null;
}

/** The segments' group element, for the field (`control.ref`) and for the draft's form reset. */
function useGroupRef(controlRef: SlotRef) {
  const root = useRef<HTMLElement>(null);
  const ref = useMergedRefs<HTMLElement>(controlRef, root);
  return { root, ref };
}

/** A picker's framed group: the previous value while dirty, the segments and the button. */
function DateGroup({
  control,
  state,
  previous,
  children,
}: DatePickerControlProps & { children: ReactNode }) {
  const { root, ref } = useGroupRef(control.ref);
  return (
    <Group className={hooks.slotClass('group')} ref={ref}>
      <PreviousValue previous={previous} />
      <DateDraftScope state={state} root={root}>
        {children}
      </DateDraftScope>
    </Group>
  );
}

function CalendarButton() {
  return (
    <AriaButton className={hooks.slotClass('button')}>
      <Glyph icon={CalendarGlyph} />
    </AriaButton>
  );
}

/** A date, or a date and time, typed in segments or picked from a calendar. */
export function DateControl(props: DatePickerControlProps) {
  const { state, mode, settings, onPick } = props;
  const single = mode === 'date' ? 'date' : 'date-time';
  const text = typeof state.value === 'string' ? state.value : null;
  const { timeZone, localZone, granularity } = settings;
  const value = useMemo(
    () => toPickerValue(text, single, { timeZone, localZone }),
    [text, single, timeZone, localZone],
  );
  return (
    <DatePicker<DateValue>
      {...useDatePickerProps(props)}
      {...useBoundValues(props)}
      shouldCloseOnSelect={single === 'date'}
      placeholderValue={usePlaceholderValue(props)}
      value={value}
      onChange={(next) => onPick(next ? formatIsoDate(next, granularity) : null)}
    >
      <DateGroup {...props}>
        <Segments />
        <CalendarButton />
      </DateGroup>
      <CalendarPopover mode={mode} settings={settings} onPick={onPick}>
        <Calendar className={hooks.slotClass('calendar')}>
          <CalendarBody
            getDateState={settings.getDateState}
            months={1}
            heading={settings.calendarHeading}
          />
        </Calendar>
        {single === 'date-time' ? <DatePickerTime {...props} /> : null}
      </CalendarPopover>
    </DatePicker>
  );
}

/** A range of dates, or of dates and times, typed in two segment groups or picked from a calendar. */
export function DateRangeControl(props: DatePickerControlProps) {
  const strings = useUiStrings();
  const { state, mode, settings, onPick } = props;
  const single = mode === 'date-range' ? 'date' : 'date-time';
  const range = typeof state.value === 'object' ? state.value : null;
  const start = range?.start;
  const end = range?.end;
  const { timeZone, localZone, granularity } = settings;
  const value = useMemo(() => {
    const first = toPickerValue(start, single, { timeZone, localZone });
    const last = toPickerValue(end, single, { timeZone, localZone });
    return first && last ? { start: first, end: last } : null;
  }, [start, end, single, timeZone, localZone]);
  const toText = (date: DateValue) => formatIsoDate(date, granularity);
  return (
    <DateRangePicker<DateValue>
      {...useDatePickerProps(props)}
      {...useBoundValues(props)}
      shouldCloseOnSelect={single === 'date'}
      placeholderValue={usePlaceholderValue(props)}
      value={value}
      onChange={(next) => {
        const picked: DateRangeValue | null = next
          ? { start: toText(next.start), end: toText(next.end) }
          : null;
        onPick(picked);
      }}
    >
      <DateGroup {...props}>
        <Segments slot="start" />
        <span {...hooks.slot('separator')} aria-hidden="true">
          {strings.rangeSeparator}
        </span>
        <Segments slot="end" />
        <CalendarButton />
      </DateGroup>
      <CalendarPopover mode={mode} settings={settings} onPick={onPick}>
        <RangeCalendar className={hooks.slotClass('calendar')} visibleDuration={{ months: 2 }}>
          <CalendarBody
            getDateState={settings.getDateState}
            months={2}
            heading={settings.calendarHeading}
          />
        </RangeCalendar>
        {single === 'date-time' ? <DateRangePickerTime {...props} /> : null}
      </CalendarPopover>
    </DateRangePicker>
  );
}

/**
 * A time of day typed in segments, or stepped by the wheel over a segment or by the later and
 * earlier buttons, which step the time segment focused last.
 */
export function TimeControl(props: DatePickerControlProps) {
  const { state, bounds, settings, onPick } = props;
  const granularity = settings.granularity ?? 'minute';
  const { root: groupRoot, ref: groupRef } = useGroupRef(props.control.ref);
  const text = typeof state.value === 'string' ? state.value : null;
  const value = useMemo(() => parseIsoTime(text), [text]);
  const minValue = useMemo(() => parseIsoTime(bounds.minValue), [bounds.minValue]);
  const maxValue = useMemo(() => parseIsoTime(bounds.maxValue), [bounds.maxValue]);
  const [unit, setUnit] = useState<TimeUnit>('hour');
  const followFocus = (event: FocusEvent) => {
    const type = event.target.getAttribute('data-type');
    if (isTimeUnit(type)) setUnit(type);
  };
  return (
    <TimeField
      {...pickerProps(props)}
      granularity={granularity}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      onChange={(next) => onPick(next ? formatIsoDate(next, granularity) : null)}
    >
      <div {...hooks.slot('group')} ref={groupRef} onFocus={followFocus}>
        <PreviousValue previous={props.previous} />
        <DateDraftScope state={state} root={groupRoot}>
          <Segments />
        </DateDraftScope>
        <TimeStepButtons unit={unit} />
      </div>
    </TimeField>
  );
}
