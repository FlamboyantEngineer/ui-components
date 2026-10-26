import { type Ref, type RefObject } from 'react';
import type { MessageComposerMessage, MessageComposerToken } from '../composer-message.js';
import type { ComposerState } from '../use-composer-state.js';
import type { RichEditorHandle } from './rich-editor.js';
/**
 * What `insertToken` did: `inserted`, or why it changed nothing: the composer is `disabled`, is
 * `editing` another message, is `submitting` a message the host has not accepted yet, or its
 * editor is `unavailable` (not mounted).
 */
export type MessageComposerInsertResult = 'inserted' | 'disabled' | 'editing' | 'submitting' | 'unavailable';
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
/** Gives `handleRef` the composer's handle, which reads the composer's latest render. */
export declare function useComposerHandle(options: ComposerHandleOptions): void;
//# sourceMappingURL=use-composer-handle.d.ts.map