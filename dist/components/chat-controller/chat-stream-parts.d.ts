import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import type { ChatSource } from '../chat-sources/chat-sources.js';
/** What the reducer reads besides the event: the reader's settings and the clock. */
export interface ChatStreamContext {
    /** The tools the reader always allows: their approval requests are approved without asking. */
    alwaysAllowed?: readonly string[] | undefined;
    /** How long the reasoning part or tool call `id` has run, in milliseconds, for those the stream does not time. */
    getElapsed?: ((id: string) => number | undefined) | undefined;
}
/** How a reply ended: complete, stopped by the reader, or failed. */
export type ChatReplyOutcome = {
    status: 'complete';
} | {
    status: 'cancelled';
} | {
    status: 'error';
    error: string;
};
type PartOf<T extends ChatPart['type']> = Extract<ChatPart, {
    type: T;
}>;
/**
 * Completes the streaming text and reasoning parts, except those `keep` matches, so a new part
 * starts after them. Unchanged parts keep their identity.
 */
export declare function closeOpenParts(parts: readonly ChatPart[], context: ChatStreamContext, keep?: (part: ChatPart) => boolean): readonly ChatPart[];
/** Applies `update` to the part of `type` with `id`; other parts keep their identity. */
export declare function updatePart<T extends ChatPart['type']>(parts: readonly ChatPart[], target: {
    type: T;
    id: string;
}, update: (part: PartOf<T>) => PartOf<T>): readonly ChatPart[];
/**
 * Closes the open parts and adds `part` at the end, or, when a part of its type has its `id`,
 * merges it into that part in place, keeping that part's status and leaving the open parts open.
 */
export declare function addPart(parts: readonly ChatPart[], part: ChatPart, context: ChatStreamContext): readonly ChatPart[];
/** Adds a source to the reply's sources part, which starts where the first source arrives. */
export declare function appendSource(parts: readonly ChatPart[], source: ChatSource): readonly ChatPart[];
/** Adds a file to the files part just before it, or starts a files part. */
export declare function appendFile(parts: readonly ChatPart[], attachment: ChatAttachmentData): readonly ChatPart[];
/**
 * The reply once it ended: streaming parts complete, unfinished tool calls cancelled, its status
 * line cleared. A complete reply keeps the approvals and questions that wait for the reader; a
 * stopped or failed one cancels them.
 */
export declare function endChatReply(message: ChatMessageData, outcome: ChatReplyOutcome, context: ChatStreamContext): ChatMessageData;
export {};
//# sourceMappingURL=chat-stream-parts.d.ts.map