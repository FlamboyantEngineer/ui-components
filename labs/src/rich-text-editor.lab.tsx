import type { FieldIssue } from '../../src/components/field/field.js';
import {
  FormatToolbar,
  type RichTextDocument,
  RichTextEditor,
  type RichTextEditorProps,
} from '../../src/components/rich-text-editor/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  BlockHandleChoices,
  ControlledEditor,
  CustomSchemaEditor,
  CustomTaskEditor,
  FormEditor,
  FullEditor,
  LockedChromeEditor,
  LongDocumentEditor,
  PreviewLabelsEditor,
  RequiredEditor,
  ShiftingEditor,
  shortNote,
  taskNote,
} from './rich-text-editor-cases.js';
import { RichTextFieldSections } from './rich-text-editor-field-cases.js';

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
  'read-only': { defaultValue: taskNote, isReadOnly: true },
  disabled: { defaultValue: taskNote, isDisabled: true },
};

/** A countdown numbered from 0, which a copy and paste keeps. */
const countdown: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'orderedList',
      attrs: { start: 0 },
      content: ['Preheat the oven', 'Slice the pears', 'Bake'].map((text) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      })),
    },
  ],
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
    <RichTextFieldSections />
    <LabSection
      title="Toolbar, selection toolbar, slash menu and block handle"
      description="Type a slash and a command label or keyword; equally good matches keep their menu order."
    >
      <FullEditor />
    </LabSection>
    <LabSection
      title="Block type labels"
      description={
        'FormatToolbar blockTypeLabels="preview" draws each block type in the select the way its block looks; the editor above keeps the plain labels with glyphs. Open the select: Heading 1 is largest, Code block is monospaced, and the button still names the current type in plain text.'
      }
    >
      <PreviewLabelsEditor />
    </LabSection>
    <LabSection
      title="Block handle controls"
      description="BlockHandle shows a grip and a block menu; grip={false} or menu={false} leaves one out. The gutter is only as wide as the chosen controls, and none is kept for neither control or without a BlockHandle child. The narrow editors scroll; hover a block or the margin beside it, or click into it, to see the handle. Alt+Shift+Up and Down still move blocks."
    >
      <BlockHandleChoices />
    </LabSection>
    <LabSection
      title="Floating toolbar on a moving editor"
      description="Lower moves the editor down and Narrow rewraps it, without an edit or a new selection: the floating toolbar stays over the selected word."
    >
      <ShiftingEditor />
    </LabSection>
    <LabSection
      title="Locking open chrome"
      description="Open a slash, insert or link menu, then make the note read-only. Its chrome closes and the document stays unchanged."
    >
      <LockedChromeEditor />
    </LabSection>
    <LabSection
      title="List numbered from 0"
      description="A numbered list keeps any whole start, 0 and negatives included. Copy the list and paste it below: the pasted list still starts at 0."
    >
      <RichTextEditor label="Steps" defaultValue={countdown} />
    </LabSection>
    <LabSection title="Custom schema">
      <CustomSchemaEditor />
    </LabSection>
    <LabSection
      title="Custom task renderer"
      description="This schema replaces task items with plain list items. Edit the text: the document and HTML output use the custom renderer, without a built-in checkbox."
    >
      <CustomTaskEditor />
    </LabSection>
    <LabSection title="Controlled value">
      <ControlledEditor />
    </LabSection>
    <LabSection
      title="Form"
      description="A named editor submits its document as JSON with the form, which JSON.parse turns back into the value. Reset puts the first note back. Applying a link with Enter or Apply stays in the link editor and submits nothing."
    >
      <FormEditor />
    </LabSection>
    <LabSection
      title="Required"
      description="A required editor in a form that validates at once. Press Enter, start an empty list or quote: the document stays empty and Send is blocked until it holds text or a divider."
    >
      <RequiredEditor />
    </LabSection>
    <LabSection
      title="Long document"
      description="A thousand paragraphs in an editor bounded to 360 pixels: it scrolls inside, under the overlay scrollbar. The host passes blockMarkers from its own check (blight is an error, frost a warning): the marked rows are tinted and underlined, read out with their message, and marked in the scroll track. Fix a row and its marker goes. Each change reports a document that keeps every block it left alone. Edit, press Restore, then Ctrl+Z: the one undo history brings the edit back."
    >
      <LongDocumentEditor />
    </LabSection>
  </>,
);
