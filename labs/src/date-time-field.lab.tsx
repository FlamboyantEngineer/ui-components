import { useState } from 'react';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  DateTimeField,
  type DateRangeValue,
  type DateTimeFieldMode,
  type DateTimeFieldProps,
} from '../../src/components/date-time-field/date-time-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const layouts = ['label-control', 'control-label', 'label-colon-control', 'control-only'] as const;
const modes = ['date', 'time', 'date-time', 'date-range'] as const;
const states = [
  'resting',
  'required',
  'dirty',
  'invalid',
  'warning',
  'pending',
  'read-only',
  'disabled',
] as const;
type State = (typeof states)[number];
type AnyValue = string | DateRangeValue | null;

const samples: Record<DateTimeFieldMode, { value: AnyValue; committed: AnyValue }> = {
  date: { value: '2026-04-13', committed: '2026-04-10' },
  time: { value: '13:45', committed: '09:00' },
  'date-time': {
    value: new Date(2026, 3, 13, 13, 45).toISOString(),
    committed: new Date(2026, 3, 10, 9, 0).toISOString(),
  },
  'date-range': {
    value: { start: '2026-04-13', end: '2026-04-17' },
    committed: { start: '2026-04-06', end: '2026-04-10' },
  },
};

function stateProps(
  state: State,
  mode: DateTimeFieldMode,
): Partial<DateTimeFieldProps<DateTimeFieldMode>> {
  const { value } = samples[mode];
  const props: Record<State, Partial<DateTimeFieldProps<DateTimeFieldMode>>> = {
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
  state: State;
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
        menu={['clear']}
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

mountLab(
  <>
    <LabSection title="Modes and states" description="Each mode in every state.">
      <StateMatrix
        axes={{ state: states, mode: modes }}
        render={({ state, mode }) => (
          <MatrixField state={state} mode={mode} layout="label-control" />
        )}
      />
    </LabSection>
    <LabSection title="Layouts" description="A date field in every label layout.">
      <StateMatrix
        axes={{ layout: layouts }}
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
  </>,
);
