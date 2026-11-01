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

const formats = ['hex', 'rgb', 'hsl', 'hsb'] as const satisfies readonly ColorFieldFormat[];
// The first colour comes back at the end: each place is its own swatch.
const swatches = ['#cc3300', '#e69500', '#2e8b57', '#336699', '#7b4fa0', '#4d4d4d', '#cc3300'];

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
  const [format, setFormat] = useState<ColorFieldFormat>('rgb');
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Overlay"
        defaultValue="rgba(51, 102, 153, 0.5)"
        format={format}
        onFormatChange={setFormat}
        formats={['hex', 'rgb', 'hsl']}
        allowsTransparency
        description="Switch the format in the picker; with transparency allowed, the value keeps its alpha as #rrggbbaa. Each input is labelled by its channel's initial; roll the wheel over a channel to step it."
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

function Transparency() {
  const [committed, setCommitted] = useState('none');
  return (
    <>
      <ColorField
        label="Fill"
        defaultValue="#336699"
        allowsTransparency
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="transparency"
      />
      <ColorField
        label="Stroke"
        defaultValue="#336699"
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="opaque"
      />
      <LabOutput name="Transparency committed">{committed}</LabOutput>
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
  const [typed, setTyped] = useState('#2e8b57');
  return (
    <>
      <ColorField
        label="Text colour"
        defaultValue="#2e8b57"
        allowsTyping
        spellCheck={false}
        autoComplete="off"
        swatches={swatches}
        description="Type hex, rgb() or hsl(): a colour is the value as it is typed; Enter, or leaving the field, commits. Enter and Escape that an input method composition owns stay with it."
        onChange={(value) => setTyped(value ?? 'empty')}
        onCommit={(value) => setCommitted(value ?? 'empty')}
        data-lab-field="typing"
      />
      <LabOutput name="Typed value">{typed}</LabOutput>
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
      description="The colour text in each format, with transparency allowed or not, for an opaque and a translucent colour. A translucent colour keeps and shows its alpha either way."
    >
      <StateMatrix
        axes={{
          format: formats,
          transparency: ['allowed', 'off'],
          colour: ['translucent', 'opaque'],
        }}
        render={({ format, transparency, colour }) => (
          <ColorField
            label={`Accent, ${format}`}
            format={format}
            allowsTransparency={transparency === 'allowed'}
            defaultValue={colour === 'opaque' ? '#336699' : 'rgba(51, 102, 153, 0.75)'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Transparency"
      description="With allowsTransparency the picker adds an alpha slider over a checkerboard and an Alpha input; without it the picker edits the colour alone and never changes its alpha."
    >
      <Transparency />
    </LabSection>
    <LabSection
      title="Format choice and stored format"
      description="The picker's format choice, channel inputs and alpha slider."
    >
      <Formats />
    </LabSection>
    <LabSection
      title="Sizes"
      description="The swatch follows the field's size, keeping the same inset from the frame at xs, sm, md and lg, picked or typed."
    >
      <StateMatrix
        axes={{ entry: ['picked', 'typed'], size: ['xs', 'sm', 'md', 'lg'] }}
        render={({ entry, size }) => (
          <ColorField
            label={`Accent ${entry} ${size}`}
            labelLayout="control-only"
            size={size}
            allowsTyping={entry === 'typed'}
            defaultValue="#2e8b57"
          />
        )}
      />
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
    <LabSection
      title="Unreadable stored colour"
      description="A stored value that is no colour shows no colour and is invalid."
    >
      <ColorField label="Imported colour" defaultValue="not-a-colour" data-lab-field="unreadable" />
    </LabSection>
    <LabSection title="Form value" description="A named field submits its stored colour.">
      <FormValue />
    </LabSection>
  </>,
);
