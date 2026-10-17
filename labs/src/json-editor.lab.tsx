import { useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import type { CodeEditorSize } from '../../src/components/code-editor/code-editor.js';
import type { FieldIssue, FieldLabelLayout } from '../../src/components/field/field.js';
import {
  JsonEditor,
  type JsonEditorProps,
  type JsonSchema,
} from '../../src/components/json-editor/json-editor.js';
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
  required: { defaultValue: '', isRequired: true, placeholder: '{ "fruit": "…" }' },
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

const recipeSchema: JsonSchema = {
  type: 'object',
  required: ['name', 'servings'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 3, description: 'What the dish is called.' },
    servings: { type: 'integer', minimum: 1, maximum: 8, description: 'How many people it feeds.' },
    course: {
      enum: ['starter', 'main', 'dessert'],
      description: 'When the dish is served.',
    },
    vegetarian: { type: 'boolean', description: 'Whether the dish has no meat or fish.' },
    tags: { type: 'array', maxItems: 3, items: { type: 'string' } },
  },
};

const recipe = '{\n  "name": "Soup",\n  "servings": 12,\n  "course": "brunch"\n}';

/** A recipe checked against a schema, with completions and hover documentation from it. */
function RecipeEditor() {
  const [value, setValue] = useState(recipe);
  return (
    <JsonEditor
      label="Recipe"
      description="Checked against a recipe schema. Type a quote for keys or a colon for values, or press Ctrl+Space."
      schema={recipeSchema}
      autoCloseBrackets
      value={value}
      onChange={setValue}
      data-lab-editor="recipe"
    />
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
    <LabSection
      title="Sizes and line numbers"
      description="The starting height of each size, with and without line numbers."
    >
      <StateMatrix
        axes={{ numbers: ['on', 'off'], size: sizes }}
        render={({ numbers, size }) => (
          <Sample
            size={size as CodeEditorSize}
            lineNumbers={numbers === 'on'}
            defaultValue={basket}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Format, restore and menu"
      description="Format rewrites the text with four spaces per level and commits it; the field menu clears or sets the default."
    >
      <SavedEditor />
    </LabSection>
    <LabSection
      title="Schema"
      description="Problems are underlined where they are and the first one is the field's message; rest the pointer on a key for its description, or press F8. Brackets and quotes pair up."
    >
      <RecipeEditor />
    </LabSection>
    <LabSection
      title="Long text"
      description="Thirty rows without line wrapping: scroll and the line numbers follow."
    >
      <LongText />
    </LabSection>
  </>,
);
