import { useState } from 'react';
import {
  type DateRangeValue,
  DateTimeField,
  type DateTimeFieldMode,
  type DateTimeFieldProps,
} from '../../src/components/date-time-field/date-time-field.js';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import { Form as UiForm } from '../../src/components/form/form.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { CalendarMonths, CalendarWeeks, RangeAvailability } from './date-calendar-cases.js';
import { DateStates } from './date-states.js';
import { HourGranularity, OpenPopups } from './date-time-open-cases.js';
import { fieldLayouts, type FieldStateName, fieldStates } from './field-states.js';

const modes = ['date', 'time', 'date-time', 'date-range', 'date-time-range'] as const;
type AnyValue = string | DateRangeValue | null;

const samples: Record<DateTimeFieldMode, { value: AnyValue; committed: AnyValue }> = {
  date: { value: '2026-04-13', committed: '2026-04-10' },
  time: { value: '13:45', committed: '09:00' },
  'date-time': { value: '2026-04-13T13:45', committed: '2026-04-10T09:00' },
  'date-range': {
    value: { start: '2026-04-13', end: '2026-04-17' },
    committed: { start: '2026-04-06', end: '2026-04-10' },
  },
  'date-time-range': {
    value: { start: '2026-04-13T09:00', end: '2026-04-13T17:30' },
    committed: { start: '2026-04-10T09:00', end: '2026-04-10T12:00' },
  },
};

// Day 0 is Sunday and day 6 Saturday; noon UTC keeps the date in every zone.
const isWeekend = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0;

function stateProps(
  state: FieldStateName,
  mode: DateTimeFieldMode,
): Partial<DateTimeFieldProps<DateTimeFieldMode>> {
  const { value } = samples[mode];
  const props: Record<FieldStateName, Partial<DateTimeFieldProps<DateTimeFieldMode>>> = {
    resting: { defaultValue: value },
    required: { isRequired: true },
    dirty: {},
    invalid: {
      defaultValue: value,
      validate: () => ({ severity: 'error', message: 'Not a working day.' }),
    },
    warning: {
      defaultValue: value,
      validate: () => ({ severity: 'warning', message: 'That is soon.' }),
    },
    pending: { defaultValue: value, isPending: true },
    'read-only': { defaultValue: value, isReadOnly: true },
    disabled: { defaultValue: value, isDisabled: true },
  };
  return props[state];
}

function MatrixField({
  state,
  mode,
  layout,
  stable = false,
}: {
  state: FieldStateName;
  mode: DateTimeFieldMode;
  layout: FieldLabelLayout;
  stable?: boolean;
}) {
  const sample = samples[mode];
  const [value, setValue] = useState<AnyValue>(sample.value);
  const dirty =
    state === 'dirty' ? { value, onChange: setValue, committedValue: sample.committed } : {};
  return (
    <DateTimeField<DateTimeFieldMode>
      label="Due"
      labelLayout={layout}
      mode={mode}
      {...stateProps(state, mode)}
      {...(stable
        ? { defaultValue: sample.value, changeLayout: 'hidden' as const, showRestoreButton: true }
        : {})}
      {...dirty}
    />
  );
}

function Bounded() {
  const [committed, setCommitted] = useState<AnyValue>('2026-04-13');
  return (
    <>
      <DateTimeField
        label="Delivery"
        defaultValue="2026-04-13"
        minValue="2026-04-01"
        maxValue="2026-04-30"
        description="Any day in April 2026."
        onCommit={setCommitted}
        showRestoreButton
        data-lab-field="bounded"
      />
      <p>
        Committed: <output data-lab-output="Committed">{JSON.stringify(committed)}</output>
      </p>
    </>
  );
}

function Range() {
  const [committed, setCommitted] = useState<AnyValue>(null);
  return (
    <>
      <DateTimeField
        label="Stay"
        mode="date-range"
        defaultValue={{ start: '2026-04-06', end: '2026-04-10' }}
        onCommit={setCommitted}
        data-lab-field="range"
      />
      <p>
        Committed: <output data-lab-output="Range">{JSON.stringify(committed)}</output>
      </p>
    </>
  );
}

function CorrectedRange() {
  const [value, setValue] = useState<DateRangeValue | null>({
    start: '2026-04-01',
    end: '2026-04-03',
  });
  return (
    <DateTimeField
      label="Corrected stay"
      mode="date-range"
      value={value}
      onChange={setValue}
      committedValue={{ start: '2026-04-03', end: '2026-04-01' }}
      data-lab-field="reversed-previous"
    />
  );
}

function Availability() {
  const [committed, setCommitted] = useState<AnyValue>(null);
  return (
    <>
      <DateTimeField
        label="Appointment"
        defaultValue="2026-04-15"
        minValue="2026-04-01"
        isDateUnavailable={isWeekend}
        presets={[
          { label: 'Start of April', value: '2026-04-01' },
          { label: 'Mid April', value: '2026-04-15' },
          { label: 'Mid April', value: '2026-04-16' },
          { label: 'A Saturday', value: '2026-04-18' },
          { label: 'Last year', value: '2025-04-15' },
        ]}
        description="Weekends are unavailable; presets the field refuses are disabled. Two presets share the label Mid April and each sets its own day."
        onCommit={setCommitted}
        data-lab-field="availability"
      />
      <DateTimeField
        label="Holiday"
        mode="date-range"
        presets={[
          { label: 'Easter week', value: { start: '2026-04-06', end: '2026-04-12' } },
          { label: 'May', value: { start: '2026-05-01', end: '2026-05-31' } },
        ]}
        onCommit={setCommitted}
        data-lab-field="range-presets"
      />
      <p>
        Committed: <output data-lab-output="Picked">{JSON.stringify(committed)}</output>
      </p>
    </>
  );
}

function Zones() {
  const [committed, setCommitted] = useState<AnyValue>(null);
  return (
    <>
      <DateTimeField
        label="Alarm"
        mode="time"
        granularity="second"
        hourCycle={24}
        defaultValue="06:30:15"
        onCommit={setCommitted}
        data-lab-field="seconds"
      />
      <DateTimeField
        label="Call in Tokyo"
        mode="date-time"
        timeZone="Asia/Tokyo"
        defaultValue="2026-04-13T12:00:00+09:00[Asia/Tokyo]"
        description="Edits Tokyo wall time; the value is a zoned date and time."
        onCommit={setCommitted}
        data-lab-field="zoned"
      />
      <DateTimeField
        label="Launch"
        mode="date-time"
        defaultValue="2026-04-13T15:00:00Z"
        description="An instant with an offset, shown as wall time in your time zone."
        onCommit={setCommitted}
        data-lab-field="offset"
      />
      <DateTimeField
        label="Shift"
        mode="date-time-range"
        timeZone="UTC"
        hideTimeZone
        defaultValue={{
          start: '2026-04-13T09:00:00+00:00[UTC]',
          end: '2026-04-13T17:00:00+00:00[UTC]',
        }}
        onCommit={setCommitted}
        data-lab-field="time-range"
      />
      <p>
        Committed: <output data-lab-output="Zoned">{JSON.stringify(committed)}</output>
      </p>
    </>
  );
}

function TimePickers() {
  const [committed, setCommitted] = useState<AnyValue>(null);
  return (
    <>
      <DateTimeField
        label="Opening"
        mode="time"
        hourCycle={24}
        defaultValue="09:30"
        onCommit={setCommitted}
        data-lab-field="time-picker"
      />
      <DateTimeField
        label="Shift"
        mode="time"
        hourCycle={12}
        granularity="second"
        minValue="08:00"
        maxValue="18:30"
        defaultValue="08:15:00"
        description="Between 8:00 AM and 6:30 PM."
        onCommit={setCommitted}
        data-lab-field="time-bounded"
      />
      <DateTimeField
        label="Visit"
        mode="date-time"
        hourCycle={24}
        defaultValue="2026-04-13T13:45"
        onCommit={setCommitted}
        data-lab-field="date-time-picker"
      />
      <DateTimeField
        label="Workshop"
        mode="date-time-range"
        hourCycle={24}
        minValue="2026-04-13T09:00"
        defaultValue={{ start: '2026-04-13T10:00', end: '2026-04-14T16:00' }}
        onCommit={setCommitted}
        data-lab-field="range-picker"
      />
      <p>
        Committed: <output data-lab-output="Time">{JSON.stringify(committed)}</output>
      </p>
    </>
  );
}

function Form() {
  const [entries, setEntries] = useState('none');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <DateTimeField label="Due date" name="due" defaultValue="2026-04-13" />
      <DateTimeField
        label="Trip"
        mode="date-range"
        startName="from"
        endName="to"
        defaultValue={{ start: '2026-04-06', end: '2026-04-10' }}
      />
      <button type="submit">Submit</button>
      <p>
        Form: <output data-lab-output="Form">{entries}</output>
      </p>
    </form>
  );
}

/** A range the server refused at one end: the error shows and blocks until that end changes. */
function ServerErrors() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <UiForm
      validationErrors={{ checkout: 'This end date is fully booked.' }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted('sent');
      }}
    >
      <DateTimeField
        label="Stay"
        mode="date-range"
        startName="checkin"
        endName="checkout"
        defaultValue={{ start: '2026-04-20', end: '2026-04-22' }}
        data-lab-field="server-error"
      />
      <button type="submit">Book</button>
      <p>
        Booking: <output data-lab-output="Booking">{submitted}</output>
      </p>
    </UiForm>
  );
}

mountLab(
  <>
    <LabSection
      title="Highlights and availability"
      description="Holidays have semantic colors and descriptions; weekends and closed dates are faded, and taken appointments are struck through. Ranges cannot cross unavailable dates."
    >
      <DateStates />
    </LabSection>
    <LabSection
      title="Modes and states"
      description="Each mode in every state. Required fields show empty placeholders, and dirty fields add the saved value; these different contents take the room they need."
    >
      <div data-lab-family="modes">
        <StateMatrix
          axes={{ state: fieldStates, mode: modes }}
          render={({ state, mode }) => (
            <MatrixField state={state} mode={mode} layout="label-control" />
          )}
        />
      </div>
    </LabSection>
    <LabSection
      title="Stable state layout"
      description="The same value in every state and mode, with saved text hidden by changeLayout: only the state marks, feedback and reserved restore button change. Each field keeps its size."
    >
      <div data-lab-family="stable">
        <StateMatrix
          axes={{ state: fieldStates, mode: modes }}
          render={({ state, mode }) => (
            <MatrixField state={state} mode={mode} layout="label-control" stable />
          )}
        />
      </div>
    </LabSection>
    <LabSection
      title="Saved values and placeholders in narrow columns"
      description="In a 240px column, saved values shorten before the current segments; a range wraps complete runs onto further rows. Empty required fields keep every placeholder segment reachable too. Feedback stays within the field's width."
    >
      <div data-lab-family="narrow">
        <StateMatrix
          axes={{
            content: ['saved value', 'empty'],
            mode: ['date-time', 'date-range', 'date-time-range'],
          }}
          render={({ content, mode }) => (
            <div style={{ width: 240 }}>
              <MatrixField
                state={content === 'empty' ? 'required' : 'dirty'}
                mode={mode}
                layout="label-control"
              />
            </div>
          )}
        />
      </div>
    </LabSection>
    <LabSection title="Layouts" description="A date field in every label layout.">
      <StateMatrix
        axes={{ layout: fieldLayouts }}
        render={({ layout }) => <MatrixField state="resting" mode="date" layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Bounds and calendar"
      description="Days outside April are refused; a typed value outside stays invalid and uncommitted. The calendar offers Today and Clear."
    >
      <Bounded />
    </LabSection>
    <LabSection title="Date and time" description="Edits local time; Now picks the current minute.">
      <DateTimeField label="Meeting" mode="date-time" data-lab-field="instant" />
    </LabSection>
    <LabSection title="Range" description="One range calendar of two months.">
      <Range />
    </LabSection>
    <LabSection
      title="Visible months"
      description="One, two or three months side by side with one selection and focus; a range crosses months. Narrow viewports stack the months."
    >
      <CalendarMonths />
    </LabSection>
    <LabSection
      title="Week start and week numbers"
      description="ISO planning weeks, the locale's numbering, and an organizational week start. Week numbers are row headers, never dates."
    >
      <CalendarWeeks />
    </LabSection>
    <LabSection
      title="Ranges across unavailable days"
      description="With rangeAvailability endpoints, a range needs only open first and last days; the default needs every day open."
    >
      <RangeAvailability />
    </LabSection>
    <LabSection
      title="Corrected range"
      description="A reversed saved range remains readable as the previous value while its corrected draft is shown."
    >
      <CorrectedRange />
    </LabSection>
    <LabSection
      title="Unavailable dates and presets"
      description="Weekends refused in the calendar and when typed; named values beside the calendar."
    >
      <Availability />
    </LabSection>
    <LabSection
      title="Month and year selects"
      description="The calendar heading jumps straight to a month or a year."
    >
      <DateTimeField
        label="Anniversary"
        defaultValue="2026-04-13"
        calendarHeading="select"
        data-lab-field="heading"
      />
    </LabSection>
    <LabSection
      title="Seconds, hour cycle, time zones and date-time ranges"
      description="A 24-hour time to the second, a date and time in Tokyo, and a range of instants."
    >
      <Zones />
    </LabSection>
    <LabSection
      title="Time picker"
      description="Set a time without typing. Roll the wheel over an hour, minute, second or AM/PM segment, or use a time field's up and down buttons, which step the part focused last. A date and time, or a range, also shows hour and minute columns under the calendar, in the same popup. Options outside the bounds are disabled."
    >
      <TimePickers />
    </LabSection>
    <LabSection
      title="Hour granularity"
      description="The segments stop at the hour and the committed value keeps whole hours. The date and time's picker lists hours only, and on 13 April only those from 8:00 to 18:00."
    >
      <HourGranularity />
    </LabSection>
    <LabSection
      title="Open state"
      description="The host holds whether the calendar, and the calendar with its time columns, are open: Open opens it, and Close and the locks wait two seconds so you can open it first. Each request the field makes (the trigger, Escape, a pick) shows before the host grants it. A locked field hides its popup without asking the host to close it, so unlocking shows it again while the host keeps it open. The last two mount a field whose popup opens on its first render."
    >
      <OpenPopups />
    </LabSection>
    <LabSection
      title="Scrolling with the calendar open"
      description="Open a calendar and scroll the page: it stays open beside its field. Escape closes it even while that scroll settles. The second field sits in a scrolling box; scrolling that box scrolls it and closes the calendar, which cannot follow it."
    >
      <DateTimeField label="Arrival" defaultValue="2026-04-13" data-lab-field="scroll-page" />
      <div data-lab-scroll-box style={{ height: 120, overflow: 'auto', border: '1px dashed' }}>
        <div style={{ height: 400, paddingTop: 40 }}>
          <DateTimeField label="Departure" defaultValue="2026-04-20" data-lab-field="scroll-box" />
        </div>
      </div>
    </LabSection>
    <LabSection title="Forms" description="Named fields submit their canonical values.">
      <Form />
    </LabSection>
    <LabSection
      title="Errors for a range's ends"
      description="A form's error under a range's end name shows on the field and blocks submitting until that end changes."
    >
      <ServerErrors />
    </LabSection>
  </>,
);
