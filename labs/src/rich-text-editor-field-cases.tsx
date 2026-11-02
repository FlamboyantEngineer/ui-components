// Rich Text Editor field cases: a warning, a pending field and a check that waits, then each label
// layout at each field size with the toolbar.

import type { FieldIssues, FieldLabelLayout } from '../../src/components/field/field.js';
import {
  FormatToolbar,
  RichTextEditor,
  type RichTextDocument,
  type RichTextNode,
} from '../../src/components/rich-text-editor/index.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { shortNote } from './rich-text-editor-cases.js';

/** The document's text, node by node. */
function readText(node: RichTextDocument | RichTextNode): string {
  if ('text' in node && typeof node.text === 'string') return node.text;
  return (node.content ?? []).map((child) => readText(child)).join(' ');
}

/** Warns, without blocking, about a note longer than a few words. */
function warnLong(value: RichTextDocument): FieldIssues {
  return readText(value).split(/\s+/).filter(Boolean).length > 4
    ? { severity: 'warning', message: 'Long notes may be cut on the label printer.' }
    : null;
}

/** A check that waits for a pretend server: a note must name a pear. */
function checkWithServer(value: RichTextDocument, signal: AbortSignal): Promise<FieldIssues> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(
        /pear/i.test(readText(value))
          ? null
          : { severity: 'error', message: 'The orchard has no record of this note: name a pear.' },
      );
    }, 900);
    signal.addEventListener('abort', () => clearTimeout(timer));
  });
}

const plumNote: RichTextDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pick the plums.' }] }],
};

const validationStates = ['warning', 'pending', 'async check'] as const;

function ValidationEditor({ state }: { state: (typeof validationStates)[number] }) {
  if (state === 'warning') {
    return <RichTextEditor label="Note" defaultValue={shortNote} validate={warnLong} />;
  }
  if (state === 'pending') {
    return (
      <RichTextEditor
        label="Note"
        description="The host is saving the note."
        defaultValue={shortNote}
        isPending
      />
    );
  }
  return (
    <RichTextEditor
      label="Note"
      description="Checked with the orchard after you stop typing; mention a pear to pass."
      defaultValue={plumNote}
      validateAsync={checkWithServer}
      validationDebounce={400}
    />
  );
}

const layouts: readonly FieldLabelLayout[] = [
  'label-control',
  'control-label',
  'label-colon-control',
  'control-only',
];
const sizes: readonly ControlSize[] = ['xs', 'sm', 'md', 'lg'];

export function RichTextFieldSections() {
  return (
    <>
      <LabSection
        title="Warning, pending and async check"
        description="A warning that does not block (the note is longer than four words), a field the host marks pending with isPending, and validateAsync, which shows the field pending while a pretend server checks the note and then its answer."
      >
        <StateMatrix
          axes={{ validation: validationStates }}
          render={({ validation }) => <ValidationEditor state={validation} />}
        />
      </LabSection>
      <LabSection
        title="Label layouts and sizes"
        description="Each label layout at each field size, with the toolbar, so the label, toolbar and document line up in every combination; control-only names the editor without drawing a label."
      >
        <StateMatrix
          axes={{ layout: layouts, size: sizes }}
          render={({ layout, size }) => (
            <RichTextEditor
              label="Note"
              labelLayout={layout}
              size={size}
              defaultValue={shortNote}
              toolbar={<FormatToolbar />}
            />
          )}
        />
      </LabSection>
    </>
  );
}
