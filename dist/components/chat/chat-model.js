// Pure helpers of the chat widget: who wrote what, what a message says, and who read it.
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
import { isAwaitingReader } from '../chat-controller/chat-controller.js';
export function indexParticipants(participants) {
    return new Map(participants.map((participant) => [participant.id, participant]));
}
/** Whether an assistant takes part, which makes the conversation an assistant chat. */
export function hasAssistant(participants) {
    return participants.some((participant) => participant.kind === 'assistant');
}
/**
 * A participant as a message's author: their identity and presence, without the participant's own
 * `kind`. An assistant gets a rounded avatar unless it names its own shape.
 */
export function toMessageAuthor(participant) {
    const { id: _id, kind, ...identity } = participant;
    return kind === 'assistant' ? { ...identity, shape: identity.shape ?? 'rounded' } : identity;
}
/** Who a message is from, relative to the reader. */
export function toMessageOrigin(message, currentUserId) {
    if (!message.authorId)
        return 'system';
    return message.authorId === currentUserId ? 'sent' : 'received';
}
/**
 * The status a message shows: a reply waiting for the reader's answer is not busy, so assistive
 * technology does not hide the card that asks.
 */
export function toDisplayStatus(message) {
    const status = message.status ?? 'complete';
    return status === 'streaming' && message.parts.some(isAwaitingReader) ? 'complete' : status;
}
/** The text a message says: its text parts, then its code, one block each. */
export function readMessageText(message) {
    return message.parts
        .flatMap((part) => {
        if (part.type === 'text')
            return [part.text];
        return part.type === 'code' ? [part.code] : [];
    })
        .join('\n\n');
}
/** The longest excerpt of a quoted message, in characters. */
const excerptLength = 140;
/** The start of a text on one line, cut with an ellipsis when long, for a quote. */
export function toExcerpt(text) {
    const line = text.replace(/\s+/g, ' ').trim();
    return line.length > excerptLength ? `${line.slice(0, excerptLength - 1).trimEnd()}…` : line;
}
const triggers = { mention: '@', command: '/', reference: '' };
/**
 * Tokens as a message shows them: the composer names a pill by its bare label (`Ana Lopez`), while
 * a message's token label is the pill's text, trigger included (`@Ana Lopez`). A reference has no
 * trigger.
 */
export function toDisplayTokens(tokens) {
    return tokens.map((token) => {
        const trigger = triggers[token.kind];
        return token.label.startsWith(trigger) ? token : { ...token, label: trigger + token.label };
    });
}
/** Tokens as the composer edits them, by their bare labels. */
export function toComposerTokens(tokens) {
    return tokens.map((token) => {
        const trigger = triggers[token.kind];
        return trigger && token.label.startsWith(trigger)
            ? { ...token, label: token.label.slice(trigger.length) }
            : token;
    });
}
/** A message's first text part with its tokens, as the composer edits it. */
export function toMessageText(message) {
    const part = message.parts.find((entry) => entry.type === 'text');
    return { text: part?.text ?? '', tokens: toComposerTokens(part?.tokens ?? []) };
}
/** Whether the reader may edit or delete a message: their own, not deleted, with text. */
export function isOwnText(message, currentUserId) {
    return (message.authorId === currentUserId &&
        !message.isDeleted &&
        message.parts.some((part) => part.type === 'text'));
}
/** The reader's last message they may edit, if any. */
export function findLastOwnText(messages, currentUserId) {
    return messages.findLast((message) => isOwnText(message, currentUserId));
}
/**
 * The readers to show under each message: every participant but the reader whose read position is
 * that message, keyed by message id.
 */
export function listReaders(readPositions, participants, currentUserId) {
    const readers = new Map();
    for (const [participantId, messageId] of Object.entries(readPositions ?? {})) {
        const participant = participants.get(participantId);
        if (!participant || participantId === currentUserId)
            continue;
        const { kind: _kind, status: _status, statusLabel: _label, ...person } = participant;
        readers.set(messageId, [...(readers.get(messageId) ?? []), person]);
    }
    return readers;
}
/** The names of the participants typing, the reader left out. */
export function listTypingNames(typingIds, participants, currentUserId) {
    return (typingIds ?? []).flatMap((id) => {
        const participant = participants.get(id);
        return participant && id !== currentUserId ? [participant.name] : [];
    });
}
/**
 * What the assistant does in a reply that streams, if its thinking line shows: `thinking` while
 * the reply shows nothing yet or says what it does, and, depending on `until`, while its latest
 * part is not text; `writing` while text streams in, until the `end`.
 */
export function toThinkingActivity(message, until) {
    if (toDisplayStatus(message) !== 'streaming')
        return undefined;
    if (message.statusText || message.parts.length === 0)
        return 'thinking';
    if (until === 'content')
        return undefined;
    if (message.parts.at(-1)?.type !== 'text')
        return 'thinking';
    return until === 'end' ? 'writing' : undefined;
}
/** What the assistant is doing in the reply that streams, if it says. */
export function findStatusText(messages) {
    const last = messages.at(-1);
    return last?.status === 'streaming' && last.statusText ? last.statusText : undefined;
}
/** The ids of the messages whose text holds every term of `query`, oldest first. */
export function findMessageMatches(messages, query) {
    const terms = splitMatchTerms(query, { ignoreAccents: true });
    if (terms.length === 0)
        return [];
    return messages
        .filter((message) => !message.isDeleted &&
        textMatchesTerms(readMessageText(message), terms, { ignoreAccents: true }))
        .map((message) => message.id);
}
//# sourceMappingURL=chat-model.js.map