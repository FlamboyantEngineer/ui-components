'use client';

// The rich composer's public handle: insertion, selection and range replacement from controls
// outside the composer (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.10 and 4.11).

import type { EditorState } from 'prosemirror-state';
import { type Ref, type RefObject, useImperativeHandle } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
import type { MessageComposerMessage, MessageComposerToken } from '../composer-message.js';
import type { ComposerState } from '../use-composer-state.js';
import {
  createTextSelection,
  isRangeWithin,
  type MessageComposerRange,
  readTextSelection,
  replaceMessageRange,
  toFragment,
} from './composer-edits.js';
import { serializeComposerDocument } from './composer-markdown.js';
import type { RichEditorHandle } from './rich-editor.js';

/**
 * Why the composer changed nothing: it is `disabled`, is `editing` another message, is
 * `submitting` a message the host has not accepted yet, or its editor is `unavailable` (not
 * mounted).
 */
export type MessageComposerRefusal = 'disabled' | 'editing' | 'submitting' | 'unavailable';

/** What `insertToken` did: `inserted`, or why it changed nothing. */
export type MessageComposerInsertResult = 'inserted' | MessageComposerRefusal;

/**
 * What a selection or range edit did: `applied`, or why it changed nothing, including `invalid` for
 * a range outside the message's text.
 */
export type MessageComposerEditResult = 'applied' | MessageComposerRefusal | 'invalid';

/** What replaces a range: plain text, or a fragment of a message with its own tokens. */
export type MessageComposerContent = string | MessageComposerMessage;

/** What a host's own controls call on a rich composer, through `handleRef`. */
export interface MessageComposerHandle {
  /**
   * Adds a pill to the draft at the caret, or where the caret was when the text box lost focus,
   * else at the end, keeping the rest of the draft; then focuses the text box.
   */
  insertToken: (token: Omit<MessageComposerToken, 'start' | 'end'>) => MessageComposerInsertResult;
  /** The draft as it is now, also while another message is being edited. */
  getDraft: () => MessageComposerMessage;
  /** What the text box shows now: the message being edited, or else the draft. */
  getValue: () => MessageComposerMessage;
  /**
   * The selection, or the caret as a collapsed range, in the shown message's text; kept while
   * focus is elsewhere. `null` while the editor is not mounted.
   */
  getSelection: () => MessageComposerRange | null;
  /**
   * Selects a range of the shown message's text without taking focus; an end inside a token moves
   * to the token's edge.
   */
  setSelection: (range: MessageComposerRange) => MessageComposerEditResult;
  /**
   * Replaces a range of the draft's text with text or a fragment, as one undo step; a token the
   * range cuts is replaced whole. The caret ends after the new content and the text box takes focus.
   */
  replaceRange: (
    range: MessageComposerRange,
    content: MessageComposerContent,
  ) => MessageComposerEditResult;
  /** Replaces the selection, or where it was when the text box lost focus, as `replaceRange` does. */
  replaceSelection: (content: MessageComposerContent) => MessageComposerEditResult;
  /** Moves focus to the text box, keeping its selection. */
  focus: () => void;
}

interface ComposerHandleOptions {
  handleRef: Ref<MessageComposerHandle> | undefined;
  editorRef: RefObject<RichEditorHandle | null>;
  state: ComposerState<MessageComposerMessage>;
  isDisabled: boolean;
}

function findRefusal(
  { state, isDisabled }: Pick<ComposerHandleOptions, 'state' | 'isDisabled'>,
  editor: RichEditorHandle | null,
): MessageComposerRefusal | null {
  if (isDisabled) return 'disabled';
  if (state.isEditing) return 'editing';
  if (state.isSubmitting) return 'submitting';
  return editor ? null : 'unavailable';
}

/** The length of the shown message's text, as the editor holds it now. */
function readShownLength(state: EditorState): number {
  return serializeComposerDocument(state.doc).text.length;
}

/** Replaces a range of the shown message, unless the composer refuses or the range is outside it. */
function replace(
  options: ComposerHandleOptions,
  range: MessageComposerRange | null,
  content: MessageComposerContent,
): MessageComposerEditResult {
  const editor = options.editorRef.current;
  const refusal = findRefusal(options, editor);
  if (refusal || !editor) return refusal ?? 'unavailable';
  const applied = editor.withView((view) => {
    const target = range ?? readTextSelection(view.state);
    if (!isRangeWithin(target, readShownLength(view.state))) return false;
    view.dispatch(
      replaceMessageRange(view.state, { range: target, fragment: toFragment(content) }),
    );
    view.focus();
    return true;
  });
  return applied ? 'applied' : 'invalid';
}

/** Gives `handleRef` the composer's handle, which reads the composer's latest render. */
export function useComposerHandle(options: ComposerHandleOptions): void {
  const { handleRef, editorRef } = options;
  const latest = useLatest(options);
  useImperativeHandle(
    handleRef,
    () => ({
      insertToken: (token) => {
        const editor = editorRef.current;
        const refusal = findRefusal(latest.current, editor);
        if (refusal || !editor) return refusal ?? 'unavailable';
        editor.addPill(token);
        editor.focus();
        return 'inserted';
      },
      getDraft: () => latest.current.state.draft,
      getValue: () => latest.current.state.value,
      getSelection: () =>
        editorRef.current?.withView((view) => readTextSelection(view.state)) ?? null,
      setSelection: (range) => {
        const editor = editorRef.current;
        if (!editor) return 'unavailable';
        return editor.withView((view) => {
          if (!isRangeWithin(range, readShownLength(view.state))) return 'invalid';
          view.dispatch(view.state.tr.setSelection(createTextSelection(view.state, range)));
          return 'applied';
        });
      },
      replaceRange: (range, content) => replace(latest.current, range, content),
      replaceSelection: (content) => replace(latest.current, null, content),
      focus: () => editorRef.current?.focus(),
    }),
    [latest, editorRef],
  );
}
