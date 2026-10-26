import { type Ref, type RefObject } from 'react';
import type { ChatTextToken } from '../chat-parts/chat-parts.js';
import type { MessageComposerHandle } from '../message-composer/rich/rich-message-composer.js';
/**
 * What `insertToken` did: `inserted`, or why it changed nothing: the chat now shows an
 * `other-conversation` than the one asked for or the handle was made for, the composer is
 * `disabled`, is `editing` a message, is `submitting` a message the host has not accepted yet, or
 * is `unavailable` (a chat without `onSend` has no composer).
 */
export type ChatComposerInsertResult = 'inserted' | 'other-conversation' | 'disabled' | 'editing' | 'submitting' | 'unavailable';
/** A conversation's draft: its text and tokens, as `onSend` would receive them. */
export interface ChatDraft {
    conversationId: string | undefined;
    text: string;
    tokens: ChatTextToken[];
}
/** Where `insertToken` may insert. */
export interface ChatComposerInsertOptions {
    /** Inserts only while the chat shows this conversation. */
    conversationId?: string | undefined;
}
/** What a host's own controls call on a chat's composer, through `composerHandleRef`. */
export interface ChatComposerHandle {
    /**
     * Adds a token to the conversation's draft as a pill at the caret, or where the caret was when
     * the composer lost focus, else at the end, keeping the rest of the draft and the reply's quote;
     * then focuses the composer. A handle serves the conversation it was made for.
     */
    insertToken: (token: Omit<ChatTextToken, 'start' | 'end'>, options?: ChatComposerInsertOptions) => ChatComposerInsertResult;
    /** The shown conversation's draft as it is now. */
    getDraft: () => ChatDraft;
}
/** The chat props for the host's own controls outside the chat. */
export interface ChatDraftOptions {
    /** Receives `insertToken` and `getDraft`, for the host's own controls outside the chat. */
    composerHandleRef?: Ref<ChatComposerHandle> | undefined;
    /** Called with the conversation's draft when it loads and after each edit, as when a pill is added or removed. */
    onDraftChange?: ((draft: ChatDraft) => void) | undefined;
}
export interface ChatComposerHandleOptions {
    handleRef: Ref<ChatComposerHandle> | undefined;
    composerRef: RefObject<MessageComposerHandle | null>;
    conversationId: string | undefined;
    onDraftChange: ((draft: ChatDraft) => void) | undefined;
    focusComposer: () => void;
}
/**
 * Gives `handleRef` a handle bound to the shown conversation, and reports the draft to
 * `onDraftChange` when it loads (on mount and on each change of conversation); the composer's
 * edits report through the returned function.
 */
export declare function useChatComposerHandle(options: ChatComposerHandleOptions): (draft: {
    text: string;
    tokens: readonly ChatTextToken[];
}) => void | undefined;
//# sourceMappingURL=chat-composer-handle.d.ts.map