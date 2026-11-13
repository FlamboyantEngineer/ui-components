import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { Completion } from '../../src/components/completion-list/completion-list.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { InfoGlyph, PlusGlyph } from '../../src/core/glyphs.js';
import { Glyph } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';
import {
  DialogSuggestingField,
  EditorDrivenField,
  MultilineEditorBridge,
} from './text-field-editor-cases.js';

const lines = ['single', 'multiline'] as const;

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
        showRestoreButton
        data-lab-field="commit"
      />
      <TextField
        label="Note"
        multiline
        placeholder="Several lines"
        onCommit={setCommitted}
        data-lab-field="note"
      />
      <LabOutput name="Committed">{committed}</LabOutput>
      <LabOutput name="Escape on the surface">{surface}</LabOutput>
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
        menu={['clear', 'reset', 'set-default', 'help']}
        defaultValue="Pear"
        help="Clear empties the field, Reset puts back the saved value and Set to default puts Pear back."
        showRestoreButton
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{saved}</LabOutput>
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
          <Button
            icon={PlusGlyph}
            label="Copy address"
            size="xs"
            onPress={() => setCopied('yes')}
          />
        }
        data-lab-field="website"
      />
      <TextField
        label="Weight note"
        startAdornment={<Glyph icon={InfoGlyph} />}
        endAdornment="kg"
      />
      <TextField
        label="Log"
        multiline
        minRows={1}
        maxRows={6}
        defaultValue={'First line\nSecond line\nThird line\nFourth line\nFifth line'}
        endAdornment="lines"
        data-lab-field="adorned-log"
      />
      <LabOutput name="Copied">{copied}</LabOutput>
    </>
  );
}

/** Two password fields the host shows or hides together from its own button, beside their own. */
function HostRevealed() {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <div data-lab-field="host-reveal">
      <Button label="Show both passwords" isSelected={isRevealed} onChange={setIsRevealed} />
      <TextField
        label="New password"
        type="password"
        allowsReveal
        isRevealed={isRevealed}
        onRevealChange={setIsRevealed}
        defaultValue="maple river"
        autoComplete="new-password"
      />
      <TextField
        label="Confirm password"
        type="password"
        isRevealed={isRevealed}
        defaultValue="maple river"
        autoComplete="new-password"
      />
      <LabOutput name="Revealed">{isRevealed ? 'yes' : 'no'}</LabOutput>
      <TextField
        label="Shared code"
        type="password"
        allowsReveal
        defaultRevealed
        defaultValue="pear 42"
        autoComplete="off"
      />
    </div>
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
      <LabOutput name="Code">{code || 'none'}</LabOutput>
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
      <LabOutput name="Value">{value}</LabOutput>
    </>
  );
}

const cities: Completion[] = [
  { label: 'Lisbon', description: 'Portugal' },
  { label: 'London', description: 'United Kingdom' },
  { label: 'Lyon', description: 'France' },
  { label: 'Ljubljana', description: 'Slovenia' },
  { label: 'Oslo', description: 'Norway' },
];

const addresses = [{ label: 'alice@example.com' }, { label: 'ada@example.com' }];

/** A vocabulary completes the word before the caret; Enter inserts, Escape closes. */
function CompletedCities() {
  const [committed, setCommitted] = useState('');
  return (
    <>
      <TextField
        label="Destinations"
        description="Separate cities with commas."
        completions={cities}
        onCommit={setCommitted}
        data-lab-field="completions"
      />
      <TextField
        label="Destination"
        completions={cities}
        renderCompletion={(city, { isActive }) => (
          <>
            <strong>{city.label}</strong> {isActive ? city.description : null}
          </>
        )}
        data-lab-field="drawn-completions"
      />
      <TextField
        label="Email"
        type="email"
        description="An email input has no caret position, so a completion replaces the whole value."
        completions={addresses}
        data-lab-field="email-completions"
      />
      <LabOutput name="completions">{committed}</LabOutput>
    </>
  );
}

const longLine = Array.from(
  { length: 12 },
  (_, index) => `segment ${index + 1} of a long reference code`,
).join(' / ');

const longNotes = Array.from(
  { length: 60 },
  (_, index) =>
    `Line ${index + 1}: the river trail passes the old mill, crosses the stone bridge and climbs through the orchard toward the ridge.`,
).join('\n');

/** A long one-line value and two large multiline values, each kept inside a bounded box. */
function LongContent() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 360 }}>
      <TextField
        label="Reference"
        description="One line that scrolls sideways; Home and End reach either end."
        defaultValue={longLine}
        data-lab-field="long-line"
      />
      <TextField
        label="Route notes"
        description="A fixed text area: the text wraps and scrolls inside it, and the corner handle resizes it."
        multiline
        defaultValue={longNotes}
        data-lab-field="long-notes"
      />
      <TextField
        label="Trail log"
        description="Grows from 3 to 8 rows, then scrolls."
        multiline
        minRows={3}
        maxRows={8}
        defaultValue={longNotes}
        data-lab-field="long-grow"
      />
    </div>
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
      <TextField
        label="Line codes"
        description="Each line is OK or a number. The whole text must match, even though the pattern uses the multiline flag."
        multiline
        pattern={/^(?:OK|\d+)$(?:\n^(?:OK|\d+)$)*/m}
        defaultValue={'OK\nbad\n42'}
        data-lab-field="multiline-rules"
      />
      <TextField
        label="Homepage"
        type="url"
        description="A URL field takes an absolute address."
        defaultValue="example.com"
        validationMode="immediate"
        data-lab-field="url-check"
      />
      <TextField
        label="Website"
        type="url"
        description="Enter an absolute address, such as https://example.com."
        validationMode="immediate"
        data-lab-field="empty-url-check"
      />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Edit, then restore, undo with Ctrl+Z, or open the field's menu (right-click it, or Shift+F10 in it)."
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
    <LabSection
      title="Password shown by the host"
      description="The host's button shows or hides both fields together; the first field's own button changes the same state, and the second field has no button of its own. A third field, left to itself, shows its text at first (defaultRevealed)."
    >
      <HostRevealed />
    </LabSection>
    <LabSection
      title="Input types"
      description="Each field renders a native input of its type, named after it: a search box, a phone number, and a password without the reveal button beside the one above."
    >
      <TextField
        label="Search (type search)"
        type="search"
        defaultValue="tea"
        data-lab-field="type-search"
      />
      <TextField
        label="Phone (type tel)"
        type="tel"
        defaultValue="+1 555 0100"
        autoComplete="tel"
        data-lab-field="type-tel"
      />
      <TextField
        label="PIN (type password, no reveal)"
        type="password"
        defaultValue="2468"
        autoComplete="off"
        data-lab-field="type-password"
      />
    </LabSection>
    <LabSection title="Growing notes" description="Grows from 2 to 5 rows, then scrolls.">
      <TextField label="Notes" multiline minRows={2} maxRows={5} data-lab-field="grow" />
    </LabSection>
    <LabSection
      title="Long content"
      description="Substantial values stay inside their boxes, so the page does not grow with them: a single line scrolls sideways, a fixed text area wraps and scrolls (and resizes from its corner), and a growing one stops at 8 rows and then scrolls. The caret and selection reach the end by keyboard (End, Ctrl+End) and by pointer."
    >
      <LongContent />
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
      title="Completions"
      description="Typing a word opens matching cities under the field while the input keeps focus; Ctrl+Space opens them all. The second field draws its options."
    >
      <CompletedCities />
    </LabSection>
    <LabSection
      title="Display value"
      description="At rest the field shows the computed sum; focus shows the typed terms for editing."
    >
      <DisplayedSum />
    </LabSection>
    <LabSection
      title="Driven by an editor"
      description="The caller owns the suggestion list: the input is its combobox, typing opens it, Arrow Down moves and Enter picks. The button focuses the input and selects its text through its ref."
    >
      <EditorDrivenField />
    </LabSection>
    <LabSection
      title="Suggestions in a dialog"
      description="The caller's suggestions open in a dialog after a short load: the input declares a dialog popup and stays busy until the people arrive."
    >
      <DialogSuggestingField />
    </LabSection>
    <LabSection
      title="Editor event bridge"
      description="The text area's beforeinput and composition events reach the caller through controlProps, and textAreaRef holds the text area: Select the note focuses it and selects its text. Typing still changes the field's value."
    >
      <MultilineEditorBridge />
    </LabSection>
  </>,
);
