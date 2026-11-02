import { Radices } from './number-radices.js';
import {
  NumberFieldDisplays,
  NumberFieldUnitTypeSection,
  NumberFieldUnitsSection,
} from './number-field-displays.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const steppers = ['shown', 'hidden'] as const;

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
      <NumberField
        label="External amount"
        description="The external value stays visible with its error; blur or Enter snaps it to the allowed range."
        defaultValue={12}
        minValue={0}
        maxValue={10}
        data-lab-field="external"
      />
      <LabOutput name="Committed">{committed === null ? 'empty' : committed}</LabOutput>
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
        enterKeyHint="next"
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
        menu={['clear', 'reset', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{saved === null ? 'empty' : saved}</LabOutput>
    </>
  );
}

function UnitSwitch() {
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  return (
    <div data-lab-demo="unit-switch">
      <NumberField
        label="Distance"
        defaultValue={12}
        endAdornment={
          <Button variant="ghost" size="xs" onPress={() => setUnit(unit === 'km' ? 'mi' : 'km')}>
            {unit}
          </Button>
        }
      />
      <LabOutput name="unit">{unit}</LabOutput>
    </div>
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

function LockedScrub() {
  const [isReadOnly, setReadOnly] = useState(false);
  const [committed, setCommitted] = useState<number | null>(4);
  return (
    <div data-lab-demo="locked-scrub">
      <NumberField
        label="Amount"
        description="Reaching 6 makes the field read-only and ends the scrub. Unlock, then press again to scrub."
        defaultValue={4}
        showScrubber
        isReadOnly={isReadOnly}
        onChange={(value) => {
          if (value !== null && value >= 6) setReadOnly(true);
        }}
        onCommit={setCommitted}
      />
      <Button onPress={() => setReadOnly(false)}>Unlock</Button>
      <LabOutput name="Scrub committed">{committed === null ? 'empty' : committed}</LabOutput>
    </div>
  );
}

function FastSteps() {
  const [committed, setCommitted] = useState<number | null>(40);
  return (
    <>
      <NumberField
        label="Opacity"
        description="Shift steps by 10, Alt by 0.1, with the arrows or the − and + buttons; drag the handle sideways to scrub. Releasing or cancelling ends the scrub."
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
      <LabOutput name="Opacity">{committed === null ? 'empty' : committed}</LabOutput>
    </>
  );
}

function FineSteps() {
  const [committed, setCommitted] = useState<number | null>(1e-7);
  return (
    <>
      <NumberField
        label="Fine increment"
        defaultValue={1e-7}
        step={1e-7}
        smallStep={1e-7}
        formatOptions={{ maximumFractionDigits: 10 }}
        onCommit={setCommitted}
        data-lab-field="fine"
      />
      <LabOutput name="Fine committed">{committed}</LabOutput>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Number bases and units"
      description="The same numeric value in decimal, binary, octal and hexadecimal, with optional byte units. Nondecimal bases edit integers."
    >
      <Radices />
    </LabSection>
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
      description="Step the value, then restore, undo with Ctrl+Z, or open the field's menu (right-click it, or Shift+F10 in it)."
    >
      <SavedField />
    </LabSection>
    <LabSection
      title="Literal affixes"
      description="A prefix and suffix the locale cannot format, and the Indian lakh grouping of the en-IN locale."
    >
      <Affixes />
    </LabSection>
    <LabSection
      title="A control in an affix"
      description="The end affix holds a button that switches the unit; the step buttons keep their own roles."
    >
      <UnitSwitch />
    </LabSection>
    <LabSection
      title="Fast steps"
      description="Modifier steps from the arrow keys and the step buttons, and a scrub handle. A scrub the browser cancels (a pen leaving the screen) puts the start value back and saves nothing."
    >
      <FastSteps />
    </LabSection>
    <NumberFieldDisplays />
    <NumberFieldUnitsSection />
    <NumberFieldUnitTypeSection />
    <LabSection title="Lock during a scrub" description="A lock ends the current pointer gesture.">
      <LockedScrub />
    </LabSection>
    <LabSection
      title="Unreadable values"
      description="NaN and the infinities read as no value in every base: the field shows empty, a required one asks for a value, and the form submits nothing."
    >
      <StateMatrix
        axes={{ given: ['NaN', 'Infinity', '-Infinity'], base: ['decimal', 'hexadecimal'] }}
        render={({ given, base }) => (
          <NumberField
            label="Count"
            isRequired
            validationMode="immediate"
            radix={base === 'decimal' ? 10 : 16}
            defaultValue={Number(given)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Fine steps"
      description="Alt with an arrow preserves tiny decimal increments."
    >
      <FineSteps />
    </LabSection>
  </>,
);
