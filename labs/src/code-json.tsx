import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import type { CodeEditorSize } from '../../src/components/code-editor/code-editor.js';
import type { FieldIssue, FieldLabelLayout } from '../../src/components/field/field.js';
import {
  CodeEditor,
  type CodeEditorFieldProps,
  type JsonSchema,
} from '../../src/components/code-editor/code-editor.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { fieldLayouts, fieldStates, type FieldStateName } from './field-states.js';

const sizes = ['sm', 'md', 'lg'] as const;

const basket = '{\n  "fruit": "Apple",\n  "count": 12\n}';

/** Warns about a basket without fruit. */
function checkBasket(value: string): FieldIssue | null {
  return value.includes('"fruit"') || value.trim() === ''
    ? null
    : { severity: 'warning', message: 'The basket names no fruit.' };
}

const stateProps: Record<FieldStateName, Partial<CodeEditorFieldProps>> = {
  resting: { defaultValue: basket },
  required: { defaultValue: '', isRequired: true, placeholder: '{ "fruit": "…" }' },
  dirty: { committedValue: basket },
  invalid: { defaultValue: '{\n  "fruit": \n}' },
  warning: { defaultValue: '{\n  "count": 12\n}' },
  pending: { defaultValue: basket, isPending: true },
  'read-only': { defaultValue: basket, isReadOnly: true },
  disabled: { defaultValue: basket, isDisabled: true },
};

interface SampleProps extends Omit<CodeEditorFieldProps, 'label'> {
  label?: string;
  /** Controls the value from this starting value, so an editor can start dirty. */
  start?: string;
}

function Sample({ label = 'Basket', start, ...props }: SampleProps) {
  const [value, setValue] = useState(start);
  const controlled = start === undefined ? {} : { value, onChange: setValue };
  return (
    <CodeEditor
      language="json"
      label={label}
      size="sm"
      validate={checkBasket}
      {...props}
      {...controlled}
    />
  );
}

/**
 * The committed text is the caller's: it stays dirty until a commit (leaving the field or Format)
 * saves it.
 */
function SavedEditor() {
  const [committed, setCommitted] = useState(
    '{"fruit":"Pear","id":9007199254740993,"sizes":[1,2,3]}',
  );
  const [last, setLast] = useState('none');
  return (
    <>
      <CodeEditor
        language="json"
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
      <LabOutput name="Committed">{committed}</LabOutput>
      <LabOutput name="Menu">{last}</LabOutput>
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
    <CodeEditor
      language="json"
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

function LiteralSchemaEditor() {
  return (
    <CodeEditor
      language="json"
      label="Schema values"
      description="Object key order does not affect constants. Complete nullable or constant, and try unknown keys such as toString. Literal snippet characters stay in JSON strings."
      defaultValue={'{"payload":{"second":"${field}","first":1},"constructor":1}'}
      schema={{
        type: 'object',
        additionalProperties: false,
        properties: {
          payload: { const: { first: 1, second: '${field}' } },
          nullable: { enum: [null], default: 'other' },
          constant: { const: 'fixed' },
          constructor: { type: 'integer' as const },
          'a"b': { type: 'string', description: 'A quoted property name.' },
        },
      }}
      data-lab-editor="literal-schema"
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

/** A host toolbar that keeps its count as the editor locks and switches language. */
function LockableEditor() {
  const [isReadOnly, setReadOnly] = useState(false);
  const [isJson, setJson] = useState(true);
  const [count, setCount] = useState(0);
  return (
    <div data-lab-editor="lockable">
      <CodeEditor
        language={isJson ? 'json' : 'text'}
        label="Notes"
        size="sm"
        isReadOnly={isReadOnly}
        defaultValue={'{"fruit":"Apple"}'}
        toolbar={
          <>
            <strong>Notes</strong>
            <Button size="xs" variant="ghost" onPress={() => setCount(count + 1)}>
              {`Count ${count}`}
            </Button>
          </>
        }
      />
      <label>
        <input
          type="checkbox"
          checked={isReadOnly}
          onChange={(event) => setReadOnly(event.target.checked)}
        />{' '}
        Lock
      </label>{' '}
      <label>
        <input
          type="checkbox"
          checked={isJson}
          onChange={(event) => setJson(event.target.checked)}
        />{' '}
        JSON
      </label>
    </div>
  );
}

export const jsonExamples = (
  <div data-lab-family="json">
    <LabSection
      title="JSON: Layouts and states"
      description="Every label layout against every field state, including a parse error and a warning from the caller's check."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
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
      title="JSON: Sizes and line numbers"
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
      title="JSON: Format, restore and menu"
      description="Format rewrites the text with four spaces per level, keeping every number as written (the id is past what a JavaScript number holds), and commits it; the field menu clears or sets the default."
    >
      <SavedEditor />
    </LabSection>
    <LabSection
      title="JSON: Locking and switching language"
      description="Lock makes the editor read-only and JSON switches its language; Format comes and goes while the host's Count button keeps its element and focus."
    >
      <LockableEditor />
    </LabSection>
    <LabSection
      title="JSON: Schema"
      description="Problems are underlined where they are and the first one is the field's message; rest the pointer on a key for its description, or press F8. Brackets and quotes pair up."
    >
      <RecipeEditor />
    </LabSection>
    <LabSection title="JSON: Schema values and literal strings">
      <LiteralSchemaEditor />
    </LabSection>
    <LabSection
      title="JSON: Long text"
      description="Thirty rows without line wrapping: scroll and the line numbers follow."
    >
      <LongText />
    </LabSection>
  </div>
);
