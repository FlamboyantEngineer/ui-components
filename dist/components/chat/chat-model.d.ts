import type { ChatStatusLineActivity } from '../chat-activity/chat-activity.js';
import type { ChatMessageData, ChatParticipant, ChatTextToken } from '../chat-parts/chat-parts.js';
import type { ChatMessageAuthor, ChatMessageOrigin, ChatMessageStatus, ChatReader } from '../chat-transcript/chat-transcript.js';
/** Participants by id. */
export type ChatParticipantIndex = ReadonlyMap<string, ChatParticipant>;
/** A message's text with its mentions and commands, as the composer edits it. */
export interface ChatMessageText {
    text: string;
    tokens: ChatTextToken[];
}
export declare function indexParticipants(participants: readonly ChatParticipant[]): ChatParticipantIndex;
/** Whether an assistant takes part, which makes the conversation an assistant chat. */
export declare function hasAssistant(participants: readonly ChatParticipant[]): boolean;
/**
 * A participant as a message's author: their identity and presence, without the participant's own
 * `kind`. An assistant gets a rounded avatar unless it names its own shape.
 */
export declare function toMessageAuthor(participant: ChatParticipant): ChatMessageAuthor;
/** Who a message is from, relative to the reader. */
export declare function toMessageOrigin(message: ChatMessageData, currentUserId: string): ChatMessageOrigin;
/**
 * The status a message shows: a reply waiting for the reader's answer is not busy, so assistive
 * technology does not hide the card that asks.
 */
export declare function toDisplayStatus(message: ChatMessageData): ChatMessageStatus;
/** The text a message says: its text parts, then its code, one block each. */
export declare function readMessageText(message: ChatMessageData): string;
/** The start of a text on one line, cut with an ellipsis when long, for a quote. */
export declare function toExcerpt(text: string): string;
/**
 * Tokens as a message shows them: the composer names a pill by its bare label (`Ana Lopez`), while
 * a message's token label is the pill's text, trigger included (`@Ana Lopez`). A reference has no
 * trigger.
 */
export declare function toDisplayTokens(tokens: readonly ChatTextToken[]): ChatTextToken[];
/** Tokens as the composer edits them, by their bare labels. */
export declare function toComposerTokens<T extends Pick<ChatTextToken, 'kind' | 'label'>>(tokens: readonly T[]): T[];
/** A message's first text part with its tokens, as the composer edits it. */
export declare function toMessageText(message: ChatMessageData): ChatMessageText;
/** Whether the reader may edit or delete a message: their own, not deleted, with text. */
export declare function isOwnText(message: ChatMessageData, currentUserId: string): boolean;
/** The reader's last message they may edit, if any. */
export declare function findLastOwnText(messages: readonly ChatMessageData[], currentUserId: string): ChatMessageData | undefined;
/**
 * The readers to show under each message: every participant but the reader whose read position is
 * that message, keyed by message id.
 */
export declare function listReaders(readPositions: Readonly<Record<string, string>> | undefined, participants: ChatParticipantIndex, currentUserId: string): ReadonlyMap<string, ChatReader[]>;
/** The names of the participants typing, the reader left out. */
export declare function listTypingNames(typingIds: readonly string[] | undefined, participants: ChatParticipantIndex, currentUserId: string): string[];
/**
 * Until what the thinking line of a reply that streams shows: its first `content`, its `text`, or
 * its `end`, writing alongside the text.
 */
export type ChatThinkingUntil = 'content' | 'text' | 'end';
/**
 * What the assistant does in a reply that streams, if its thinking line shows: `thinking` while
 * the reply shows nothing yet or says what it does, and, depending on `until`, while its latest
 * part is not text; `writing` while text streams in, until the `end`.
 */
export declare function toThinkingActivity(message: ChatMessageData, until: ChatThinkingUntil): ChatStatusLineActivity | undefined;
/** What the assistant is doing in the reply that streams, if it says. */
export declare function findStatusText(messages: readonly ChatMessageData[]): string | undefined;
/** The ids of the messages whose text holds every term of `query`, oldest first. */
export declare function findMessageMatches(messages: readonly ChatMessageData[], query: string): string[];
//# sourceMappingURL=chat-model.d.ts.map