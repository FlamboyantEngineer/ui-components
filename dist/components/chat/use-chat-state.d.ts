import { type RefCallback, type RefObject } from 'react';
/** What the composer edits instead of a new message: one of the reader's messages, or a queued one. */
export interface ChatEditing {
    kind: 'message' | 'queued';
    id: string;
}
/** The chat's own state about one conversation. */
interface ChatOwnState {
    conversationId: string | undefined;
    editing: ChatEditing | null;
    replyingId: string | null;
    /** The message a quote jumped to. */
    jumpedId: string | undefined;
    /** The reader's open and closed choices of each message's parts, by message id. */
    expanded: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
}
/** The chat's state and the stable commands that change it. */
export interface ChatState extends Omit<ChatOwnState, 'conversationId'> {
    /** The composer's text box, kept while the composer is mounted. */
    composerRef: RefObject<HTMLDivElement | null>;
    /** The composer's ref, which records its text box. */
    setComposer: RefCallback<HTMLDivElement>;
    startEdit: (editing: ChatEditing) => void;
    cancelEdit: () => void;
    startReply: (messageId: string) => void;
    cancelReply: () => void;
    /** Ends the reply to a message once its sending is accepted, if the chat still shows that conversation and reply. */
    endReply: (conversationId: string | undefined, messageId: string) => void;
    /** Ends an edit once its sending is accepted, if the chat still shows that conversation and edit. */
    endEdit: (conversationId: string | undefined, editing: ChatEditing) => void;
    jumpTo: (messageId: string) => void;
    setExpandedParts: (messageId: string, expanded: Record<string, boolean>) => void;
    focusComposer: () => void;
}
/**
 * The editing, replying, quote jump and expansion state of a chat, which starts over when the
 * conversation changes. The commands keep their identities, so the messages need not re-render.
 */
export declare function useChatState(conversationId: string | undefined): ChatState;
export {};
//# sourceMappingURL=use-chat-state.d.ts.map