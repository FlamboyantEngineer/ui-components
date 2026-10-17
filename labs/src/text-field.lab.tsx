import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const lines = ['single', 'multiline'] as const;

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
  multiline,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
  multiline: boolean;
}) {
  const props = useLabFieldState(state, {
    value: 'Apple',
    edited: 'Apples',
    invalid: 'Stone',
    warning: 'Lime',
    empty: '',
  });
  return <TextField label="Fruit" labelLayout={layout} multiline={multiline} {...props} />;
}

/** Commits on blur and Enter; Escape reverts and does not reach the surrounding surface. */
function CommitAndRevert() {
  const [committed, setCommitted] = useState('Oslo');
  const [surface, setSurface] = useState(0);
  return (
    <div
      data-lab-surface
      onKeyDown={(event) => (event.key === 'Escape' ? setSurface((count) => count + 1) : null)}
    >
      <TextField
        label="City"
        defaultValue="Oslo"
        description="Enter or Tab commits, Escape reverts."
        onCommit={setCommitted}
        data-lab-field="commit"
      />
      <TextField
        label="Note"
        multiline
        placeholder="Several lines"
        onCommit={setCommitted}
        data-lab-field="note"
      />
      <Output name="Committed">{committed}</Output>
      <Output name="Escape on the surface">{surface}</Output>
    </div>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function DirtyAndRestore() {
  const [saved, setSaved] = useState('Apple');
  const [value, setValue] = useState('Apple');
  return (
    <>
      <TextField
        label="Favourite fruit"
        value={value}
        onChange={setValue}
        committedValue={saved}
        menu={['clear', 'set-default', 'help']}
        defaultValue="Pear"
        help="Clear empties the field; Set to default puts Pear back."
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Output name="Saved">{saved}</Output>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state, on one line and on several."
    >
      <StateMatrix
        axes={{ lines, state: fieldStates, layout: fieldLayouts }}
        render={({ lines: kind, state, layout }) => (
          <Sample state={state} layout={layout} multiline={kind === 'multiline'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Commit and revert"
      description="Commits on blur and Enter, reverts on Escape."
    >
      <CommitAndRevert />
    </LabSection>
    <LabSection
      title="String rules"
      description="2 to 8 capital letters; surrounding spaces do not count. Typing past the maximum is allowed and reported."
    >
      <TextField
        label="Code"
        minLength={2}
        maxLength={8}
        pattern={/[A-Z]+/}
        trim
        defaultValue="AB"
        data-lab-field="rules"
      />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Edit, then restore, undo with Ctrl+Z, or use the field menu."
    >
      <DirtyAndRestore />
    </LabSection>
  </>,
);
