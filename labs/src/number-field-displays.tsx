import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  NumberField,
  type NumberFieldProps,
  type NumberFieldUnits,
} from '../../src/components/number-field/index.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];

/** Each display choice as the props that draw it. */
const displays = {
  steppers: {},
  'double arrow': { showScrubber: true, hideStepper: true },
  'unit at edge': { showScrubber: true, endAdornment: 'kg', endAdornmentPlacement: 'edge' },
  'unit after value': { showScrubber: true, endAdornment: 'kg', endAdornmentPlacement: 'value' },
} as const satisfies Record<string, Partial<NumberFieldProps>>;

const displayNames = Object.keys(displays) as (keyof typeof displays)[];

function UnitAfterValue() {
  const [committed, setCommitted] = useState<number | null>(12.5);
  return (
    <>
      <NumberField
        label="Load"
        defaultValue={12.5}
        step={0.5}
        smallStep={0.1}
        largeStep={10}
        showScrubber
        endAdornment="kg"
        endAdornmentPlacement="value"
        description="Drag the double arrow sideways or roll the wheel over it; Shift and Alt take larger and smaller steps. The unit follows the number as you type."
        onCommit={setCommitted}
        data-lab-field="unit-after"
      />
      <LabOutput name="Load">{committed === null ? 'empty' : committed}</LabOutput>
    </>
  );
}

/** The display choices (steppers, the double-arrow handle, a unit at the edge or after the number) at every size. */
export function NumberFieldDisplays() {
  return (
    <LabSection
      title="Display choices and sizes"
      description="Step buttons, the double-arrow handle (drag it or roll the wheel over it), and a unit at the frame's edge or right after the number, at xs, sm, md and lg."
    >
      <UnitAfterValue />
      <StateMatrix
        axes={{ display: displayNames, size: sizes }}
        render={({ display, size }) => (
          <NumberField
            label={`Weight ${size}`}
            size={size}
            defaultValue={display === 'unit after value' ? 1250 : 4}
            {...displays[display]}
          />
        )}
      />
    </LabSection>
  );
}

const lengths: NumberFieldUnits = { unit: 'mm', conversions: { cm: 10, m: 1000, in: 25.4 } };

function TypedLength() {
  const [saved, setSaved] = useState<number | null>(120);
  const [value, setValue] = useState<number | null>(120);
  const [committed, setCommitted] = useState<number | null>(120);
  return (
    <>
      <NumberField
        label="Length"
        value={value}
        onChange={setValue}
        committedValue={saved}
        onCommit={setCommitted}
        units={lengths}
        endAdornmentPlacement="value"
        minValue={0}
        step={0.1}
        description="Type 5cm, 0.25 m or 2 in: the length converts to millimetres when you press Enter or leave the field. Another unit, or text that is no number, stays and shows which units the field reads. Save, then edit and restore."
        menu={['clear']}
        data-lab-field="units"
      />
      <Button onPress={() => setSaved(value)}>Save length</Button>
      <LabOutput name="Length committed">{committed === null ? 'empty' : committed}</LabOutput>
      <LabOutput name="Length saved">{saved === null ? 'empty' : saved}</LabOutput>
    </>
  );
}

/** Quantities typed in other units, converted to the field's own. */
export function NumberFieldUnitsSection() {
  return (
    <LabSection
      title="Typed units"
      description="A field in millimetres that also reads centimetres, metres and inches as they are typed or pasted."
    >
      <TypedLength />
    </LabSection>
  );
}
