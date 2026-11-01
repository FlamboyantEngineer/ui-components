import { DateStates } from './date-states.js';
import { useState } from 'react';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  DateTimeField,
  type DateRangeValue,
  type DateTimeFieldMode,
  type DateTimeFieldProps,
} from '../../src/components/date-time-field/date-time-field.js';
import { Form as UiForm } from '../../src/components/form/form.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

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
}: {
  state: FieldStateName;
  mode: DateTimeFieldMode;
  layout: FieldLabelLayout;
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
    <LabSection title="Modes and states" description="Each mode in every state.">
      <StateMatrix
        axes={{ state: fieldStates, mode: modes }}
        render={({ state, mode }) => (
          <MatrixField state={state} mode={mode} layout="label-control" />
        )}
      />
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
