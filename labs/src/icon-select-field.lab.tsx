import { useState } from 'react';
import type { Key } from 'react-aria-components';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  IconSelectField,
  type IconSelectFieldOption,
  type IconSelectFieldProps,
} from '../../src/components/icon-select-field/icon-select-field.js';
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

const square = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="5" y="5" width="14" height="14" rx="3" />
  </svg>
);

const symbols: IconSelectFieldOption[] = [
  { id: 'info', label: 'Info', icon: 'info' },
  { id: 'warning', label: 'Warning', icon: 'warning' },
  { id: 'success', label: 'Success', icon: 'success' },
  { id: 'help', label: 'Help', icon: 'help' },
  { id: 'square', label: 'Square', icon: square },
];

const stateProps: Record<State, Partial<IconSelectFieldProps>> = {
  resting: { defaultValue: 'info' },
  required: { isRequired: true },
  dirty: { committedValue: 'warning' },
  invalid: {
    defaultValue: 'info',
    validate: () => ({ severity: 'error', message: 'Pick a status symbol.' }),
  },
  warning: {
    defaultValue: 'info',
    validate: () => ({ severity: 'warning', message: 'Info is easy to miss.' }),
  },
  pending: { defaultValue: 'info', isPending: true },
  'read-only': { defaultValue: 'info', isReadOnly: true },
  disabled: { defaultValue: 'info', isDisabled: true },
};

function MatrixField({ state, layout }: { state: State; layout: FieldLabelLayout }) {
  const [value, setValue] = useState<Key | null>('info');
  const controlled = state === 'dirty' ? { value, onChange: setValue } : {};
  return (
    <IconSelectField
      label="Symbol"
      labelLayout={layout}
      options={symbols}
      emptyLabel="No icon"
      {...stateProps[state]}
      {...controlled}
    />
  );
}

function Picking() {
  const [committed, setCommitted] = useState<Key | null>('square');
  return (
    <>
      <IconSelectField
        label="Symbol"
        options={symbols}
        emptyLabel="No icon"
        defaultValue="square"
        onCommit={setCommitted}
        data-lab-field="symbol"
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
      description="Every label layout against every state, with a no-icon choice."
    >
      <StateMatrix
        axes={{ state: states, layout: layouts }}
        render={({ state, layout }) => <MatrixField state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Picking"
      description="Glyph and custom icons; No icon commits an empty value."
    >
      <Picking />
    </LabSection>
    <LabSection title="Filtering" description="Filtering is off unless asked.">
      <IconSelectField label="Filtered symbol" options={symbols} filterable />
    </LabSection>
  </>,
);
