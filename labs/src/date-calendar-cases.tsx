// Date time field cases for the calendar's layout: several months side by side and their paging.

import { useState } from 'react';
import {
  type DateRangeValue,
  DateTimeField,
  type DateTimeFieldVisibleMonths,
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
