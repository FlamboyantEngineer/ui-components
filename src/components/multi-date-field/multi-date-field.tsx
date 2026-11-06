'use client';

import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import {
  createDateUnavailableCheck,
  type DateTimeFieldCalendarHeading,
  type DateTimeFieldCalendarPaging,
  type DateTimeFieldDateState,
  type DateTimeFieldVisibleMonths,
  type DateTimeFieldWeekday,
  type DateTimeFieldWeekNumbers,
  formatDateValue,
} from '../date-time-field/date-time-field.js';
import { Field, type FieldInputProps, type FieldIssue, useFieldControl } from '../field/field.js';
import { MultiDateControl, multiDateFieldHooks as hooks } from './multi-date-parts.js';
import { findDatesIssue, type MultiDateRules } from './multi-date-values.js';

export interface MultiDateFieldProps extends FieldInputProps<string[]> {
  /** The earliest `YYYY-MM-DD` date the set may hold. */
  minValue?: string | undefined;
  /** The latest `YYYY-MM-DD` date the set may hold. */
  maxValue?: string | undefined;
  /** Refuses a `YYYY-MM-DD` date, such as a weekend: the calendar does not pick it. */
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  /** Highlights or restricts each ISO calendar date. Disabled and taken dates cannot be picked. */
  getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
  /** The most dates the set may hold; once full, the other days cannot be picked. */
  maxValues?: number | undefined;
  /** The form name each chosen date submits under, once per date. */
  name?: string | undefined;
  /** Leaves out the list of chosen dates after the calendar. */
  hideTags?: boolean | undefined;
  /** How many months the calendar shows side by side. Defaults to 1. */
  visibleMonths?: DateTimeFieldVisibleMonths | undefined;
  /** What the calendar's previous and next buttons move by. Defaults to `page`. */
  calendarPaging?: DateTimeFieldCalendarPaging | undefined;
  /** How the calendar heading shows its month. Defaults to `text`. */
  calendarHeading?: DateTimeFieldCalendarHeading | undefined;
  /** The day the calendar's weeks start on. Defaults to the locale's, and to Monday for ISO weeks. */
  firstDayOfWeek?: DateTimeFieldWeekday | undefined;
  /** Shows each calendar week's number, by ISO 8601 (`iso`) or the locale's rule. */
  weekNumbers?: DateTimeFieldWeekNumbers | undefined;
}

/** The field's own check: a set with an unreadable, out-of-bounds or unavailable date, or too many. */
function useDatesCheck(rules: MultiDateRules) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  return (dates: string[]): FieldIssue | null => {
    const issue = findDatesIssue(dates, rules);
    if (!issue) return null;
    const error = (message: string): FieldIssue => ({ severity: 'error', message });
    switch (issue.kind) {
      case 'unreadable':
        return error(strings.dateUnreadable);
      case 'unavailable':
        return error(strings.dateUnavailable);
      case 'too-many':
        return error(strings.tooManyDates(issue.maxValues));
      case 'bound': {
        const limit = formatDateValue(issue.limit, 'date', { locale });
        return error(
          issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit),
        );
      }
    }
  };
}

/**
 * A field for a set of independent calendar dates (React Aria's `Calendar` with multiple
 * selection): each pressed day joins or leaves the set, which is `YYYY-MM-DD` dates, each once and
 * earliest first. The chosen dates also show as removable tags. It has the field base's label,
 * validation, dirty state, restore, undo and menu.
 */
export function MultiDateField({
  minValue,
  maxValue,
  isDateUnavailable,
  getDateState,
  maxValues,
  hideTags = false,
  visibleMonths,
  calendarPaging,
  calendarHeading,
  firstDayOfWeek,
  weekNumbers,
  ...props
}: MultiDateFieldProps) {
  const isUnavailable = createDateUnavailableCheck({ isDateUnavailable, getDateState });
  const rules = { minValue, maxValue, isDateUnavailable: isUnavailable, maxValues };
  const check = useDatesCheck(rules);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: [],
    emptyValue: [],
    check,
  });
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => (
        <MultiDateControl
          control={control}
          state={state}
          label={field.label}
          rules={rules}
          getDateState={getDateState}
          calendar={{
            heading: calendarHeading,
            months: visibleMonths,
            paging: calendarPaging,
            firstDayOfWeek,
            weekNumbers,
          }}
          hideTags={hideTags}
          name={rest.name}
        />
      )}
    </Field>
  );
}
