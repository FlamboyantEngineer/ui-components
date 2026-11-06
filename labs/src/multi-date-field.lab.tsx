import { useState } from 'react';
import { Form as UiForm } from '../../src/components/form/form.js';
import { MultiDateField } from '../../src/components/multi-date-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  type FieldStateName,
  fieldStates,
  type SampleValues,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const samples: SampleValues<string[]> = {
  value: ['2026-04-14', '2026-04-20'],
  edited: ['2026-04-14', '2026-04-16', '2026-04-20'],
  invalid: ['2026-04-15'],
  warning: ['2026-04-17'],
  empty: [],
};

// Day 0 is Sunday and day 6 Saturday; noon UTC keeps the date in every zone.
const isWeekend = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0;

function MatrixField({ state }: { state: FieldStateName }) {
  return <MultiDateField label="Days off" {...useLabFieldState(state, samples)} />;
}

function Picking() {
  const [committed, setCommitted] = useState<string[]>([]);
  return (
    <>
      <MultiDateField
        label="Team days"
        defaultValue={['2026-04-20', '2026-04-08', '2026-04-08']}
        description="Press days to add or remove them; remove a date from its tag too. The repeated 8 April shows once."
        onCommit={setCommitted}
        data-lab-field="picking"
      />
      <LabOutput name="Picked">{JSON.stringify(committed)}</LabOutput>
    </>
  );
}

function Rules() {
  const [committed, setCommitted] = useState<string[]>([]);
  return (
    <>
      <MultiDateField
        label="Office days"
        minValue="2026-04-06"
        maxValue="2026-05-29"
        maxValues={3}
        isDateUnavailable={isWeekend}
        getDateState={(date) =>
          date === '2026-04-15' ? { isTaken: true, description: 'Room booked' } : undefined
        }
        defaultValue={['2026-04-13', '2026-04-14']}
        description="Weekdays from 6 April to 29 May, at most three; once three are chosen the other days are unavailable until one is removed."
        onCommit={setCommitted}
        data-lab-field="rules"
      />
      <LabOutput name="Office">{JSON.stringify(committed)}</LabOutput>
    </>
  );
}

function Planning() {
  return (
    <MultiDateField
      label="Review dates"
      hideTags
      visibleMonths={2}
      weekNumbers="iso"
      calendarHeading="select"
      defaultValue={['2026-12-21', '2027-01-04']}
      description="Two months with ISO week numbers and no tags."
      data-lab-field="planning"
    />
  );
}

function FormEntries() {
  const [entries, setEntries] = useState('none');
  return (
    <UiForm
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <MultiDateField
        label="Event dates"
        name="date"
        isRequired
        defaultValue={['2026-04-21', '2026-04-07']}
        data-lab-field="form"
      />
      <button type="submit">Send</button>
      <LabOutput name="Form">{entries}</LabOutput>
    </UiForm>
  );
}

mountLab(
  <>
    <LabSection title="States" description="The field in every state, holding two dates.">
      <StateMatrix
        axes={{ state: fieldStates }}
        render={({ state }) => <MatrixField state={state} />}
      />
    </LabSection>
    <LabSection
      title="Picking dates"
      description="Each day joins or leaves the set; the value is each date once, earliest first."
    >
      <Picking />
    </LabSection>
    <LabSection
      title="Bounds, unavailable days and a limit"
      description="Days outside the bounds, weekends and a booked day cannot be picked."
    >
      <Rules />
    </LabSection>
    <LabSection
      title="Calendar options"
      description="The Date Time Field's visible months, week numbers and heading selects apply here too."
    >
      <Planning />
    </LabSection>
    <LabSection title="Forms" description="The form submits the name once per date.">
      <FormEntries />
    </LabSection>
  </>,
);
