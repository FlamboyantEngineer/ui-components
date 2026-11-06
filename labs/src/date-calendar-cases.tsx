// Date time field cases for the calendar's layout: several months side by side, their paging, the
// week start and week numbers.

import { useState } from 'react';
import {
  type DateRangeValue,
  DateTimeField,
  type DateTimeFieldVisibleMonths,
  type DateTimeFieldWeekday,
} from '../../src/components/date-time-field/date-time-field.js';
import { LabOutput } from './lab-output.js';

const monthCounts: readonly DateTimeFieldVisibleMonths[] = [1, 2, 3];

/** A range calendar whose month count the reader changes, with a paging choice beside it. */
export function CalendarMonths() {
  const [months, setMonths] = useState<DateTimeFieldVisibleMonths>(3);
  const [committed, setCommitted] = useState<string | DateRangeValue | null>(null);
  return (
    <>
      <fieldset>
        <legend>Visible months</legend>
        {monthCounts.map((count) => (
          <label key={count}>
            <input
              type="radio"
              name="visible-months"
              checked={months === count}
              onChange={() => setMonths(count)}
            />
            {count}
          </label>
        ))}
      </fieldset>
      <DateTimeField
        label="Trip"
        mode="date-range"
        visibleMonths={months}
        defaultValue={{ start: '2026-04-27', end: '2026-05-04' }}
        description="Pick a start in one month and an end in another; previous and next move by every visible month."
        onCommit={setCommitted}
        data-lab-field="visible-months"
      />
      <DateTimeField
        label="Review"
        visibleMonths={2}
        calendarPaging="month"
        calendarHeading="select"
        defaultValue="2026-12-30"
        description="Two months that page one month at a time; the selects choose the first month."
        onCommit={setCommitted}
        data-lab-field="month-paging"
      />
      <LabOutput name="Months">{JSON.stringify(committed)}</LabOutput>
    </>
  );
}

const weekStarts: readonly DateTimeFieldWeekday[] = ['sun', 'mon', 'sat'];

/** ISO planning weeks, the locale's weeks, and a week start the reader changes. */
export function CalendarWeeks() {
  const [weekStart, setWeekStart] = useState<DateTimeFieldWeekday>('sat');
  return (
    <>
      <DateTimeField
        label="Sprint start"
        weekNumbers="iso"
        visibleMonths={2}
        defaultValue="2026-12-30"
        description="ISO 8601 weeks from Monday: the week of 28 December 2026 is week 53."
        data-lab-field="iso-weeks"
      />
      <DateTimeField
        label="Locale weeks"
        weekNumbers="locale"
        defaultValue="2026-12-30"
        description="The locale's week start and first-week rule."
        data-lab-field="locale-weeks"
      />
      <fieldset>
        <legend>First day of the week</legend>
        {weekStarts.map((day) => (
          <label key={day}>
            <input
              type="radio"
              name="week-start"
              checked={weekStart === day}
              onChange={() => setWeekStart(day)}
            />
            {day}
          </label>
        ))}
      </fieldset>
      <DateTimeField
        label="Rota"
        mode="date-range"
        firstDayOfWeek={weekStart}
        weekNumbers="iso"
        defaultValue={{ start: '2026-04-11', end: '2026-04-17' }}
        description="Weeks start on the chosen day in both months, and the numbers count weeks from that day."
        data-lab-field="week-start"
      />
    </>
  );
}
