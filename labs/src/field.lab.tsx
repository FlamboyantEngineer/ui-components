import { useState, type ReactNode } from 'react';
import { Input, type Key } from 'react-aria-components';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  Field,
  FieldRestoreButton,
  getFieldUndo,
  useFieldState,
  validateString,
  type FieldIssue,
  type FieldLabelLayout,
  type FieldMenuEntry,
  type FieldProps,
  type FieldStateOptions,
} from '../../src/components/field/field.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { TextMatchScope } from '../../src/components/text-match/text-match.js';
import { useUiStrings } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const layouts = ['label-control', 'control-label', 'label-colon-control', 'control-only'] as const;
const states = [
  'resting',
  'required',
  'dirty',
  'invalid',
  'warning',
  'pending',
  'read-only',
  'disabled',
] as const;

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

/** A field around a plain React Aria `Input`, which commits on blur and on Enter. */
function SampleField({ options, start, ...field }: SampleFieldProps) {
  const [value, setValue] = useState(start);
  const controlled = start === undefined ? {} : { value, onChange: setValue };
  const state = useFieldState<string>({ validate: checkFruit, ...options, ...controlled });
  return (
    <Field state={state} {...field}>
      {(control) => (
        <Input
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

const stateOptions: Record<(typeof states)[number], FieldStateOptions<string>> = {
  resting: { defaultValue: 'Apple' },
  required: { defaultValue: '', isRequired: true },
  dirty: { committedValue: 'Apple' },
  invalid: { defaultValue: 'Stone' },
  warning: { defaultValue: 'Lime' },
  pending: { defaultValue: 'Apple', isPending: true },
  'read-only': { defaultValue: 'Apple', isReadOnly: true },
  disabled: { defaultValue: 'Apple', isDisabled: true },
};

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

/** The committed value is the caller's: Save commits it, and the field stays dirty until then. */
function DirtyAndRestore() {
  const [committed, setCommitted] = useState('Apple');
  const state = useFieldState<string>({ committedValue: committed, onCommit: setCommitted });
  return (
    <>
      <Field state={state} label="Favourite fruit" description="Edit, then restore or save.">
        {(control) => (
          <Input
            {...control}
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
          />
        )}
      </Field>
      <Button onPress={() => state.commit()}>Save</Button>
      <Output name="Committed">{committed}</Output>
    </>
  );
}

function RemovedValues() {
  const [values, setValues] = useState(['Apple', 'Pear']);
  const removed = ['Apple', 'Pear', 'Plum'].filter((value) => !values.includes(value));
  return (
    <>
      <Output name="Values">{values.join(', ')}</Output>
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
        <IconButton icon="undo" label="Undo" preventFocusOnPress onPress={() => run('undo')} />
        <IconButton icon="redo" label="Redo" preventFocusOnPress onPress={() => run('redo')} />
      </div>
      <SampleField label="Fruit" options={{ defaultValue: 'Fig' }} data-lab-field="fruit" />
      <SampleField label="City" options={{ defaultValue: 'Oslo' }} data-lab-field="city" />
      <Output name="Toolbar">{last}</Output>
    </>
  );
}

const menu: FieldMenuEntry[] = [
  'clear',
  'set-default',
  'help',
  { type: 'separator', id: 'rule' },
  { id: 'copy', label: 'Copy value', icon: 'plus' },
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
        help="Right-click the field or use its menu button."
        data-lab-field="menu"
      />
      <Output name="Menu">{last}</Output>
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

function Highlighting() {
  const [query, setQuery] = useState('an');
  return (
    <>
      <label>
        Filter labels <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <TextMatchScope query={query}>
        <SampleField label="Banana" options={{ defaultValue: '' }} />
        <SampleField label="Mango" options={{ defaultValue: '' }} />
      </TextMatchScope>
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
        axes={{ state: states, layout: layouts }}
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
            Locked
          </Badge>
        }
        menu={['clear', 'help']}
        data-lab-field="parts"
      />
    </LabSection>
    <LabSection title="Dirty and restore" description="Restore puts the committed value back.">
      <DirtyAndRestore />
    </LabSection>
    <LabSection
      title="Restore button"
      description="The restore button on its own, for values a control removed."
    >
      <RemovedValues />
    </LabSection>
    <LabSection
      title="Undo and redo"
      description="Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y) inside a field, or the toolbar, change only the focused field."
    >
      <UndoToolbar />
    </LabSection>
    <LabSection title="Field menu" description="Clear, Set to default, Help and a custom entry.">
      <MenuField />
    </LabSection>
    <LabSection title="String rules" description="Length, format and trimming rules.">
      <NameField />
    </LabSection>
    <LabSection title="Label highlighting" description="A text match scope highlights label text.">
      <Highlighting />
    </LabSection>
  </>,
);
