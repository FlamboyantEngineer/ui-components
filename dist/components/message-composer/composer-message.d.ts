import type { PersistCodec } from '../../core/provider.js';
/** What a pill in the message stands for: a person, a command, or a record the host names. */
export type MessageComposerTokenKind = 'mention' | 'command' | 'reference';
/** A mention, command or record reference in the message's text, by its range. */
export interface MessageComposerToken {
    /** Where the pill's text starts in `text`. */
    start: number;
    /** Where it ends in `text`, exclusive. */
    end: number;
    kind: MessageComposerTokenKind;
    /** The mentioned person's, the command's or the referenced record's id. */
    id: string;
    /** The person's or the command's label, without the trigger character, or the reference's text. */
    label: string;
    /** A reference's record kind or scope, as the host names it. */
    recordType?: string | undefined;
}
/** A composed message: Markdown text, and the pills in it as token ranges. */
export interface MessageComposerMessage {
    text: string;
    tokens: MessageComposerToken[];
}
/** The character that opens a token's completions and starts its text; a reference has none. */
export declare const tokenTriggers: Readonly<Record<MessageComposerTokenKind, string>>;
export declare const emptyMessage: MessageComposerMessage;
/** Whether two messages hold the same text and tokens. */
export declare function isSameMessage(a: MessageComposerMessage, b: MessageComposerMessage): boolean;
/**
 * Stores a draft as the message's JSON, whichever composer holds it, so plain and rich composers
 * read each other's drafts; anything else in storage reads as a parse failure.
 */
export declare function createMessageCodec<T>(toMessage: (value: T) => MessageComposerMessage, fromMessage: (message: MessageComposerMessage) => T): PersistCodec<T>;
//# sourceMappingURL=composer-message.d.ts.map