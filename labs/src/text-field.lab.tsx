import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Glyph } from '../../src/core/provider.js';
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

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** Counts what a reader sees as one character, so a combined emoji counts once. */
function countGraphemes(text: string): number {
  return [...graphemes.segment(text)].length;
}

/** Adornments inside the frame: a glyph, a unit and a button. */
function Adornments() {
  const [copied, setCopied] = useState('none');
  return (
    <>
      <TextField
        label="Website"
        defaultValue="example.com"
        startAdornment="https://"
        endAdornment={
          <IconButton icon="plus" label="Copy address" size="xs" onPress={() => setCopied('yes')} />
        }
        data-lab-field="website"
      />
      <TextField label="Weight note" startAdornment={<Glyph name="info" />} endAdornment="kg" />
      <Output name="Copied">{copied}</Output>
    </>
  );
}

const toHexDigits = (text: string) => text.replace(/[^0-9a-f]/gi, '').toUpperCase();
const toIdentifier = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '_');

/** Typed and pasted text is filtered or rewritten before it becomes the value. */
function TransformedInput() {
  const [code, setCode] = useState('');
  return (
    <>
      <TextField
        label="Colour code"
        description="Hexadecimal digits only, in capitals."
        maxLength={6}
        transformInput={toHexDigits}
        onChange={setCode}
        data-lab-field="hex"
      />
      <TextField
        label="Identifier"
        description="Lower case; spaces and symbols become underscores."
        defaultValue="fruit_bowl"
        transformInput={toIdentifier}
        data-lab-field="identifier"
      />
      <Output name="Code">{code || 'none'}</Output>
    </>
  );
}

/** The sum of `+`-separated numbers, or nothing while the text is not one. */
function sumOf(text: string): string | undefined {
  const terms = text.split('+').map((term) => Number(term.trim()));
  return terms.some((term) => Number.isNaN(term))
    ? undefined
    : String(terms.reduce((a, b) => a + b, 0));
}

/** Shows the sum at rest and the typed terms while editing. */
function DisplayedSum() {
  const [value, setValue] = useState('12 + 30');
  return (
    <>
      <TextField
        label="Total apples"
        description="Type a sum such as 12 + 30; the result shows once you leave the field."
        value={value}
        onChange={setValue}
        displayValue={sumOf(value)}
        data-lab-field="sum"
      />
      <Output name="Value">{value}</Output>
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
    <LabSection title="Adornments" description="Content inside the input's frame.">
      <Adornments />
    </LabSection>
    <LabSection
      title="Password"
      description="The toggle button shows the text while pressed and keeps the caret in place."
    >
      <TextField
        label="Password"
        type="password"
        allowsReveal
        defaultValue="correct horse"
        autoComplete="new-password"
        data-lab-field="password"
      />
    </LabSection>
    <LabSection title="Growing notes" description="Grows from 2 to 5 rows, then scrolls.">
      <TextField label="Notes" multiline minRows={2} maxRows={5} data-lab-field="grow" />
    </LabSection>
    <LabSection
      title="Character count"
      description="The second field counts what a reader sees, so a combined emoji counts once."
    >
      <TextField
        label="Status"
        description="Shown on your profile."
        maxLength={20}
        showCount
        data-lab-field="count"
      />
      <TextField
        label="Reaction"
        maxLength={3}
        showCount
        getLength={countGraphemes}
        defaultValue={'\u{1F44D}\u{1F3FD}'}
        data-lab-field="graphemes"
      />
    </LabSection>
    <LabSection
      title="Input transform"
      description="Rejected characters never enter the value and the caret stays in place, for typing and pasting."
    >
      <TransformedInput />
    </LabSection>
    <LabSection
      title="Display value"
      description="At rest the field shows the computed sum; focus shows the typed terms for editing."
    >
      <DisplayedSum />
    </LabSection>
  </>,
);
