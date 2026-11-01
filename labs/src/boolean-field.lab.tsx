import { useState } from 'react';
import {
  BooleanField,
  type BooleanFieldVariant,
} from '../../src/components/boolean-field/boolean-field.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const variants = [
  'checkbox',
  'switch',
  'segmented',
  'dropdown',
  'toggle-button',
] as const satisfies readonly BooleanFieldVariant[];

const twoState = new Set<BooleanFieldVariant>(['checkbox', 'switch', 'toggle-button']);

/** Required means consent on a two-state control and a picked value on a choice. */
function Required() {
  return (
    <>
      <BooleanField
        label="Accept the terms"
        isRequired
        description="Starts unchecked; required asks for a tick."
        data-lab-field="required-consent"
      />
      <BooleanField
        label="Share the report"
        variant="segmented"
        trueLabel="Share"
        falseLabel="Keep private"
        isRequired
        description="Starts with nothing picked; either answer fills it."
        data-lab-field="required-choice"
      />
    </>
  );
}

const sizeStates = ['true', 'false', 'unset', 'disabled', 'required'] as const;

/** One variant at one control size: a value, explicit unset (with allowsUnset), disabled or required. */
function SizedSample({
  variant,
  state,
  size,
}: {
  variant: BooleanFieldVariant;
  state: (typeof sizeStates)[number];
  size: ControlSize;
}) {
  return (
    <BooleanField
      label="Ripe"
      variant={variant}
      size={size}
      defaultValue={state === 'unset' ? null : state === 'true' || state === 'disabled'}
      allowsUnset={state === 'unset'}
      isDisabled={state === 'disabled'}
      isRequired={state === 'required'}
    />
  );
}

function Sample({
  state,
  layout,
  variant,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
  variant: BooleanFieldVariant;
}) {
  const props = useLabFieldState<boolean | null>(state, {
    value: true,
    edited: false,
    invalid: false,
    warning: true,
    // A checkbox, switch or toggle button holds on or off; only a choice starts unset.
    empty: twoState.has(variant) ? false : null,
  });
  return <BooleanField label="Ripe" labelLayout={layout} variant={variant} {...props} />;
}

function Labels() {
  return (
    <>
      <BooleanField label="Email alerts" variant="switch" defaultValue={false} />
      <BooleanField
        label="Exports allowed"
        variant="switch"
        defaultValue={false}
        trueLabel="Yes"
        falseLabel="No"
        data-lab-field="captioned"
      />
      <BooleanField
        label="Orientation"
        variant="segmented"
        trueLabel="Portrait"
        falseLabel="Landscape"
      />
      <BooleanField
        label="Delivery"
        variant="dropdown"
        defaultValue
        trueLabel="Express"
        falseLabel="Standard"
        data-lab-field="dropdown-labels"
      />
      <BooleanField
        label="Night mode"
        variant="toggle-button"
        defaultValue={false}
        trueLabel="Enabled"
        falseLabel="Off"
        data-lab-field="toggle-labels"
      />
    </>
  );
}

function Unset() {
  const [value, setValue] = useState<boolean | null>(null);
  return (
    <>
      {variants.map((variant) => (
        <BooleanField
          key={variant}
          label={`Inherit, ${variant}`}
          variant={variant}
          allowsUnset
          value={value}
          onChange={setValue}
          unsetLabel="Inherited"
          menu={['clear']}
          data-lab-field={`unset-${variant}`}
        />
      ))}
      <LabOutput name="Value">{value === null ? 'unset' : String(value)}</LabOutput>
    </>
  );
}

function Saved() {
  const [saved, setSaved] = useState({ ripe: false, fresh: false });
  const [submitted, setSubmitted] = useState('nothing yet');
  return (
    <form
      data-lab-form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSaved({ ripe: data.get('ripe') === 'true', fresh: data.get('fresh') === 'true' });
        setSubmitted(
          [...data.entries()].map(([key, value]) => `${key}=${String(value)}`).join(' '),
        );
      }}
    >
      <BooleanField
        label="Ripe"
        name="ripe"
        committedValue={saved.ripe}
        defaultValue={false}
        description="Toggle, then undo with Ctrl+Z, restore, or save."
        data-lab-field="dirty"
      />
      <BooleanField
        label="Fresh"
        name="fresh"
        variant="toggle-button"
        committedValue={saved.fresh}
        defaultValue={false}
        trueLabel="Fresh"
        falseLabel="Stale"
        menu={['set-default']}
        data-lab-field="dirty-toggle"
      />
      <button type="submit">Save</button>
      <LabOutput name="Saved">{String(saved.ripe)}</LabOutput>
      <LabOutput name="Saved fresh">{String(saved.fresh)}</LabOutput>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </form>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state, for each variant."
    >
      <StateMatrix
        axes={{ variant: variants, state: fieldStates, layout: fieldLayouts }}
        render={({ variant, state, layout }) => (
          <Sample state={state} layout={layout} variant={variant} />
        )}
      />
    </LabSection>
    <LabSection
      title="Control sizes"
      description="Every variant at xs, sm, md and lg through the field's size: true, false, explicit unset (allowsUnset), disabled and required. The checkbox box, switch track, segments, dropdown trigger, toggle button and label text all follow the field's control height and type step, and every focus ring stays outside the control."
    >
      <StateMatrix
        axes={{ variant: variants, state: sizeStates, size: ['xs', 'sm', 'md', 'lg'] }}
        render={({ variant, state, size }) => (
          <SizedSample variant={variant} state={state} size={size} />
        )}
      />
    </LabSection>
    <LabSection
      title="Labels"
      description="Switch captions, segment and option names, and a toggle button that keeps the width of its widest name."
    >
      <Labels />
    </LabSection>
    <LabSection
      title="Required: consent or an answer"
      description="A checkbox, switch or toggle button starts false, and required asks for true, as consent does. The segmented and dropdown variants start with nothing picked, and required asks for either answer: false is a value. Only allowsUnset makes a checkbox mixed."
    >
      <Required />
    </LabSection>
    <LabSection
      title="Returning to unset"
      description="With allowsUnset the checkbox, switch and toggle button cycle unset, true and false; pressing the selected segment clears it; the dropdown lists an unset option."
    >
      <Unset />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and forms"
      description="Named fields in a form: the checkbox and the toggle button both submit true or false."
    >
      <Saved />
    </LabSection>
  </>,
);
