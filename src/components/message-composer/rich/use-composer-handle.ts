// The rich composer's public handle: insertion from controls outside the composer
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.10).

import { useImperativeHandle, type Ref, type RefObject } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
import type { MessageComposerMessage, MessageComposerToken } from '../composer-message.js';
import type { ComposerState } from '../use-composer-state.js';
import type { RichEditorHandle } from './rich-editor.js';

/**
 * What `insertToken` did: `inserted`, or why it changed nothing: the composer is `disabled`, is
 * `editing` another message, is `submitting` a message the host has not accepted yet, or its
 * editor is `unavailable` (not mounted).
 */
export type MessageComposerInsertResult =
  | 'inserted'
  | 'disabled'
  | 'editing'
  | 'submitting'
  | 'unavailable';

/** What a host's own controls call on a rich composer, through `handleRef`. */
export interface MessageComposerHandle {
  /**
   * Adds a pill to the draft at the caret, or where the caret was when the text box lost focus,
   * else at the end, keeping the rest of the draft; then focuses the text box.
   */
  insertToken: (token: Omit<MessageComposerToken, 'start' | 'end'>) => MessageComposerInsertResult;
  /** The draft as it is now, also while another message is being edited. */
  getDraft: () => MessageComposerMessage;
}

export interface ComposerHandleOptions {
  handleRef: Ref<MessageComposerHandle> | undefined;
  editorRef: RefObject<RichEditorHandle | null>;
  state: ComposerState<MessageComposerMessage>;
  isDisabled: boolean;
}

function findRefusal(
  { state, isDisabled }: Pick<ComposerHandleOptions, 'state' | 'isDisabled'>,
  editor: RichEditorHandle | null,
): Exclude<MessageComposerInsertResult, 'inserted'> | null {
  if (isDisabled) return 'disabled';
  if (state.isEditing) return 'editing';
  if (state.isSubmitting) return 'submitting';
  return editor ? null : 'unavailable';
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
    }),
    [latest, editorRef],
  );
}
