import { type CSSProperties, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  ConstraintEditor,
  type ConstraintEditorKind,
  type ConstraintIssue,
  type ConstraintSet,
} from '../../src/components/constraint-editor/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ConstraintEditorCorners, ConstraintEditorSizes } from './constraint-editor-cases.js';
import { LabOutput } from './lab-output.js';

const column: CSSProperties = { width: 380 };

const colours = [
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
];

/** Neutral schema fields: a name, an exact quantity, a start date and a colour list. */
const samples: Readonly<Record<ConstraintEditorKind, { title: string; set: ConstraintSet }>> = {
  text: {
    title: 'Display name',
    set: { required: true, default: '', minLength: 0, maxLength: 40, pattern: '[\\p{L} ]+' },
  },
  number: {
    title: 'Quantity',
    set: { required: false, minimum: '0', maximum: '9007199254740993.5', default: '1' },
  },
  date: { title: 'Start date', set: { minimum: '2026-01-01', maximum: '2026-12-31' } },
  options: { title: 'Colours', set: { default: 'red', minCount: 1, maxCount: 2 } },
};

function SchemaDemo({ kind }: { kind: ConstraintEditorKind }) {
  const sample = samples[kind];
  const [set, setSet] = useState<ConstraintSet>(sample.set);
  const [issues, setIssues] = useState<readonly ConstraintIssue[]>([]);
  return (
    <div data-lab-demo={`schema-${kind}`} style={column}>
      <ConstraintEditor
        kind={kind}
        aria-label={`${sample.title} constraints`}
        value={set}
        options={colours}
        onChange={(next, found) => {
          setSet(next);
          setIssues(found);
        }}
      />
      <LabOutput name={`${kind} constraints`}>{JSON.stringify(set)}</LabOutput>
      <LabOutput name={`${kind} issues`}>{JSON.stringify(issues)}</LabOutput>
    </div>
  );
}

/** A server answer mapped back to the constraint it names, and a constraint inherited and locked. */
function ServerErrorDemo() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div data-lab-demo="server" style={column}>
      <ConstraintEditor
        kind="number"
        aria-label="Score constraints"
        defaultValue={{ minimum: '0', maximum: '100' }}
        lockedConstraints={['minimum']}
        errors={error ? { maximum: error } : undefined}
      />
      <Button onPress={() => setError(error ? null : 'The server allows at most 50 here.')}>
        {error ? 'Clear server error' : 'Save with a server error'}
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Each kind's controls while editable, read-only and disabled."
    >
      <StateMatrix
        axes={{
          kind: ['text', 'number', 'date', 'options'],
          state: ['editable', 'read-only', 'disabled'],
        }}
        render={({ kind, state }) => (
          <div style={column}>
            <ConstraintEditor
              kind={kind as ConstraintEditorKind}
              aria-label={`${kind} ${state}`}
              defaultValue={samples[kind as ConstraintEditorKind].set}
              options={colours}
              isReadOnly={state === 'read-only'}
              isDisabled={state === 'disabled'}
            />
          </div>
        )}
      />
    </LabSection>
    <ConstraintEditorSizes />
    <ConstraintEditorCorners />
    <LabSection
      title="Schema fields"
      description="Unset differs from false, 0 and an empty default. Bounds keep every digit. Try a maximum below the minimum: the problem shows and nothing is repaired."
    >
      <SchemaDemo kind="text" />
      <SchemaDemo kind="number" />
      <SchemaDemo kind="date" />
      <SchemaDemo kind="options" />
    </LabSection>
    <LabSection
      title="Server errors and locked constraints"
      description="The minimum is inherited, so it is locked. A server error lands on the constraint it names."
    >
      <ServerErrorDemo />
    </LabSection>
  </>,
);
