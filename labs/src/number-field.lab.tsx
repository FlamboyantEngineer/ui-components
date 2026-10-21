import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const steppers = ['shown', 'hidden'] as const;

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
  hideStepper,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
  hideStepper: boolean;
}) {
  const props = useLabFieldState<number | null>(state, {
    value: 4,
    edited: 6,
    invalid: 13,
    warning: 9,
    empty: null,
  });
  return <NumberField label="Weight" labelLayout={layout} hideStepper={hideStepper} {...props} />;
}

function Commit() {
  const [committed, setCommitted] = useState<number | null>(2.5);
  return (
    <>
      <NumberField
        label="Weight"
        description="0 to 10 in steps of 0.5. Out-of-range values are clamped and snapped."
        defaultValue={2.5}
        minValue={0}
        maxValue={10}
        step={0.5}
        onCommit={setCommitted}
        data-lab-field="snap"
      />
      <NumberField
        label="Length"
        description="1 to 10 in steps of 0.5. Out-of-range values are reported."
        commitBehavior="validate"
        defaultValue={2}
        minValue={1}
        maxValue={10}
        step={0.5}
        onCommit={setCommitted}
        data-lab-field="validate"
      />
      <Output name="Committed">{committed === null ? 'empty' : committed}</Output>
    </>
  );
}

function Formats() {
  return (
    <>
      <NumberField
        label="Price"
        defaultValue={1234.5}
        formatOptions={{ style: 'currency', currency: 'EUR' }}
        data-lab-field="currency"
      />
      <NumberField
        label="Share"
        defaultValue={0.25}
        formatOptions={{ style: 'percent' }}
        data-lab-field="percent"
      />
      <NumberField
        label="Tip"
        placeholder="No tip"
        formatOptions={{ style: 'percent' }}
        data-lab-field="placeholder"
      />
      <UiProvider locale="de-DE">
        <NumberField
          label="Distance"
          defaultValue={1234.5}
          formatOptions={{ style: 'unit', unit: 'kilometer', maximumFractionDigits: 1 }}
          data-lab-field="german"
        />
      </UiProvider>
    </>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function SavedField() {
  const [saved, setSaved] = useState<number | null>(4);
  const [value, setValue] = useState<number | null>(4);
  return (
    <>
      <NumberField
        label="Servings"
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue={2}
        menu={['clear', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Output name="Saved">{saved === null ? 'empty' : saved}</Output>
    </>
  );
}

function Affixes() {
  return (
    <>
      <NumberField
        label="Rent"
        defaultValue={1250}
        startAdornment="$"
        endAdornment="/mo"
        hideStepper
        data-lab-field="rent"
      />
      <UiProvider locale="en-IN">
        <NumberField
          label="Budget"
          defaultValue={1250000}
          startAdornment="₹"
          hideStepper
          data-lab-field="lakh"
        />
      </UiProvider>
    </>
  );
}

function FastSteps() {
  const [committed, setCommitted] = useState<number | null>(40);
  return (
    <>
      <NumberField
        label="Opacity"
        description="Shift steps by 10, Alt by 0.1; drag the handle sideways to scrub. Releasing or cancelling ends the scrub."
        defaultValue={40}
        minValue={0}
        maxValue={100}
        smallStep={0.1}
        largeStep={10}
        showScrubber
        endAdornment="%"
        onCommit={setCommitted}
        data-lab-field="fast"
      />
      <Output name="Opacity">{committed === null ? 'empty' : committed}</Output>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state, with and without step buttons."
    >
      <StateMatrix
        axes={{ stepper: steppers, state: fieldStates, layout: fieldLayouts }}
        render={({ stepper, state, layout }) => (
          <Sample state={state} layout={layout} hideStepper={stepper === 'hidden'} />
        )}
      />
    </LabSection>
    <LabSection title="Range and step" description="Snapping and validating commits.">
      <Commit />
    </LabSection>
    <LabSection title="Formats and locales" description="Currency, percent and a German unit.">
      <Formats />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Step the value, then restore, undo with Ctrl+Z, or use the field menu."
    >
      <SavedField />
    </LabSection>
    <LabSection
      title="Literal affixes"
      description="A prefix and suffix the locale cannot format, and the Indian lakh grouping of the en-IN locale."
    >
      <Affixes />
    </LabSection>
    <LabSection title="Fast steps" description="Modifier steps and a scrub handle.">
      <FastSteps />
    </LabSection>
  </>,
);
