import type { CalendarDateTime } from '@internationalized/date';
import { useMemo, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Calendar,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateSegment,
  Group,
  RangeCalendar,
  TimeField,
  type DateValue,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { FieldPreviousValue, type FieldControlProps, type FieldState } from '../field/field.js';
import { CalendarBody, CalendarPopover } from './date-time-calendar.js';
import {
  fromDateTimeValue,
  fromTimeValue,
  toCalendarDateValue,
  toDateTimeValue,
  toRangeValue,
  toTimeValue,
  type DateBounds,
  type DateFieldValue,
  type DateRangeValue,
  type DateTimeFieldMode,
} from './date-values.js';

/** What every picker of a date-time field receives. */
export interface DatePickerControlProps {
  control: FieldControlProps;
  state: FieldState<DateFieldValue>;
  mode: DateTimeFieldMode;
  bounds: DateBounds;
  /** The committed value as text, shown before the input while the field is dirty. */
  previous: string | null;
  /** Sets a value the reader picked or typed. */
  onPick: (value: DateFieldValue) => void;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

const hooks = createHooks('date-time-field', [
  'picker',
  'group',
  'previous',
  'input',
  'segment',
  'separator',
  'button',
  'calendar',
]);

function pickerProps({ control, state }: DatePickerControlProps) {
  return {
    className: hooks.slotClass('picker'),
    'aria-label': control['aria-label'],
    'aria-labelledby': control['aria-labelledby'],
    'aria-describedby': control['aria-describedby'],
    isDisabled: state.isDisabled,
    isReadOnly: state.isReadOnly,
    isRequired: state.isRequired,
    isInvalid: state.validation.status === 'invalid',
    validationBehavior: 'aria' as const,
  };
}

function openProps({ isOpen, defaultOpen, onOpenChange }: DatePickerControlProps) {
  return { isOpen, defaultOpen, onOpenChange };
}

function PreviousValue({ previous }: { previous: string | null }) {
  return previous ? (
    <FieldPreviousValue className={hooks.slotClass('previous')}>{previous}</FieldPreviousValue>
  ) : null;
}

/** A picker's framed group: the previous value while dirty, the segments and the button. */
function DateGroup({
  control,
  previous,
  children,
}: DatePickerControlProps & { children: ReactNode }) {
  return (
    <Group className={hooks.slotClass('group')} id={control.id} ref={control.ref}>
      <PreviousValue previous={previous} />
      {children}
    </Group>
  );
}

function Segments({ slot }: { slot?: 'start' | 'end' }) {
  return (
    <DateInput slot={slot} className={hooks.slotClass('input')}>
      {(segment) => <DateSegment segment={segment} className={hooks.slotClass('segment')} />}
    </DateInput>
  );
}

function CalendarButton() {
  return (
    <AriaButton className={hooks.slotClass('button')}>
      <Glyph name="calendar" />
    </AriaButton>
  );
}

/** A date, or a date and time to the minute, typed in segments or picked from a calendar. */
export function DateControl(props: DatePickerControlProps) {
  const { state, mode, bounds, onPick } = props;
  const isDateTime = mode === 'date-time';
  const text = typeof state.value === 'string' ? state.value : null;
  const toValue = isDateTime ? toDateTimeValue : toCalendarDateValue;
  const value = useMemo(() => toValue(text), [toValue, text]);
  const minValue = useMemo(() => toValue(bounds.minValue), [toValue, bounds.minValue]);
  const maxValue = useMemo(() => toValue(bounds.maxValue), [toValue, bounds.maxValue]);
  return (
    <DatePicker<DateValue>
      {...pickerProps(props)}
      {...openProps(props)}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      granularity={isDateTime ? 'minute' : 'day'}
      onChange={(next) => {
        if (!next) return onPick(null);
        onPick(isDateTime ? fromDateTimeValue(next as CalendarDateTime) : next.toString());
      }}
    >
      <DateGroup {...props}>
        <Segments />
        <CalendarButton />
      </DateGroup>
      <CalendarPopover mode={mode} onPick={onPick}>
        <Calendar className={hooks.slotClass('calendar')}>
          <CalendarBody months={1} />
        </Calendar>
      </CalendarPopover>
    </DatePicker>
  );
}

/** A range of dates, typed in two segment groups or picked from a two-month calendar. */
export function DateRangeControl(props: DatePickerControlProps) {
  const { state, bounds, onPick } = props;
  const range = typeof state.value === 'object' ? state.value : null;
  const start = range?.start;
  const end = range?.end;
  const value = useMemo(() => toRangeValue(start && end ? { start, end } : null), [start, end]);
  const minValue = useMemo(() => toCalendarDateValue(bounds.minValue), [bounds.minValue]);
  const maxValue = useMemo(() => toCalendarDateValue(bounds.maxValue), [bounds.maxValue]);
  return (
    <DateRangePicker
      {...pickerProps(props)}
      {...openProps(props)}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      onChange={(next) => {
        const picked: DateRangeValue | null = next
          ? { start: next.start.toString(), end: next.end.toString() }
          : null;
        onPick(picked);
      }}
    >
      <DateGroup {...props}>
        <Segments slot="start" />
        <span {...hooks.slot('separator')} aria-hidden="true">
          –
        </span>
        <Segments slot="end" />
        <CalendarButton />
      </DateGroup>
      <CalendarPopover mode="date-range" onPick={onPick}>
        <RangeCalendar className={hooks.slotClass('calendar')} visibleDuration={{ months: 2 }}>
          <CalendarBody months={2} />
        </RangeCalendar>
      </CalendarPopover>
    </DateRangePicker>
  );
}

/** A time of day typed in segments, with no picker. */
export function TimeControl(props: DatePickerControlProps) {
  const { state, bounds, onPick } = props;
  const text = typeof state.value === 'string' ? state.value : null;
  const value = useMemo(() => toTimeValue(text), [text]);
  const minValue = useMemo(() => toTimeValue(bounds.minValue), [bounds.minValue]);
  const maxValue = useMemo(() => toTimeValue(bounds.maxValue), [bounds.maxValue]);
  return (
    <TimeField
      {...pickerProps(props)}
      id={props.control.id}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      onChange={(next) => onPick(next ? fromTimeValue(next) : null)}
    >
      <div {...hooks.slot('group')} ref={props.control.ref}>
        <PreviousValue previous={props.previous} />
        <Segments />
      </div>
    </TimeField>
  );
}
