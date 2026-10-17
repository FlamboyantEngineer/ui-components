import { useState, type ReactNode } from 'react';
import {
  BooleanField,
  type BooleanFieldVariant,
} from '../../src/components/boolean-field/boolean-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
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
] as const satisfies readonly BooleanFieldVariant[];

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
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
      <Output name="Value">{value === null ? 'unset' : String(value)}</Output>
    </>
  );
}

function Saved() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      data-lab-form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(new FormData(event.currentTarget).get('ripe') === 'true');
      }}
    >
      <BooleanField
        label="Ripe"
        name="ripe"
        committedValue={saved}
        defaultValue={false}
        description="Toggle, then undo with Ctrl+Z, restore, or save."
        data-lab-field="dirty"
      />
      <button type="submit">Save</button>
      <Output name="Saved">{String(saved)}</Output>
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
    <LabSection title="Labels" description="Switch captions and segment names.">
      <Labels />
    </LabSection>
    <LabSection
      title="Returning to unset"
      description="With allowsUnset the checkbox and switch cycle unset, true and false; pressing the selected segment clears it."
    >
      <Unset />
    </LabSection>
    <LabSection title="Dirty, restore, undo and forms" description="A named field in a form.">
      <Saved />
    </LabSection>
  </>,
);
