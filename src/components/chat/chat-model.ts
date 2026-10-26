// Pure helpers of the chat widget: who wrote what, what a message says, and who read it.

import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import { isAwaitingReader } from '../chat-controller/chat-controller.js';
import type { ChatMessageData, ChatParticipant, ChatTextToken } from '../chat-parts/chat-parts.js';
import type {
  ChatMessageAuthor,
  ChatMessageOrigin,
  ChatMessageStatus,
  ChatReader,
} from '../chat-transcript/chat-transcript.js';

/** Participants by id. */
export type ChatParticipantIndex = ReadonlyMap<string, ChatParticipant>;

/** A message's text with its mentions and commands, as the composer edits it. */
export interface ChatMessageText {
  text: string;
  tokens: ChatTextToken[];
}

export function indexParticipants(participants: readonly ChatParticipant[]): ChatParticipantIndex {
  return new Map(participants.map((participant) => [participant.id, participant]));
}

/** Whether an assistant takes part, which makes the conversation an assistant chat. */
export function hasAssistant(participants: readonly ChatParticipant[]): boolean {
  return participants.some((participant) => participant.kind === 'assistant');
}

/**
 * A participant as a message's author: their identity and presence, without the participant's own
 * `kind`. An assistant gets a rounded avatar unless it names its own shape.
 */
export function toMessageAuthor(participant: ChatParticipant): ChatMessageAuthor {
  const { id: _id, kind, ...identity } = participant;
  return kind === 'assistant' ? { ...identity, shape: identity.shape ?? 'rounded' } : identity;
}

/** Who a message is from, relative to the reader. */
export function toMessageOrigin(
  message: ChatMessageData,
  currentUserId: string,
): ChatMessageOrigin {
  if (!message.authorId) return 'system';
  return message.authorId === currentUserId ? 'sent' : 'received';
}

/**
 * The status a message shows: a reply waiting for the reader's answer is not busy, so assistive
 * technology does not hide the card that asks.
 */
export function toDisplayStatus(message: ChatMessageData): ChatMessageStatus {
  const status = message.status ?? 'complete';
  return status === 'streaming' && message.parts.some(isAwaitingReader) ? 'complete' : status;
}

/** The text a message says: its text parts, then its code, one block each. */
export function readMessageText(message: ChatMessageData): string {
  return message.parts
    .flatMap((part) => {
      if (part.type === 'text') return [part.text];
      return part.type === 'code' ? [part.code] : [];
    })
    .join('\n\n');
}

/** The longest excerpt of a quoted message, in characters. */
const excerptLength = 140;

/** The start of a text on one line, cut with an ellipsis when long, for a quote. */
export function toExcerpt(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > excerptLength ? `${line.slice(0, excerptLength - 1).trimEnd()}…` : line;
}

const triggers = { mention: '@', command: '/' } as const;

/**
 * Tokens as a message shows them: the composer names a pill by its bare label (`Ana Lopez`), while
 * a message's token label is the pill's text, trigger included (`@Ana Lopez`).
 */
export function toDisplayTokens(tokens: readonly ChatTextToken[]): ChatTextToken[] {
  return tokens.map((token) => {
    const trigger = triggers[token.kind];
    return token.label.startsWith(trigger) ? token : { ...token, label: trigger + token.label };
  });
}

/** Tokens as the composer edits them, by their bare labels. */
export function toComposerTokens(tokens: readonly ChatTextToken[]): ChatTextToken[] {
  return tokens.map((token) =>
    token.label.startsWith(triggers[token.kind])
      ? { ...token, label: token.label.slice(1) }
      : token,
  );
}

/** A message's first text part with its tokens, as the composer edits it. */
export function toMessageText(message: ChatMessageData): ChatMessageText {
  const part = message.parts.find((entry) => entry.type === 'text');
  return { text: part?.text ?? '', tokens: toComposerTokens(part?.tokens ?? []) };
}

/** Whether the reader may edit or delete a message: their own, not deleted, with text. */
export function isOwnText(message: ChatMessageData, currentUserId: string): boolean {
  return (
    message.authorId === currentUserId &&
    !message.isDeleted &&
    message.parts.some((part) => part.type === 'text')
  );
}

/** The reader's last message they may edit, if any. */
export function findLastOwnText(
  messages: readonly ChatMessageData[],
  currentUserId: string,
): ChatMessageData | undefined {
  return messages.findLast((message) => isOwnText(message, currentUserId));
}

/**
 * The readers to show under each message: every participant but the reader whose read position is
 * that message, keyed by message id.
 */
export function listReaders(
  readPositions: Readonly<Record<string, string>> | undefined,
  participants: ChatParticipantIndex,
  currentUserId: string,
): ReadonlyMap<string, ChatReader[]> {
  const readers = new Map<string, ChatReader[]>();
  for (const [participantId, messageId] of Object.entries(readPositions ?? {})) {
    const participant = participants.get(participantId);
    if (!participant || participantId === currentUserId) continue;
    const { kind: _kind, status: _status, statusLabel: _label, ...person } = participant;
    readers.set(messageId, [...(readers.get(messageId) ?? []), person]);
  }
  return readers;
}

/** The names of the participants typing, the reader left out. */
export function listTypingNames(
  typingIds: readonly string[] | undefined,
  participants: ChatParticipantIndex,
  currentUserId: string,
): string[] {
  return (typingIds ?? []).flatMap((id) => {
    const participant = participants.get(id);
    return participant && id !== currentUserId ? [participant.name] : [];
  });
}

/**
 * Whether a reply that streams is thinking or doing something rather than writing: it shows
 * nothing yet, its latest part is not text, or it says what it is doing.
 */
export function isThinking(message: ChatMessageData): boolean {
  if (toDisplayStatus(message) !== 'streaming') return false;
  return Boolean(message.statusText) || message.parts.at(-1)?.type !== 'text';
}

/** What the assistant is doing in the reply that streams, if it says. */
export function findStatusText(messages: readonly ChatMessageData[]): string | undefined {
  const last = messages.at(-1);
  return last?.status === 'streaming' && last.statusText ? last.statusText : undefined;
}

/** The ids of the messages whose text holds every term of `query`, oldest first. */
export function findMessageMatches(messages: readonly ChatMessageData[], query: string): string[] {
  const terms = splitMatchTerms(query, { ignoreAccents: true });
  if (terms.length === 0) return [];
  return messages
    .filter(
      (message) =>
        !message.isDeleted &&
        textMatchesTerms(readMessageText(message), terms, { ignoreAccents: true }),
    )
    .map((message) => message.id);
}
