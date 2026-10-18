import type { FieldIssue } from '../../src/components/field/field.js';
import {
  FormatToolbar,
  RichTextEditor,
  type RichTextEditorProps,
} from '../../src/components/rich-text-editor/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  ControlledEditor,
  CustomSchemaEditor,
  FullEditor,
  shortNote,
} from './rich-text-editor-cases.js';

const states = ['resting', 'empty', 'required', 'invalid', 'read-only', 'disabled'] as const;
const chromes = ['plain', 'toolbar'] as const;

/** Flags a note that mentions no fruit. */
function checkFruit(): FieldIssue {
  return { severity: 'error', message: 'Name at least one fruit.' };
}

const stateProps: Record<(typeof states)[number], Partial<RichTextEditorProps>> = {
  resting: { defaultValue: shortNote },
  empty: { placeholder: 'Write a note…' },
  required: { isRequired: true, placeholder: 'Required' },
  invalid: { defaultValue: shortNote, validate: checkFruit },
  'read-only': { defaultValue: shortNote, isReadOnly: true },
  disabled: { defaultValue: shortNote, isDisabled: true },
};

mountLab(
  <>
    <LabSection title="States">
      <StateMatrix
        axes={{ state: states, chrome: chromes }}
        render={({ state, chrome }) => (
          <RichTextEditor
            label="Note"
            description={state === 'resting' ? 'Plain formatted text.' : undefined}
            toolbar={chrome === 'toolbar' ? <FormatToolbar /> : undefined}
            {...stateProps[state]}
          />
        )}
      />
    </LabSection>
    <LabSection title="Toolbar, selection toolbar, slash menu and block handle">
      <FullEditor />
    </LabSection>
    <LabSection title="Custom schema">
      <CustomSchemaEditor />
    </LabSection>
    <LabSection title="Controlled value">
      <ControlledEditor />
    </LabSection>
  </>,
);
