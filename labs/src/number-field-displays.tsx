import { useState } from 'react';
import {
  NumberField,
  type NumberFieldProps,
} from '../../src/components/number-field/number-field.js';
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
