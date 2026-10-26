import { type RefCallback } from 'react';
import type { ChatMessageOrigin, ChatMessageStatus } from './chat-message.js';
import type { TranscriptRegistry } from './transcript-registry.js';
/** What a message registers with the transcript it sits in. */
export interface TranscriptMessageRegistration {
    /** The message's id, also its DOM id; the transcript otherwise knows it by its child's key. */
    id?: string | undefined;
    /** The author's display name, announced as "New message from …"; none for a notice. */
    authorName?: string | undefined;
    /** A plain-text summary to announce; defaults to the text of the message's content. */
    summary?: string | undefined;
    origin: ChatMessageOrigin;
    status: ChatMessageStatus;
}
/** Props a message spreads on its `<article>` so the transcript can find, focus and mark it. */
export interface TranscriptMessageProps {
    ref?: RefCallback<HTMLElement> | undefined;
    tabIndex?: number | undefined;
    'aria-posinset'?: number | undefined;
    'aria-setsize'?: number | undefined;
    'data-highlighted'?: 'true' | undefined;
}
/** The transcript's registry, for the messages inside it. */
export declare const TranscriptContext: import("react").Context<TranscriptRegistry | null>;
/** The key of the transcript child a message renders inside. */
export declare const TranscriptItemContext: import("react").Context<string | null>;
/**
 * Registers a message with the transcript it renders in and returns the props for its
 * `<article>`: its place in the transcript's single tab stop, its position in the feed and the
 * highlight. Outside a transcript it returns no props.
 */
export declare function useTranscriptMessage({ id, authorName, summary, origin, status, }: TranscriptMessageRegistration): TranscriptMessageProps;
//# sourceMappingURL=transcript-context.d.ts.map