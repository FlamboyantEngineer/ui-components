import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import type { DateRangeValue } from '../../src/components/date-time-field/index.js';
import {
  RelativeDateField,
  type RelativeDateFieldProps,
} from '../../src/components/relative-date-field/relative-date-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

/** A fixed clock, so every label in the lab reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const stateProps: Record<FieldStateName, Partial<RelativeDateFieldProps>> = {
  resting: { defaultValue: '2026-04-21' },
  required: { isRequired: true },
  dirty: { committedValue: '2026-04-20' },
  invalid: {
    defaultValue: '2026-04-19',
    validate: () => ({ severity: 'error', message: 'Choose a day ahead.' }),
  },
  warning: {
    defaultValue: '2026-04-21',
    validate: () => ({ severity: 'warning', message: 'That is soon.' }),
  },
  pending: { defaultValue: '2026-04-21', isPending: true },
  'read-only': { defaultValue: '2026-04-21', isReadOnly: true },
  disabled: { defaultValue: '2026-04-21', isDisabled: true },
};

function MatrixField({ state, layout }: { state: FieldStateName; layout: FieldLabelLayout }) {
  const [value, setValue] = useState<string | null>('2026-04-27');
  const controlled = state === 'dirty' ? { value, onChange: setValue } : {};
  return (
    <RelativeDateField
      label="Due"
      labelLayout={layout}
      getNow={getNow}
      {...stateProps[state]}
      {...controlled}
    />
  );
}

function Presets() {
  const [committed, setCommitted] = useState<string | null>('2026-04-20');
  return (
    <>
      <RelativeDateField
        label="Due"
        getNow={getNow}
        defaultValue="2026-04-20"
        onCommit={setCommitted}
        data-lab-field="presets"
      />
      <p>
        Committed: <output data-lab-output="Committed">{committed ?? 'none'}</output>
      </p>
    </>
  );
}

/** The last day of the clock's month, as `YYYY-MM-DD`. */
function endOfMonth(now: Date): string {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
}

function Extras() {
  const [committed, setCommitted] = useState('none');
  const show = (value: string | DateRangeValue | null) =>
    setCommitted(value === null ? 'none' : JSON.stringify(value));
  return (
    <>
      <RelativeDateField
        label="Review"
        getNow={getNow}
        defaultValue="2026-04-21"
        showCalendar
        description="Pick a preset, or Tab into the calendar for any day."
        onCommit={show}
        data-lab-field="calendar"
      />
      <RelativeDateField
        label="Deadline"
        getNow={getNow}
        presets={[
          { amount: 2, unit: 'week', label: 'In a fortnight' },
          { label: 'End of month', getValue: endOfMonth },
        ]}
        onCommit={show}
        data-lab-field="labelled"
      />
      <RelativeDateField
        label="Report period"
        mode="date-range"
        getNow={getNow}
        showCalendar
        onCommit={show}
        data-lab-field="range"
      />
      <RelativeDateField
        label="Delivery"
        getNow={getNow}
        defaultValue="2026-04-21"
        minValue="2026-04-20"
        maxValue="2026-04-25"
        showCalendar
        description="Only 20 to 25 April 2026; presets outside are disabled."
        onCommit={show}
        data-lab-field="bounded"
      />
      <p>
        Committed: <output data-lab-output="Extra">{committed}</output>
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
      <RelativeDateField
        label="Follow-up"
        name="follow-up"
        defaultValue="2026-04-21"
        getNow={getNow}
      />
      <RelativeDateField
        label="Period"
        startName="period-start"
        endName="period-end"
        mode="date-range"
        defaultValue={{ start: '2026-04-13', end: '2026-04-20' }}
        getNow={getNow}
      />
      <button type="submit">Submit</button> <button type="reset">Reset</button>
      <p>
        Form: <output data-lab-output="Form">{entries}</output>
      </p>
    </form>
  );
}

/** A field its host disables a second after a press, so the reader can open the presets first. */
function LockWhileOpen() {
  const [isLocked, setIsLocked] = useState(false);
  return (
    <div data-lab-case="lock-while-open">
      <p>
        <Button size="sm" onPress={() => window.setTimeout(() => setIsLocked(true), 1000)}>
          Disable in a second
        </Button>{' '}
        <Button size="sm" onPress={() => setIsLocked(false)}>
          Enable
        </Button>
      </p>
      <RelativeDateField label="Lockable due date" isDisabled={isLocked} getNow={getNow} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Disabled open state"
      description="A disabled field keeps its presets closed even with an explicit open state."
    >
      <RelativeDateField label="Disabled due date" isDisabled isOpen getNow={getNow} />
    </LabSection>
    <LabSection
      title="Disabled while open"
      description="Press Disable in a second, then open the presets: when the field turns disabled they close, and enabling it again leaves them closed."
    >
      <LockWhileOpen />
    </LabSection>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state, against a clock fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <MatrixField state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection title="Presets" description="Picking a preset commits the date it stands for.">
      <Presets />
    </LabSection>
    <LabSection
      title="Relative text"
      description="Days within a week read relative to now; date-times within a day in hours or minutes; older values as dates."
    >
      <RelativeDateField label="Four days ago" getNow={getNow} defaultValue="2026-04-16" />
      <RelativeDateField
        label="Minutes ago"
        mode="date-time"
        getNow={getNow}
        defaultValue="2026-04-20T10:05"
      />
      <RelativeDateField label="Long ago" getNow={getNow} defaultValue="2026-01-02" />
    </LabSection>
    <LabSection
      title="Custom presets"
      description="Counts of days, weeks, months or years from now."
    >
      <RelativeDateField
        label="Follow up"
        getNow={getNow}
        mode="date-time"
        presets={[
          { amount: 3, unit: 'day' },
          { amount: 2, unit: 'week' },
          { amount: 1, unit: 'month' },
          { amount: 1, unit: 'year' },
        ]}
        data-lab-field="custom"
      />
    </LabSection>
    <LabSection
      title="Calendar, labels, ranges and bounds"
      description="A calendar beside the presets, caller-named and computed presets, relative ranges and bounds."
    >
      <Extras />
    </LabSection>
    <LabSection
      title="Form"
      description="Named fields submit with their form: a date as YYYY-MM-DD under name, and a range's ends under startName and endName, as Date Time Field submits them. Reset puts the first values back."
    >
      <Form />
    </LabSection>
  </>,
);
