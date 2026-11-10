import { EditorState, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useState } from 'react';
import {
  createRichTextSchema,
  getRichTextKit,
  type RichTextEngineCommit,
  RichTextEngineContent,
  RichTextEngineHost,
} from '../../src/components/rich-text-editor/index.js';

const LIMIT = 40;

const kit = getRichTextKit(createRichTextSchema());

const firstState = EditorState.create({
  doc: kit.schema.node('doc', null, [
    kit.schema.node('paragraph', null, [kit.schema.text('Pears ripen off the tree.')]),
  ]),
  plugins: kit.buildPlugins(undefined),
});

/** Commits a transaction only while the document stays within the limit. */
function keepWithinLimit(tr: Transaction, _view: EditorView, commit: RichTextEngineCommit) {
  if (tr.doc.textContent.length <= LIMIT) commit.applyDefault();
}

/**
 * The engine every editor shares, with chrome of the caller's own: a dispatch body that drops any
 * edit past 40 characters, and a count of the edits it committed.
 */
export function EngineHostEditor() {
  const [state, setState] = useState(firstState);
  const [edits, setEdits] = useState(0);
  return (
    <>
      <RichTextEngineHost
        state={state}
        onStateChange={setState}
        dispatchTransaction={keepWithinLimit}
        onUpdated={(view, previous) => {
          if (!view.state.doc.eq(previous.doc)) setEdits((count) => count + 1);
        }}
      >
        <RichTextEngineContent role="textbox" aria-label="Short note" data-lab-engine="limit" />
      </RichTextEngineHost>
      <p>
        Characters: <output data-lab-output="engine-length">{state.doc.textContent.length}</output>{' '}
        of {LIMIT}. Edits: <output data-lab-output="engine-edits">{edits}</output>
      </p>
    </>
  );
}
