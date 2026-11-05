import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import type { MessageComposerMessage } from '../composer-message.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { createPendingPastePlugin, pasteThroughHost } from './composer-paste.js';

installEditorDom();

const views: EditorView[] = [];

afterEach(() => {
  for (const view of views.splice(0)) view.destroy();
});

/** An editor over an empty draft with the pending-paste plugin, and how many pastes it holds. */
function createEditor() {
  const plugin = createPendingPastePlugin();
  const state = EditorState.create({
    doc: parseComposerMessage({ text: '', tokens: [] }),
    plugins: [plugin],
  });
  const view = new EditorView(document.body.appendChild(document.createElement('div')), {
    state,
  });
  views.push(view);
  return { view, pending: () => plugin.getState(view.state)?.size ?? 0 };
}

/** Pastes `abc` with an answer that waits, then types `X` inside the pasted text. */
function pasteThenEdit() {
  const editor = createEditor();
  let settle: (fragment: MessageComposerMessage | null | undefined) => void = () => undefined;
  let fail: () => void = () => undefined;
  pasteThroughHost(editor.view, 'abc', {
    onPaste: () =>
      new Promise((resolve, reject) => {
        settle = resolve;
        fail = () => reject(new Error('lost'));
      }),
    isCurrent: () => true,
  });
  expect(editor.pending()).toBe(1);
  const { state } = editor.view;
  editor.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, 2)).insertText('X'));
  return {
    ...editor,
    settle: (value: MessageComposerMessage | null | undefined) => settle(value),
    fail: () => fail(),
  };
}

const text = (view: EditorView) => serializeComposerDocument(view.state.doc).text;

describe('Rich composer pending pastes', () => {
  it('UIC-MESSAGE-COMPOSER-4.12 lets go of a paste whose text the reader edited, however it settles', async () => {
    const outcomes: ((paste: ReturnType<typeof pasteThenEdit>) => void)[] = [
      (paste) => paste.settle({ text: 'replacement', tokens: [] }),
      (paste) => paste.settle(null),
      (paste) => paste.settle(undefined),
      (paste) => paste.fail(),
    ];
    for (const outcome of outcomes) {
      const paste = pasteThenEdit();
      const selection = paste.view.state.selection.toJSON();
      outcome(paste);
      await Promise.resolve();
      await Promise.resolve();
      expect(text(paste.view)).toBe('aXbc');
      expect(paste.view.state.selection.toJSON()).toEqual(selection);
      expect(paste.pending()).toBe(0);
    }
  });

  it('UIC-MESSAGE-COMPOSER-4.12 replaces an unedited paste with the answer and lets go of it', async () => {
    const editor = createEditor();
    pasteThroughHost(editor.view, 'abc', {
      onPaste: () => Promise.resolve({ text: 'done', tokens: [] }),
      isCurrent: () => true,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(text(editor.view)).toBe('done');
    expect(editor.pending()).toBe(0);
  });
});
