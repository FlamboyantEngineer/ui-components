import { useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import type { CodeEditorSize } from '../../src/components/code-editor/code-editor.js';
import type { FieldIssue, FieldLabelLayout } from '../../src/components/field/field.js';
import { JsonEditor, type JsonEditorProps } from '../../src/components/json-editor/json-editor.js';
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
const sizes = ['sm', 'md', 'lg'] as const;

const basket = '{\n  "fruit": "Apple",\n  "count": 12\n}';

/** Warns about a basket without fruit. */
function checkBasket(value: string): FieldIssue | null {
  return value.includes('"fruit"') || value.trim() === ''
    ? null
    : { severity: 'warning', message: 'The basket names no fruit.' };
}

const stateProps: Record<(typeof states)[number], Partial<JsonEditorProps>> = {
  resting: { defaultValue: basket },
  required: { defaultValue: '', isRequired: true },
  dirty: { committedValue: basket },
  invalid: { defaultValue: '{\n  "fruit": \n}' },
  warning: { defaultValue: '{\n  "count": 12\n}' },
  pending: { defaultValue: basket, isPending: true },
  'read-only': { defaultValue: basket, isReadOnly: true },
  disabled: { defaultValue: basket, isDisabled: true },
};

interface SampleProps extends Omit<JsonEditorProps, 'label'> {
  label?: string;
  /** Controls the value from this starting value, so an editor can start dirty. */
  start?: string;
}

function Sample({ label = 'Basket', start, ...props }: SampleProps) {
  const [value, setValue] = useState(start);
  const controlled = start === undefined ? {} : { value, onChange: setValue };
  return <JsonEditor label={label} size="sm" validate={checkBasket} {...props} {...controlled} />;
}

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

/** The committed text is the caller's: it stays dirty until a commit (blur or Format) saves it. */
function SavedEditor() {
  const [committed, setCommitted] = useState('{"fruit":"Pear","sizes":[1,2,3]}');
  const [last, setLast] = useState('none');
  return (
    <>
      <JsonEditor
        label="Order"
        description="Edit, format, restore, or undo with Ctrl+Z."
        committedValue={committed}
        onCommit={setCommitted}
        defaultValue='{"fruit":"Apple"}'
        emptyValue="{}"
        indent={4}
        menu={['clear', 'set-default', 'help']}
        help="Orders are JSON objects."
        onMenuAction={(key: Key) => setLast(String(key))}
        data-lab-editor="saved"
      />
      <Output name="Committed">{committed}</Output>
      <Output name="Menu">{last}</Output>
    </>
  );
}

const longJson = JSON.stringify(
  Array.from({ length: 30 }, (_, index) => ({ row: index + 1, fruit: index % 2 ? 'Pear' : 'Fig' })),
  null,
  2,
);

function LongText() {
  const [key, setKey] = useState(0);
  return (
    <>
      <Sample key={key} label="Rows" defaultValue={longJson} size="lg" data-lab-editor="long" />
      <Button onPress={() => setKey(key + 1)}>Reset</Button>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and states"
      description="Every label layout against every field state, including a parse error and a warning from the caller's check."
    >
      <StateMatrix
        axes={{ state: states, layout: layouts }}
        render={({ state, layout }) => (
          <Sample
            labelLayout={layout as FieldLabelLayout}
            start={state === 'dirty' ? '{\n  "fruit": "Pear"\n}' : undefined}
            {...stateProps[state]}
          />
        )}
      />
    </LabSection>
    <LabSection title="Sizes" description="The starting height of each size.">
      <StateMatrix
        axes={{ size: sizes }}
        render={({ size }) => <Sample size={size as CodeEditorSize} defaultValue={basket} />}
      />
    </LabSection>
    <LabSection
      title="Format, restore and menu"
      description="Format rewrites the text with four spaces per level and commits it; the field menu clears or sets the default."
    >
      <SavedEditor />
    </LabSection>
    <LabSection
      title="Long text"
      description="Thirty rows without line wrapping: scroll and the line numbers follow."
    >
      <LongText />
    </LabSection>
  </>,
);
