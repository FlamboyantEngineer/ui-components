import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  StepListEditor,
  type StepListEditorColumn,
  type StepListEditorStep,
} from '../../src/components/step-list-editor/step-list-editor.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column: CSSProperties = { width: 760 };

const columns: StepListEditorColumn[] = [
  { id: 'action', label: 'Action', placeholder: 'What to do' },
  { id: 'data', label: 'Data', placeholder: 'Optional input' },
  { id: 'expected', label: 'Expected result', placeholder: 'What should happen' },
];

const signIn: StepListEditorStep[] = [
  { id: 'open', values: { action: 'Open the sign-in page', expected: 'The sign-in form shows' } },
  {
    id: 'name',
    values: { action: 'Enter a user name', data: 'ada.lovelace', expected: 'The name is accepted' },
  },
  {
    id: 'password',
    values: { action: 'Enter the password', data: 'correct horse', expected: 'The text is masked' },
  },
  { id: 'submit', values: { action: 'Press Sign in', expected: 'The home page opens' } },
];

const edited: StepListEditorStep[] = [
  requireDefined(signIn[0]),
  { id: 'name', values: { ...requireDefined(signIn[1]).values, data: 'grace.hopper' } },
  { id: 'remember', values: { action: 'Tick Remember me' } },
  requireDefined(signIn[3]),
];

const states = {
  empty: { value: [], committed: undefined, isReadOnly: false },
  filled: { value: signIn, committed: undefined, isReadOnly: false },
  dirty: { value: edited, committed: signIn, isReadOnly: false },
  'read-only': { value: signIn, committed: undefined, isReadOnly: true },
} as const;

function LiveEditor() {
  const [steps, setSteps] = useState<readonly StepListEditorStep[]>(signIn);
  const [saved, setSaved] = useState<readonly StepListEditorStep[]>(signIn);
  return (
    <div data-lab-demo="live" style={column}>
      <StepListEditor
        aria-label="Sign-in test steps"
        columns={columns}
        value={steps}
        committedValue={saved}
        onChange={setSteps}
      />
      <p>
        <Button size="sm" onPress={() => setSaved(steps)}>
          Save steps
        </Button>
      </p>
      <pre data-lab-value>{JSON.stringify(steps, null, 1)}</pre>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="No steps, steps, edits against the committed steps (a changed field, an added step and a removed one), and a read-only list."
    >
      <StateMatrix
        axes={{ state: Object.keys(states) as Array<keyof typeof states> }}
        render={({ state }) => (
          <div style={column}>
            <StepListEditor
              aria-label={`Steps, ${state}`}
              columns={columns}
              defaultValue={states[state].value}
              committedValue={states[state].committed}
              isReadOnly={states[state].isReadOnly}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Editing"
      description="Type in the fields; add, insert, duplicate, move and delete steps from their menus; drag a step by its handle or press Alt+ArrowUp and Alt+ArrowDown on its handle, number or menu (in a text field the keys move the caret). Focus follows the edited step until you act elsewhere. Saving makes the current steps the committed ones and clears the dirty marks."
    >
      <LiveEditor />
    </LabSection>
    <LabSection
      title="Two columns"
      description="Any caller columns under any ids: here a step is an instruction and a note, and the note column's id is constructor, a name every object inherits, so the whisk step's missing note reads as empty."
    >
      <div style={{ width: 560 }} data-lab-demo="two-columns">
        <StepListEditor
          aria-label="Recipe steps"
          columns={[
            { id: 'instruction', label: 'Instruction' },
            { id: 'constructor', label: 'Note' },
          ]}
          defaultValue={[
            { id: 'whisk', values: { instruction: 'Whisk the eggs and sugar' } },
            {
              id: 'fold',
              values: { instruction: 'Fold in the flour', constructor: 'Do not overmix' },
            },
            { id: 'bake', values: { instruction: 'Bake for 25 minutes', constructor: '180 °C' } },
          ]}
        />
      </div>
    </LabSection>
  </>,
);
