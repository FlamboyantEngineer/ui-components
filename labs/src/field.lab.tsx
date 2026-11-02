import { PlusGlyph, RedoGlyph, UndoGlyph } from '../../src/core/glyphs.js';
import { Suspense, use, useState, useTransition } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  Field,
  FieldRestoreButton,
  getFieldUndo,
  useFieldState,
  validateString,
  type FieldIssue,
  type FieldIssues,
  type FieldLabelLayout,
  type FieldMenuEntry,
  type FieldProps,
  type FieldStateOptions,
  type FieldValidation,
  type FieldValidationMode,
} from '../../src/components/field/field.js';
import { TextMatchProvider } from '../../src/components/text-match/text-match.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider, useUiStrings } from '../../src/core/provider.js';
import { HelpFromMenu, MenuEverywhere, MenuIcons } from './field-menu-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { CompactFieldsSection } from './field-compact-cases.js';
import { TooltipMessagesSection } from './field-tooltip-cases.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

const modes = [
  'immediate',
  'change',
  'blur',
  'submit',
] as const satisfies readonly FieldValidationMode[];

const takenHandles = ['ada', 'grace'];

/** A server check that answers after 500 ms: ada and grace are taken. */
function checkHandle(value: string, signal: AbortSignal): Promise<FieldIssues> {
  // A handle with a space cannot form the request, so the check throws before it starts.
  if (value.trim().includes(' ')) throw new Error('No request for a handle with a space.');
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const isTaken = takenHandles.includes(value.trim().toLowerCase());
      resolve(isTaken ? { severity: 'error', message: `${value.trim()} is taken.` } : null);
    }, 500);
    signal.addEventListener('abort', () => clearTimeout(timer));
  });
}

/** The stricter server check: short handles are reserved too. */
function checkHandleStrictly(value: string, signal: AbortSignal): Promise<FieldIssues> {
  return checkHandle(value, signal).then(
    (issues) =>
      issues ??
      (value.trim().length < 4
        ? { severity: 'error', message: 'Short handles are reserved.' }
        : null),
  );
}

/** Switching to the stricter validator checks the unchanged handle again. */
function AsyncHandle() {
  const [isStrict, setStrict] = useState(false);
  return (
    <>
      <SampleField
        label="Handle"
        options={{
          defaultValue: 'lin',
          validateAsync: isStrict ? checkHandleStrictly : checkHandle,
          validationDebounce: 300,
        }}
        data-lab-field="async"
      />
      <label>
        <input
          type="checkbox"
          checked={isStrict}
          onChange={(event) => setStrict(event.target.checked)}
        />{' '}
        Reserve short handles
      </label>
    </>
  );
}

/** A password's rules, all reported at once, each tagged with its validity state when it has one. */
function checkPassword(value: string): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (value.length < 8)
    issues.push({ severity: 'error', message: 'Too short.', validity: 'tooShort' });
  if (!/\d/.test(value)) issues.push({ severity: 'error', message: 'Add a digit.' });
  if (!/[A-Z]/.test(value)) issues.push({ severity: 'warning', message: 'A capital helps.' });
  return issues;
}

function checkFruit(value: string): FieldIssue | null {
  if (value === 'Stone') return { severity: 'error', message: 'A stone is not a fruit.' };
  if (value === 'Lime') return { severity: 'warning', message: 'Limes are very sour.' };
  return null;
}

interface SampleFieldProps extends Omit<FieldProps<string>, 'state' | 'children'> {
  options: FieldStateOptions<string>;
  /** Controls the value from this starting value, so a field can start dirty. */
  start?: string;
}

function renderIssues(validation: FieldValidation, issues: readonly FieldIssue[]) {
  return (
    <ul data-lab-status={validation.status}>
      {issues.map((issue) => (
        <li key={issue.message}>
          {issue.validity === 'tooShort' ? 'Use 8 characters or more.' : issue.message}
        </li>
      ))}
    </ul>
  );
}

/**
 * Label-colon-control fields whose messages, one or several, wrapped or not, start under the
 * control, at two sizes and right to left. Toggle the errors to see them come and go in place.
 */
function MessageAlignment() {
  const [hasErrors, setHasErrors] = useState(true);
  // A new start value remounts the fields, which take it as their value.
  const fields = (prefix: string) => (
    <div key={String(hasErrors)} style={{ display: 'grid', gap: 12 }}>
      <SampleField
        label="Fruit"
        labelLayout="label-colon-control"
        options={{}}
        start={hasErrors ? 'Stone' : 'Pear'}
        data-lab-field={`${prefix}single`}
      />
      <SampleField
        label="A much longer label"
        labelLayout="label-colon-control"
        size="sm"
        options={{
          validate: (value: string) =>
            value === 'Stone'
              ? {
                  severity: 'error',
                  message: 'A stone is not a fruit, so pick something that grows on a tree.',
                }
              : null,
        }}
        start={hasErrors ? 'Stone' : 'Pear'}
        data-lab-field={`${prefix}wrapped`}
      />
      <SampleField
        label="Password"
        labelLayout="label-colon-control"
        size="lg"
        options={{ validate: checkPassword }}
        start={hasErrors ? 'abc' : 'Abcdefg1'}
        renderMessage={renderIssues}
        data-lab-field={`${prefix}several`}
      />
    </div>
  );
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p>
        <Button size="sm" onPress={() => setHasErrors((value) => !value)}>
          {hasErrors ? 'Fix the values' : 'Break the values'}
        </Button>
      </p>
      {fields('')}
      <UiProvider locale="he-IL">
        <div dir="rtl">{fields('rtl-')}</div>
      </UiProvider>
    </div>
  );
}

/** A field around a plain native `<input>`, which commits on blur and on Enter. */
function SampleField({ options, start, ...field }: SampleFieldProps) {
  const [value, setValue] = useState(start);
  const controlled = start === undefined ? {} : { value, onChange: setValue };
  const state = useFieldState<string>({ validate: checkFruit, ...options, ...controlled });
  return (
    <Field state={state} {...field}>
      {(control) => (
        <input
          {...control}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
          onBlur={() => state.commit()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') state.commit();
          }}
        />
      )}
    </Field>
  );
}

type RecordName = 'North' | 'South';

interface LoadingRecord {
  name: RecordName;
  /** Settles once the record has loaded; the field suspends until then. */
  loaded: Promise<void>;
}

function RecordFruitField({
  record,
  value,
  onEdit,
}: {
  record: LoadingRecord;
  value: string;
  onEdit: (name: RecordName, value: string) => void;
}) {
  const state = useFieldState<string>({
    value,
    onChange: (next) => onEdit(record.name, next),
  });
  use(record.loaded);
  return (
    <Field state={state} label={`${record.name} fruit`}>
      {(control) => (
        <input
          {...control}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
        />
      )}
    </Field>
  );
}

/** Loading the other record takes 2 s in a transition; edits meanwhile go to the record shown. */
function RecordSwitch() {
  const [values, setValues] = useState<Record<RecordName, string>>({
    North: 'Plum',
    South: 'Quince',
  });
  const [record, setRecord] = useState<LoadingRecord>({ name: 'North', loaded: Promise.resolve() });
  const [edited, setEdited] = useState('none');
  const [isLoading, startTransition] = useTransition();
  const other: RecordName = record.name === 'North' ? 'South' : 'North';
  const onEdit = (name: RecordName, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setEdited(name);
  };
  const load = () =>
    startTransition(() =>
      setRecord({ name: other, loaded: new Promise((resolve) => setTimeout(resolve, 2000)) }),
    );
  return (
    <>
      <Suspense fallback="Loading">
        <RecordFruitField record={record} value={values[record.name]} onEdit={onEdit} />
      </Suspense>
      <Button onPress={load}>Load {other}</Button>
      <LabOutput name="Loading">{isLoading ? 'yes' : 'no'}</LabOutput>
      <LabOutput name="Edited">{edited}</LabOutput>
    </>
  );
}

const stateOptions: Record<FieldStateName, FieldStateOptions<string>> = {
  resting: { defaultValue: 'Apple' },
  required: { defaultValue: '', isRequired: true },
  dirty: { committedValue: 'Apple' },
  invalid: { defaultValue: 'Stone' },
  warning: { defaultValue: 'Lime' },
  pending: { defaultValue: 'Apple', isPending: true },
  'read-only': { defaultValue: 'Apple', isReadOnly: true },
  disabled: { defaultValue: 'Apple', isDisabled: true },
};

/** The committed value is the caller's: Save commits it, and the field stays dirty until then. */
function DirtyAndRestore() {
  const [committed, setCommitted] = useState('Apple');
  const state = useFieldState<string>({ committedValue: committed, onCommit: setCommitted });
  return (
    <>
      <Field state={state} label="Favourite fruit" description="Edit, then restore or save.">
        {(control) => (
          <input
            {...control}
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
          />
        )}
      </Field>
      <Button onPress={() => state.commit()}>Save</Button>
      <LabOutput name="Committed">{committed}</LabOutput>
    </>
  );
}

const sameMembers = (left: ReadonlySet<string>, right: ReadonlySet<string>) =>
  left.size === right.size && [...left].every((member) => right.has(member));

/** A value the field compares by its own rule: a set of tags, equal when it has the same members. */
function CustomValueReset() {
  const state = useFieldState<ReadonlySet<string>>(
    { defaultValue: new Set(['red']) },
    { isEqual: sameMembers },
  );
  return (
    <form aria-label="Custom value">
      <Field state={state} label="Tags" description="Pick blue, then reset the form.">
        {(control) => <input {...control} readOnly value={[...state.value].join(', ')} />}
      </Field>
      <Button onPress={() => state.setValue(new Set(['blue']))}>Pick blue</Button>
      <Button type="reset">Reset</Button>
    </form>
  );
}

function PlainInput() {
  const [text, setText] = useState('Plum');
  return (
    <>
      <SampleField
        label="Filter text"
        options={{ defaultValue: 'Plum', emptyValue: '', tracksChanges: false, onChange: setText }}
        data-lab-field="plain"
      />
      <LabOutput name="Plain value">{text}</LabOutput>
    </>
  );
}

function RemovedValues() {
  const [values, setValues] = useState(['Apple', 'Pear']);
  const removed = ['Apple', 'Pear', 'Plum'].filter((value) => !values.includes(value));
  return (
    <>
      <LabOutput name="Values">{values.join(', ')}</LabOutput>
      <ul>
        {removed.map((value) => (
          <li key={value}>
            <s>{value}</s>{' '}
            <FieldRestoreButton
              label={value}
              size="sm"
              onPress={() => setValues((current) => [...current, value])}
            />
          </li>
        ))}
      </ul>
      <Button onPress={() => setValues(['Plum'])}>Remove Apple and Pear</Button>
    </>
  );
}

/** A host toolbar: its buttons keep focus in the field and undo whichever field holds it. */
function UndoToolbar() {
  const [last, setLast] = useState('none');
  const run = (direction: 'undo' | 'redo') => {
    const undo = getFieldUndo(document.activeElement);
    const can = direction === 'undo' ? undo?.canUndo : undo?.canRedo;
    if (!undo || !can) return setLast(`no ${direction}`);
    undo[direction]();
    const field = document.activeElement?.closest('[data-lab-field]');
    setLast(`${direction} ${field?.getAttribute('data-lab-field') ?? ''}`);
  };
  return (
    <>
      <div role="toolbar" aria-label="Edit">
        <Button icon={UndoGlyph} label="Undo" preventFocusOnPress onPress={() => run('undo')} />
        <Button icon={RedoGlyph} label="Redo" preventFocusOnPress onPress={() => run('redo')} />
      </div>
      <SampleField label="Fruit" options={{ defaultValue: 'Fig' }} data-lab-field="fruit" />
      <SampleField label="City" options={{ defaultValue: 'Oslo' }} data-lab-field="city" />
      <SampleField
        label="Dish"
        options={{ defaultValue: 'Soup' }}
        description={<SampleField label="Note" options={{ defaultValue: '' }} />}
        data-lab-field="dish"
      />
      <LabOutput name="Toolbar">{last}</LabOutput>
    </>
  );
}

const menu: FieldMenuEntry[] = [
  'clear',
  'reset',
  'set-default',
  'help',
  { type: 'separator', id: 'rule' },
  { id: 'copy', label: 'Copy value', icon: PlusGlyph },
];

function MenuField() {
  const [last, setLast] = useState('none');
  return (
    <>
      <SampleField
        label="Fruit"
        options={{ defaultValue: 'Apple', committedValue: 'Pear', emptyValue: '' }}
        menu={menu}
        onMenuAction={(key: Key) => setLast(String(key))}
        help="Right-click the field, or press Shift+F10 in it, for its menu."
        data-lab-field="menu"
      />
      <LabOutput name="Menu">{last}</LabOutput>
    </>
  );
}

function NameField() {
  const strings = useUiStrings();
  const rules = { minLength: 2, maxLength: 12, pattern: /[\p{L} ]+/u, trim: true };
  return (
    <SampleField
      label="Name"
      description="2 to 12 letters; surrounding spaces do not count."
      options={{
        defaultValue: ' Ada ',
        isRequired: true,
        validate: (value) => validateString(value, rules, strings),
      }}
      data-lab-field="name"
    />
  );
}

/** The mode decides when the required field shows its message; Show messages reveals it. */
function ModeField({ mode }: { mode: FieldValidationMode }) {
  const state = useFieldState<string>({ defaultValue: '', isRequired: true, validationMode: mode });
  return (
    <>
      <Field state={state} label="City">
        {(control) => (
          <input
            {...control}
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
          />
        )}
      </Field>
      <Button size="sm" onPress={() => state.revealValidation()}>
        Show messages
      </Button>
    </>
  );
}

function Highlighting() {
  const [query, setQuery] = useState('an');
  return (
    <>
      <label>
        Filter labels <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <TextMatchProvider query={query}>
        <SampleField label="Banana" options={{ defaultValue: '' }} />
        <SampleField label="Mango" options={{ defaultValue: '' }} />
      </TextMatchProvider>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every state. Control-only keeps the label for the control's name."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => (
          <SampleField
            label="Fruit"
            labelLayout={layout as FieldLabelLayout}
            options={stateOptions[state]}
            start={state === 'dirty' ? 'Apples' : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Parts"
      description="Description, help, menu and a decoration slot holding a host badge."
    >
      <SampleField
        label="Variety"
        options={{ committedValue: 'Gala', emptyValue: '' }}
        start="Cox"
        description="The apple variety grown in this orchard."
        help="Varieties are listed in the orchard catalogue."
        decoration={
          <Badge tone="warning" variant="status" announce={false}>
            Imported
          </Badge>
        }
        menu={['clear', 'reset', 'help']}
        data-lab-field="parts"
      />
    </LabSection>
    <CompactFieldsSection />
    <TooltipMessagesSection />
    <LabSection title="Dirty and restore" description="Restore puts the committed value back.">
      <DirtyAndRestore />
    </LabSection>
    <LabSection
      title="Reset a custom value"
      description="A form reset restores a value the field compares with its own equality, such as a set of tags."
    >
      <CustomValueReset />
    </LabSection>
    <LabSection
      title="Plain input"
      description="A field that tracks no changes: never dirty and no Restore, while undo still works."
    >
      <PlainInput />
    </LabSection>
    <LabSection
      title="Restore button"
      description="The restore button on its own, for values a control removed."
    >
      <RemovedValues />
    </LabSection>
    <LabSection
      title="Undo and redo"
      description="Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y) inside a field, or the toolbar, change only the focused field: the note inside the dish's description undoes itself, never the dish."
    >
      <UndoToolbar />
    </LabSection>
    <LabSection
      title="Field menu"
      description="The field's context menu: right-click the field, long-press it, or press Shift+F10 in it. Clear empties it, Reset puts back the committed value (Pear), Set to default puts back the default (Apple); Help and a custom entry follow. Right-clicking the text inside the input opens it too."
    >
      <MenuField />
    </LabSection>
    <LabSection
      title="Menu everywhere in the field"
      description="Right-click directly on the text inside each control (an input, a text area, a number and editable content), long-press it, or press Shift+F10 in it: the field menu opens, not the browser's. Edit a value first: opening the menu keeps the caret and the unsaved edit, and Reset puts back the value the field started with."
    >
      <MenuEverywhere />
    </LabSection>
    <LabSection
      title="Menu icons"
      description="Right-click each field. The first keeps the built-in glyphs; the second swaps Clear's icon, drops Reset's and adds a custom entry with an icon; the number field draws its actions without icons. Labels stay in line either way, and every action still works."
    >
      <MenuIcons />
    </LabSection>
    <LabSection
      title="Help from the menu"
      description="A field with help offers Help at the end of its menu. Right-click a field or press Shift+F10 in it and choose Help: the help shows in a tooltip, against the help button or, for the fields without one (Grower and Crates), against the control, which the help then describes. Escape, typing, a press elsewhere or leaving the field hides it. The button above changes the help or takes it away, and the menus follow."
    >
      <HelpFromMenu />
    </LabSection>
    <LabSection title="String rules" description="Length, format and trimming rules.">
      <NameField />
    </LabSection>
    <LabSection title="Label highlighting" description="A text match scope highlights label text.">
      <Highlighting />
    </LabSection>
    <LabSection
      title="Validation modes"
      description="Immediate shows the message at once, change after an edit, blur after leaving the field, submit after Show messages."
    >
      <StateMatrix axes={{ mode: modes }} render={({ mode }) => <ModeField mode={mode} />} />
    </LabSection>
    <LabSection
      title="Moving inside a field"
      description="A required field in blur mode: Tab to its help button, or open its menu with Shift+F10, and the message waits until focus leaves the field."
    >
      <SampleField
        label="Town"
        options={{ defaultValue: '', isRequired: true, validationMode: 'blur' }}
        help="The town the order ships to."
        menu={['clear', 'reset', 'help']}
        data-lab-field="blur-parts"
      />
    </LabSection>
    <LabSection
      title="Several issues"
      description="Every issue is listed, errors first; the too-short error is reworded from its validity state."
    >
      <SampleField
        label="Password"
        options={{ defaultValue: 'abc', validate: checkPassword }}
        renderMessage={renderIssues}
        data-lab-field="issues"
      />
    </LabSection>
    <LabSection
      title="Messages under the control"
      description="With the label before the control, a message starts under the control, not the label, wrapped lines included, and several issues line up with a single one: no indent, no bullets. Short and long labels, three sizes and right to left; the button switches the errors off and on, and the fields keep their place."
    >
      <MessageAlignment />
    </LabSection>
    <LabSection
      title="Switching records"
      description="While the next record loads in a transition, edits still reach the record the field shows."
    >
      <RecordSwitch />
    </LabSection>
    <LabSection
      title="Asynchronous check"
      description="Checked 300 ms after typing stops and answered after 500 ms; ada and grace are taken. Returning to a value or switching validators checks again. A handle with a space makes the check throw before it starts: the field stops validating and shows no message."
    >
      <AsyncHandle />
    </LabSection>
  </>,
);
