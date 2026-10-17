import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ColorField, type ColorFieldFormat } from '../../src/components/color-field/color-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const formats = ['hex', 'rgb', 'hsl', 'hsb'] as const satisfies readonly ColorFieldFormat[];

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
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<string | null>(state, {
    value: '#336699',
    edited: '#cc3300',
    invalid: '#ffffff',
    warning: '#ffff00',
    empty: null,
  });
  return <ColorField label="Accent" labelLayout={layout} {...props} />;
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
      <Output name="Changed">{changed}</Output>
      <Output name="Committed">{committed}</Output>
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
      <Output name="Saved">{saved ?? 'empty'}</Output>
    </>
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
    <LabSection title="Formats" description="The colour text in each format.">
      <StateMatrix
        axes={{ format: formats }}
        render={({ format }) => (
          <ColorField label={`Accent, ${format}`} format={format} defaultValue="#336699" />
        )}
      />
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
  </>,
);
