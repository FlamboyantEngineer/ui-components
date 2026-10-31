import { useState } from 'react';
import {
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
} from '../../src/components/color-swatch/color-swatch.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const colours = ['#336699', '#cc3300', '#2e8b57', 'rgba(0, 0, 0, 0.5)', 'empty'] as const;
const palette = ['#cc3300', '#e69500', '#2e8b57', '#336699', '#7b4fa0', '#4d4d4d'] as const;
const layouts = ['grid', 'stack'] as const;

function Palette() {
  const [picked, setPicked] = useState('#2E8B57');
  return (
    <>
      <ColorSwatchPicker
        aria-label="Palette"
        defaultValue="#2e8b57"
        onChange={setPicked}
        data-lab-picker="palette"
      >
        {palette.map((color) => (
          <ColorSwatchPickerItem key={color} color={color} />
        ))}
        <ColorSwatchPickerItem color="#ffd700" colorName="Sunflower" isDisabled />
      </ColorSwatchPicker>
      <p>
        Picked: <output data-lab-output="picked">{picked}</output>
      </p>
    </>
  );
}

const reds = ['#cc3300', 'rgb(204, 51, 0)', 'hsl(15, 100%, 40%)'] as const;

/** A controlled picker with one colour in three spellings, whose value the buttons set. */
function ControlledPalette() {
  const [value, setValue] = useState('#2e8b57');
  const [reported, setReported] = useState('');
  return (
    <>
      <p>
        <Button size="sm" onPress={() => setValue('rgb(204, 51, 0)')}>
          Set red
        </Button>{' '}
        <Button size="sm" onPress={() => setValue('not a colour')}>
          Set unreadable
        </Button>{' '}
        <Button size="sm" onPress={() => setValue('')}>
          Clear
        </Button>
      </p>
      <ColorSwatchPicker
        aria-label="Controlled palette"
        value={value}
        onChange={(color) => {
          setReported(color);
          setValue(color);
        }}
        data-lab-picker="controlled"
      >
        {reds.map((color) => (
          <ColorSwatchPickerItem key={color} color={color} colorName={`Red, ${color}`} />
        ))}
        <ColorSwatchPickerItem color="#2e8b57" />
      </ColorSwatchPicker>
      <p>
        Value: <output data-lab-output="value">{value}</output>, reported:{' '}
        <output data-lab-output="reported">{reported}</output>
      </p>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Colours and sizes"
      description="Opaque, translucent and empty swatches in every size."
    >
      <StateMatrix
        axes={{ colour: colours, size: sizes }}
        render={({ colour, size }) => (
          <ColorSwatch color={colour === 'empty' ? null : colour} size={size} />
        )}
      />
    </LabSection>
    <LabSection title="Names" description="A colour's own name, a given name and an added label.">
      <p>
        <ColorSwatch color="#336699" data-lab-swatch="named" /> Named by its colour
      </p>
      <p>
        <ColorSwatch color="#cc3300" colorName="Signal red" data-lab-swatch="given" /> A given name
      </p>
      <p>
        <ColorSwatch color="#2e8b57" aria-label="Ripe" data-lab-swatch="label" /> An added label
      </p>
    </LabSection>
    <LabSection
      title="Swatch picker"
      description="Arrow keys move between swatches, Enter or Space picks; the last one is disabled."
    >
      <Palette />
    </LabSection>
    <LabSection
      title="Controlled values and equal colours"
      description="One red in three spellings is three options picked together; an unreadable or empty value picks nothing."
    >
      <ControlledPalette />
    </LabSection>
    <LabSection title="Picker layouts and sizes" description="A grid or a stack of swatches.">
      <StateMatrix
        axes={{ layout: layouts, size: ['sm', 'md', 'lg'] as const }}
        render={({ layout, size }) => (
          <ColorSwatchPicker
            aria-label={`Palette, ${layout}, ${size}`}
            layout={layout}
            size={size}
            defaultValue="#cc3300"
          >
            {palette.slice(0, 3).map((color) => (
              <ColorSwatchPickerItem key={color} color={color} />
            ))}
          </ColorSwatchPicker>
        )}
      />
    </LabSection>
  </>,
);
