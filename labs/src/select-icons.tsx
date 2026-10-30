import { HelpGlyph, InfoGlyph, SuccessGlyph, WarningGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import type { FieldLabelLayout } from '../../src/components/field/field.js';
import {
  SelectField,
  type SelectFieldOption,
  type SelectFieldProps,
} from '../../src/components/select-field/select-field.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

const square = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="5" y="5" width="14" height="14" rx="3" />
  </svg>
);

const symbols: SelectFieldOption[] = [
  { id: 'info', label: 'Info', icon: InfoGlyph },
  { id: 'warning', label: 'Warning', icon: WarningGlyph },
  { id: 'success', label: 'Success', icon: SuccessGlyph },
  { id: 'help', label: 'Help', icon: HelpGlyph },
  { id: 'square', label: 'Square', icon: square },
];

const stateProps: Record<FieldStateName, Partial<Extract<SelectFieldProps, { mode?: 'list' }>>> = {
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

function MatrixField({ state, layout }: { state: FieldStateName; layout: FieldLabelLayout }) {
  const [value, setValue] = useState<Key | null>('info');
  const controlled = state === 'dirty' ? { value, onChange: setValue } : {};
  return (
    <SelectField
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
      <SelectField
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

export const iconsChoices = (
  <div data-lab-family="icons">
    <LabSection
      title="Icon choices: Layouts and states"
      description="Every label layout against every state, with a no-icon choice."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <MatrixField state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Icon choices: Picking"
      description="Glyph and custom icons; No icon commits an empty value."
    >
      <Picking />
    </LabSection>
    <LabSection title="Icon choices: Filtering" description="Filtering is off unless asked.">
      <SelectField label="Filtered symbol" options={symbols} filterable />
    </LabSection>
    <LabSection
      title="Icon choices: Clearing"
      description="The select field's clear button passes through."
    >
      <SelectField
        label="Clearable symbol"
        options={symbols}
        defaultValue="star"
        isClearable
        data-lab-field="clearable"
      />
    </LabSection>
  </div>
);
