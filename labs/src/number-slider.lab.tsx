import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  NumberField,
  keepThumbsApart,
  normalizeSliderValue,
  snapToStep,
  type NumberFieldValueLabel,
  type NumberRange,
} from '../../src/components/number-field/index.js';
import type { ControlSize } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

// A slider always holds a value, so it has no required state.
const sliderStates = fieldStates.filter((state) => state !== 'required');
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const valueLabels = [
  'output',
  'input',
  'thumb',
  'none',
] as const satisfies readonly NumberFieldValueLabel[];

function Sample({ state, size }: { state: FieldStateName; size: ControlSize }) {
  const props = useLabFieldState<number>(state, {
    value: 40,
    edited: 60,
    invalid: 90,
    warning: 75,
    empty: 0,
  });
  return <NumberField display="slider" label="Volume" size={size} {...props} />;
}

function RangeSample({ state }: { state: FieldStateName }) {
  const props = useLabFieldState<NumberRange>(state, {
    value: [20, 60],
    edited: [30, 70],
    invalid: [0, 90],
    warning: [10, 80],
    empty: [0, 100],
  });
  return <NumberField range display="slider" label="Price" {...props} />;
}

/** Marks with labels, a unit format and the value shown on the thumbs. */
function Marks() {
  return (
    <>
      <NumberField
        display="slider"
        label="Temperature"
        minValue={16}
        maxValue={28}
        step={0.5}
        defaultValue={21}
        formatOptions={{ style: 'unit', unit: 'celsius' }}
        marks={[16, 20, 24, 28].map((value) => ({ value, label: `${value}°` }))}
        description="From 16 to 28 °C in steps of 0.5."
        data-lab-field="marks"
      />
      <NumberField
        display="slider"
        label="Balance"
        minValue={-50}
        maxValue={50}
        defaultValue={-20}
        fillOffset={0}
        marks={[
          { value: -50, label: 'Left' },
          { value: 0, label: 'Centre' },
          { value: 50, label: 'Right' },
        ]}
        description="The fill starts from 0."
        data-lab-field="balance"
      />
    </>
  );
}

/** Each drag or key press commits; React Aria's onChangeEnd reports the value as well. */
function Commit() {
  const [value, setValue] = useState(30);
  const [committed, setCommitted] = useState(30);
  return (
    <>
      <NumberField
        display="slider"
        label="Brightness"
        value={value}
        onChange={setValue}
        onChangeEnd={setCommitted}
        marks={[{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }]}
        data-lab-field="brightness"
      />
      <LabOutput name="Brightness">{value}</LabOutput>
      <LabOutput name="Brightness committed">{committed}</LabOutput>
    </>
  );
}

/** Two thumbs that keep five steps between them, formatted as currency. */
function Range() {
  const [value, setValue] = useState<NumberRange>([100, 300]);
  return (
    <>
      <NumberField
        range
        display="slider"
        label="Price"
        maxValue={500}
        step={10}
        minStepsBetweenThumbs={5}
        value={value}
        onChange={setValue}
        formatOptions={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
        marks={[0, 250, 500].map((mark) => ({ value: mark, label: `€${mark}` }))}
        description="The thumbs stay at least €50 apart."
        data-lab-field="range"
      />
      <LabOutput name="Price">{value.join(' to ')}</LabOutput>
    </>
  );
}

/** The value the field holds is always the one on screen, whatever the bounds and step. */
function Normalized() {
  const [maxValue, setMaxValue] = useState(1);
  const [value, setValue] = useState<NumberRange>([0.1, 0.3]);
  return (
    <>
      <NumberField
        range
        display="slider"
        label="Share"
        maxValue={maxValue}
        step={0.1}
        minStepsBetweenThumbs={1}
        value={value}
        onChange={setValue}
        description="Fractional steps stay on the grid; narrowing the range moves the value onto it."
        data-lab-field="normalized"
      />
      <Button onPress={() => setMaxValue((max) => (max === 1 ? 0.25 : 1))}>
        {maxValue === 1 ? 'Narrow to 0.25' : 'Widen to 1'}
      </Button>
      <Button onPress={() => setValue([Number.NaN, Infinity])}>Give NaN and Infinity</Button>
      <LabOutput name="Share">{value.join(' to ')}</LabOutput>
    </>
  );
}

function Vertical() {
  return (
    <div style={{ display: 'flex', gap: 48 }}>
      <NumberField
        display="slider"
        label="Level"
        orientation="vertical"
        defaultValue={60}
        valueLabel="thumb"
        marks={[
          { value: 0, label: 'Low' },
          { value: 100, label: 'High' },
        ]}
        data-lab-field="vertical"
      />
      <NumberField
        range
        display="slider"
        label="Hours"
        orientation="vertical"
        minValue={0}
        maxValue={24}
        defaultValue={[9, 17]}
        data-lab-field="vertical-range"
      />
    </div>
  );
}

/** A range typed into two inputs, and sliders whose value is edited in inputs beside the track. */
function RangeInputs() {
  const [value, setValue] = useState<NumberRange>([20, 80]);
  return (
    <>
      <NumberField
        range
        label="Age"
        maxValue={120}
        minStepsBetweenThumbs={1}
        value={value}
        onChange={setValue}
        description="Two inputs that stay in order and one year apart."
        data-lab-field="range-field"
      />
      <LabOutput name="Age">{value.join(' to ')}</LabOutput>
      <NumberField
        display="slider"
        label="Opacity"
        valueLabel="input"
        defaultValue={70}
        formatOptions={{ style: 'unit', unit: 'percent' }}
        data-lab-field="slider-input"
      />
      <NumberField
        range
        display="slider"
        label="Budget"
        valueLabel="input"
        maxValue={1000}
        step={50}
        defaultValue={[200, 600]}
        data-lab-field="range-slider-input"
      />
    </>
  );
}

/**
 * Right to left: `dir="rtl"` lays the track out, and the Hebrew provider locale gives React Aria the
 * same direction for the thumbs' positions, the drag and the arrow keys.
 */
function RightToLeft() {
  return (
    <UiProvider locale="he-IL">
      <div dir="rtl" style={{ display: 'grid', gap: 12 }}>
        <NumberField
          display="slider"
          label="Volume"
          defaultValue={50}
          marks={[0, 50, 100].map((value) => ({ value, label: String(value) }))}
          data-lab-field="rtl"
        />
        <NumberField
          range
          display="slider"
          label="Price"
          defaultValue={[20, 60]}
          data-lab-field="rtl-range"
        />
      </div>
    </UiProvider>
  );
}

/** The committed value is the caller's: the fields stay dirty until Save. */
function SavedForm() {
  const [saved, setSaved] = useState(40);
  const [value, setValue] = useState(40);
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form
      aria-label="Sound"
      validationBehavior="aria"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <NumberField
        display="slider"
        label="Volume"
        name="volume"
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue={50}
        menu={['reset', 'set-default']}
        data-lab-field="saved"
      />
      <NumberField
        range
        display="slider"
        label="Quiet hours"
        startName="quiet-from"
        endName="quiet-to"
        minValue={0}
        maxValue={24}
        defaultValue={[6, 22]}
        validate={([start, end]) =>
          end - start > 12
            ? { severity: 'error', message: 'Keep quiet hours to 12 or fewer.' }
            : null
        }
        data-lab-field="quiet"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Button type="submit">Submit</Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </Form>
  );
}

mountLab(
  <>
    <LabSection title="Sizes and states" description="Every size against every field state.">
      <StateMatrix
        axes={{ state: sliderStates, size: sizes }}
        render={({ state, size }) => <Sample state={state} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Value labels and layouts"
      description="The value in an output, on the thumb (shown while hovered, focused or dragged) or nowhere, against every label layout."
    >
      <StateMatrix
        axes={{ valueLabel: valueLabels, layout: fieldLayouts }}
        render={({ valueLabel, layout }) => (
          <NumberField
            display="slider"
            label="Volume"
            labelLayout={layout}
            valueLabel={valueLabel}
            defaultValue={40}
          />
        )}
      />
    </LabSection>
    <LabSection title="Range states" description="A range slider in every field state.">
      <StateMatrix
        axes={{ state: sliderStates }}
        render={({ state }) => <RangeSample state={state} />}
      />
    </LabSection>
    <LabSection
      title="Marks and formats"
      description="Labelled marks, a unit format and a centred fill."
    >
      <Marks />
    </LabSection>
    <LabSection
      title="Commit"
      description="The value follows a drag; the commit lands when it ends."
    >
      <Commit />
    </LabSection>
    <LabSection title="Range" description="The thumbs never cross and keep a minimum distance.">
      <Range />
    </LabSection>
    <LabSection
      title="Range field and value inputs"
      description="A range without a track: a start and an end input. A slider with valueLabel input edits its value in an input per thumb before the track."
    >
      <RangeInputs />
    </LabSection>
    <LabSection
      title="Normalized value"
      description="Validation, callbacks and the form all hold the snapped, clamped and ordered value. NaN reads as the minimum and Infinity as the last step, reported as a change."
    >
      <Normalized />
    </LabSection>
    <LabSection title="Vertical" description="Vertical sliders, one with the value on its thumb.">
      <Vertical />
    </LabSection>
    <LabSection
      title="Right to left"
      description="Under a right-to-left provider locale and dir rtl, the minimum is at the right: the fill grows leftward, Arrow Left raises the value and a drag to the left raises it."
    >
      <RightToLeft />
    </LabSection>
    <LabSection
      title="Form value, dirty state and the field menu"
      description="Each thumb submits under the slider's name; an invalid range blocks the submit."
    >
      <SavedForm />
    </LabSection>
    <LabSection
      title="Host helpers"
      description="The spacing rule a range slider with minDistance applies, and the grid every slider value is snapped onto, for a host that adjusts a range from its own inputs."
    >
      <LabHelperCalls
        calls={[
          [
            'snapToStep(0.1 + 0.2, { minValue: 0, maxValue: 1, step: 0.1 })',
            String(snapToStep(0.1 + 0.2, { minValue: 0, maxValue: 1, step: 0.1 })),
          ],
          [
            'normalizeSliderValue([80, 20], { minValue: 0, maxValue: 50, step: 10 })',
            JSON.stringify(normalizeSliderValue([80, 20], { minValue: 0, maxValue: 50, step: 10 })),
          ],
          [
            'keepThumbsApart([40, 45], [30, 45], { distance: 10, minValue: 0, maxValue: 100 })',
            JSON.stringify(
              keepThumbsApart([40, 45], [30, 45], { distance: 10, minValue: 0, maxValue: 100 }),
            ),
          ],
        ]}
      />
    </LabSection>
  </>,
);
