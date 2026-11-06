'use client';

import { type FocusEvent, useMemo, useRef } from 'react';
import { useIsClockReadable, useToday } from '../../core/clock.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Calendar,
  type CalendarDate,
  type DateValue,
  parseIsoDate,
  useLocale,
} from '../../primitives/index.js';
import {
  CalendarBody,
  type CalendarOptions,
  type DateTimeFieldDateState,
  formatDateValue,
  toCalendarProps,
} from '../date-time-field/date-time-field.js';
import {
  type FieldControlProps,
  FieldFormValue,
  type FieldState,
  toAriaControlProps,
} from '../field/field.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import { type MultiDateRules, normalizeDates } from './multi-date-values.js';

interface MultiDateControlProps {
  control: FieldControlProps;
  state: FieldState<string[]>;
  /** The field's label, which names the tags. */
  label: string;
  rules: MultiDateRules;
  getDateState: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
  calendar: CalendarOptions;
  hideTags: boolean;
  /** The form name each date submits under. */
  name: string | undefined;
}

export const multiDateFieldHooks = createHooks('multi-date-field', ['control', 'calendar', 'tags']);

const hooks = multiDateFieldHooks;

/**
 * The days the calendar refuses: unavailable ones, and while the set is full every day it does not
 * hold, so a pick can only remove.
 */
function toCalendarUnavailable(dates: readonly string[], rules: MultiDateRules) {
  const isFull = rules.maxValues !== undefined && dates.length >= rules.maxValues;
  if (!isFull && !rules.isDateUnavailable) return undefined;
  return (date: DateValue) => {
    const text = date.toString().slice(0, 10);
    if (isFull && !dates.includes(text)) return true;
    return Boolean(rules.isDateUnavailable?.(text));
  };
}

/** The chosen dates as removable tags, in the locale's words, earliest first. */
function DateTags({
  dates,
  label,
  isEditable,
  isDisabled,
  onRemove,
}: {
  dates: readonly string[];
  label: string;
  isEditable: boolean;
  isDisabled: boolean;
  onRemove: (keys: Set<Key>) => void;
}) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const items = useMemo(() => dates.map((date) => ({ date })), [dates]);
  if (dates.length === 0) return null;
  return (
    <TagGroup
      className={hooks.slotClass('tags')}
      aria-label={strings.selectedValues(label)}
      items={items}
      onRemove={isEditable ? onRemove : undefined}
      disabledKeys={isDisabled ? dates : undefined}
    >
      {({ date }) => <Tag id={date}>{formatDateValue(date, 'date', { locale })}</Tag>}
    </TagGroup>
  );
}

/**
 * The field's control: an inline calendar whose pressed days join or leave the set, the chosen
 * dates as tags, and a hidden input per date for the form. Removing the last tag returns focus to
 * the calendar. The calendar draws once the device's clock may be read, after hydration, since its
 * today mark is the device's.
 */
export function MultiDateControl(props: MultiDateControlProps) {
  const { control, state, rules, calendar } = props;
  const { ref: controlRef, ...controlProps } = control;
  const isReadable = useIsClockReadable();
  const today = useToday();
  const root = useRef<HTMLDivElement>(null);
  const dates = useMemo(() => normalizeDates(state.value), [state.value]);
  const value = useMemo(
    () => dates.map(parseIsoDate).filter((date): date is CalendarDate => date !== null),
    [dates],
  );
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const change = (next: readonly string[]) => {
    state.setValue(normalizeDates(next));
    state.commit();
  };
  const focusCalendar = () =>
    root.current?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]')?.focus();
  const remove = (keys: Set<Key>) => {
    const next = dates.filter((date) => !keys.has(date));
    change(next);
    if (next.length === 0) focusCalendar();
  };
  // The field focuses its control (a restore, autoFocus): the calendar's focused day takes it.
  const delegateFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) focusCalendar();
  };
  return (
    <div {...hooks.slot('control')} ref={root}>
      <div ref={controlRef} tabIndex={-1} onFocus={delegateFocus}>
        {isReadable ? (
          <Calendar<CalendarDate, 'multiple'>
            {...toAriaControlProps(controlProps)}
            {...toCalendarProps(calendar)}
            className={hooks.slotClass('calendar')}
            selectionMode="multiple"
            value={value}
            onChange={(next) => change(next.map((date) => date.toString()))}
            minValue={parseIsoDate(rules.minValue)}
            maxValue={parseIsoDate(rules.maxValue)}
            isDateUnavailable={toCalendarUnavailable(dates, rules)}
            defaultFocusedValue={value[0] ?? parseIsoDate(today)}
          >
            <CalendarBody options={calendar} getDateState={props.getDateState} />
          </Calendar>
        ) : null}
      </div>
      {props.hideTags ? null : (
        <DateTags
          dates={dates}
          label={props.label}
          isEditable={isEditable}
          isDisabled={state.isDisabled}
          onRemove={remove}
        />
      )}
      <FieldFormValue name={props.name} value={dates} isDisabled={state.isDisabled} />
    </div>
  );
}
