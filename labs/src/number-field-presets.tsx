import { useState } from 'react';
import { NumberField } from '../../src/components/number-field/index.js';
import { DecreaseFontSizeGlyph, IncreaseFontSizeGlyph } from '../../src/core/drawn-glyphs.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const fontSizes = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96] as const;

function FontSize() {
  const [committed, setCommitted] = useState<number | null>(11);
  return (
    <>
      <NumberField
        label="Font size"
        description="The buttons and arrows move through 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72 and 96; any size from 1 to 400 can be typed."
        defaultValue={11}
        minValue={1}
        maxValue={400}
        stepValues={fontSizes}
        decrementIcon={DecreaseFontSizeGlyph}
        incrementIcon={IncreaseFontSizeGlyph}
        endAdornment="pt"
        onCommit={setCommitted}
        data-lab-field="font-size"
      />
      <LabOutput name="Font size">{committed === null ? 'empty' : committed}</LabOutput>
    </>
  );
}

/** Preset steps through a list of font sizes, with the font size step glyphs. */
export function NumberFieldPresetsSection() {
  return (
    <LabSection
      title="Preset steps"
      description="A font size field whose step buttons, with the increase and decrease font size glyphs, and arrow keys move through preset sizes; a typed size between presets stays as typed and steps to the nearest preset."
    >
      <FontSize />
      <StateMatrix
        axes={{ state: ['resting', 'at last preset', 'read-only', 'disabled'] as const }}
        render={({ state }) => (
          <NumberField
            label="Size"
            defaultValue={state === 'at last preset' ? 96 : 12}
            stepValues={fontSizes}
            decrementIcon={DecreaseFontSizeGlyph}
            incrementIcon={IncreaseFontSizeGlyph}
            isReadOnly={state === 'read-only'}
            isDisabled={state === 'disabled'}
          />
        )}
      />
    </LabSection>
  );
}
