import { type ValueStore } from '../../utils/value-store.js';
import type { ChatMessageOrigin, ChatMessageStatus } from './chat-message.js';
/** What a message tells the transcript about itself, for announcements and scrolling. */
export interface TranscriptMessageEntry {
    /** The message's own id (its DOM id), when it differs from its child's key. */
    id: string | undefined;
    /** The author's display name; none for a system notice. */
    authorName: string | undefined;
    /** A plain-text summary to announce; defaults to the message's text. */
    summary: string | undefined;
    origin: ChatMessageOrigin;
    status: ChatMessageStatus;
}
/** What each message reads back from the transcript. */
export interface TranscriptView {
    /** The one message in the tab order. */
    tabStopKey: string | null;
    /** The message marked as highlighted. */
    highlightedKey: string | null;
    /** Each message's position among the messages, from 1. */
    positions: ReadonlyMap<string, number>;
    /** How many messages there are, or -1 while older ones may still load. */
    setSize: number;
}
/** Called when a message registers or changes what it tells the transcript. */
export type TranscriptEntryListener = (key: string, entry: TranscriptMessageEntry, previous: TranscriptMessageEntry | undefined) => void;
/** The messages a transcript holds, by key, and the view state they read. */
export interface TranscriptRegistry {
    readonly view: ValueStore<TranscriptView>;
    register(key: string, entry: TranscriptMessageEntry): void;
    unregister(key: string): void;
    entry(key: string): TranscriptMessageEntry | undefined;
    /** Whether the key has registered as a message since the transcript mounted. */
    hasRegistered(key: string): boolean;
    attach(key: string, element: HTMLElement | null): void;
    element(key: string): HTMLElement | null;
    /** The key of a message's element. */
    keyOf(element: Element): string | undefined;
    /** The child key of a message id: the same, unless the message registered its own id. */
    keyFor(id: string): string;
    /** The message id of a child key: the message's own id, else the key. */
    idFor(key: string): string;
    listen(listener: TranscriptEntryListener): () => void;
}
/** Creates the registry a transcript shares with its messages through context. */
export declare function createTranscriptRegistry(): TranscriptRegistry;
//# sourceMappingURL=transcript-registry.d.ts.map