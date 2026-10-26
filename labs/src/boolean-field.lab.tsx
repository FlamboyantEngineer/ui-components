import { useState } from 'react';
import {
  BooleanField,
  type BooleanFieldVariant,
} from '../../src/components/boolean-field/boolean-field.js';
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
    empty: null,
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
  return (
    <form
      data-lab-form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSaved({ ripe: data.get('ripe') === 'true', fresh: data.get('fresh') === 'true' });
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
      title="Labels"
      description="Switch captions, segment and option names, and a toggle button that keeps the width of its widest name."
    >
      <Labels />
    </LabSection>
    <LabSection
      title="Returning to unset"
      description="With allowsUnset the checkbox, switch and toggle button cycle unset, true and false; pressing the selected segment clears it; the dropdown lists an unset option."
    >
      <Unset />
    </LabSection>
    <LabSection title="Dirty, restore, undo and forms" description="A named field in a form.">
      <Saved />
    </LabSection>
  </>,
);
