import { useState } from 'react';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  RelativeDateField,
  type RelativeDateFieldProps,
} from '../../src/components/relative-date-field/relative-date-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const layouts = ['label-control', 'control-label', 'label-colon-control', 'control-only'] as const;
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

/** A fixed clock, so every label in the lab reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const stateProps: Record<State, Partial<RelativeDateFieldProps>> = {
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

function MatrixField({ state, layout }: { state: State; layout: FieldLabelLayout }) {
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

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state, against a clock fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{ state: states, layout: layouts }}
        render={({ state, layout }) => <MatrixField state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection title="Presets" description="Picking a preset commits the date it stands for.">
      <Presets />
    </LabSection>
    <LabSection
      title="Relative text"
      description="Days within a week read relative to now; instants within a day in hours or minutes; older values as dates."
    >
      <RelativeDateField label="Four days ago" getNow={getNow} defaultValue="2026-04-16" />
      <RelativeDateField
        label="Minutes ago"
        valueKind="date-time"
        getNow={getNow}
        defaultValue={new Date(2026, 3, 20, 10, 5).toISOString()}
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
        valueKind="date-time"
        presets={[
          { amount: 3, unit: 'day' },
          { amount: 2, unit: 'week' },
          { amount: 1, unit: 'month' },
          { amount: 1, unit: 'year' },
        ]}
        data-lab-field="custom"
      />
    </LabSection>
  </>,
);
