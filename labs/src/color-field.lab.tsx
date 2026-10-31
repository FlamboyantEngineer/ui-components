import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ColorField, type ColorFieldFormat } from '../../src/components/color-field/color-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const formats = [
  'hex',
  'hexa',
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hsb',
  'hsba',
] as const satisfies readonly ColorFieldFormat[];
const swatches = ['#cc3300', '#e69500', '#2e8b57', '#336699', '#7b4fa0', '#4d4d4d'];

function Sample({
  state,
  layout,
  allowsTyping,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
  allowsTyping?: boolean;
}) {
  const props = useLabFieldState<string | null>(state, {
    value: '#336699',
    edited: '#cc3300',
    invalid: '#ffffff',
    warning: '#ffff00',
    empty: null,
  });
  return <ColorField label="Accent" labelLayout={layout} allowsTyping={allowsTyping} {...props} />;
}

function Picking() {
  const [changed, setChanged] = useState('none');
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Marker"
        defaultValue="#2e8b57"
        description="Pick in the area, the hue slider or the hex input; the colour commits on close."
        onChange={(value) => setChanged(value ?? 'empty')}
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="picking"
      />
      <ColorField label="Highlight" isRequired defaultValue="#ffd700" data-lab-field="required" />
      <ColorField label="Border" placeholder="Same as the text" data-lab-field="placeholder" />
      <LabOutput name="Changed">{changed}</LabOutput>
      <LabOutput name="Committed">{committed}</LabOutput>
    </>
  );
}

function Formats() {
  const [format, setFormat] = useState<ColorFieldFormat>('rgba');
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Overlay"
        defaultValue="rgba(51, 102, 153, 0.5)"
        format={format}
        onFormatChange={setFormat}
        formats={['hex', 'hexa', 'rgb', 'rgba', 'hsla']}
        description="Switch the format in the picker; the value keeps its alpha as #rrggbbaa."
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="formats"
      />
      <ColorField
        label="Ink"
        defaultValue="rgb(51, 102, 153)"
        defaultFormat="hsl"
        formats={['hsl', 'hsb']}
        valueFormat="rgb"
        description="Edits in HSL or HSB and stores rgb() text."
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="value-format"
      />
      <LabOutput name="Format">{format}</LabOutput>
      <LabOutput name="Format committed">{committed}</LabOutput>
    </>
  );
}

function Presets() {
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Label colour"
        defaultValue="#336699"
        swatches={swatches}
        allowsEyeDropper
        description="Pick a preset swatch; Clear and the screen picker share the footer below the presets. Closing the picker while sampling the screen discards the sample."
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="presets"
      />
      <LabOutput name="Preset committed">{committed}</LabOutput>
    </>
  );
}

function Typing() {
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Text colour"
        defaultValue="#2e8b57"
        allowsTyping
        swatches={swatches}
        description="Type hex, rgb() or hsl(); Enter, or leaving the field, commits. Enter and Escape that an input method composition owns stay with it."
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="typing"
      />
      <LabOutput name="Typed committed">{committed}</LabOutput>
    </>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function Saved() {
  const [saved, setSaved] = useState<string | null>('#336699');
  const [value, setValue] = useState<string | null>('#336699');
  return (
    <>
      <ColorField
        label="Theme"
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue="#000000"
        menu={['clear', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{saved ?? 'empty'}</LabOutput>
    </>
  );
}

/** Each named field submits its stored value once; the typed input adds no second entry. */
function FormValue() {
  const [entries, setEntries] = useState('none');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setEntries(
          [...data.entries()].map(([name, entry]) => `${name}=${String(entry)}`).join(' '),
        );
      }}
    >
      <ColorField label="Brand" name="brand" defaultValue="#336699" format="rgb" />
      <ColorField label="Highlight" name="highlight" defaultValue="#e69500" allowsTyping />
      <button type="submit">Submit</button>
      <LabOutput name="Form">{entries}</LabOutput>
    </form>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Typing across states"
      description="A swatch button and a text input instead of the text trigger."
    >
      <StateMatrix
        axes={{ state: fieldStates }}
        render={({ state }) => <Sample state={state} layout="label-control" allowsTyping />}
      />
    </LabSection>
    <LabSection
      title="Formats"
      description="The colour text in each format, with or without alpha."
    >
      <StateMatrix
        axes={{ format: formats }}
        render={({ format }) => (
          <ColorField
            label={`Accent, ${format}`}
            format={format}
            defaultValue="rgba(51, 102, 153, 0.75)"
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Format choice and stored format"
      description="The picker's format choice, channel inputs and alpha slider."
    >
      <Formats />
    </LabSection>
    <LabSection title="Preset swatches and eye dropper" description="Presets beside the picker.">
      <Presets />
    </LabSection>
    <LabSection title="Typing a colour" description="The closed field takes typed colours.">
      <Typing />
    </LabSection>
    <LabSection title="Picking and clearing" description="Backspace on the trigger clears too.">
      <Picking />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Pick, then restore, undo with Ctrl+Z, or use the field menu."
    >
      <Saved />
    </LabSection>
    <LabSection title="Form value" description="A named field submits its stored colour.">
      <FormValue />
    </LabSection>
  </>,
);
