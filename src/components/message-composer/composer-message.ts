// The message a composer holds: Markdown text and the mentions, commands and record references
// placed in it.

import type { PersistCodec } from '../../core/provider.js';
import { createJsonCodec } from '../../utils/json-codec.js';

/**
 * What a pill in the message stands for: a person, a command, a record the host names, or an
 * entry of one of the host's own trigger vocabularies (`trigger`).
 */
export type MessageComposerTokenKind = 'mention' | 'command' | 'reference' | 'trigger';

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
  /** The `id` of the host trigger whose vocabulary a `trigger` token came from. */
  trigger?: string | undefined;
}

/** A composed message: Markdown text, and the pills in it as token ranges. */
export interface MessageComposerMessage {
  text: string;
  tokens: MessageComposerToken[];
}

/**
 * The character that opens a built-in token's completions and starts its text; a reference has
 * none, and a host trigger's token keeps the text it was inserted with.
 */
export const tokenTriggers: Readonly<Record<MessageComposerTokenKind, string>> = {
  mention: '@',
  command: '/',
  reference: '',
  trigger: '',
};

const tokenKinds: ReadonlySet<unknown> = new Set(Object.keys(tokenTriggers));

export const emptyMessage: MessageComposerMessage = { text: '', tokens: [] };

function isToken(value: unknown): value is MessageComposerToken {
  const token = value as Partial<MessageComposerToken> | null;
  return (
    typeof token?.start === 'number' &&
    typeof token.end === 'number' &&
    tokenKinds.has(token.kind) &&
    typeof token.id === 'string' &&
    typeof token.label === 'string' &&
    (token.recordType === undefined || typeof token.recordType === 'string') &&
    (token.trigger === undefined || typeof token.trigger === 'string')
  );
}

/** Whether a value read back from storage is a message. */
function isMessage(value: unknown): value is MessageComposerMessage {
  const message = value as Partial<MessageComposerMessage> | null;
  return (
    typeof message?.text === 'string' &&
    Array.isArray(message.tokens) &&
    message.tokens.every(isToken)
  );
}

/** Whether two tokens are the same pill over the same range. */
function isSameToken(a: MessageComposerToken, b: MessageComposerToken): boolean {
  return (
    a.start === b.start &&
    a.end === b.end &&
    a.kind === b.kind &&
    a.id === b.id &&
    a.label === b.label &&
    a.recordType === b.recordType &&
    a.trigger === b.trigger
  );
}

/** Whether two messages hold the same text and tokens. */
export function isSameMessage(a: MessageComposerMessage, b: MessageComposerMessage): boolean {
  return (
    a.text === b.text &&
    a.tokens.length === b.tokens.length &&
    a.tokens.every((token, at) => {
      const other = b.tokens[at];
      return other !== undefined && isSameToken(token, other);
    })
  );
}

/**
 * Stores a draft as the message's JSON, whichever composer holds it, so plain and rich composers
 * read each other's drafts; anything else in storage reads as a parse failure.
 */
export function createMessageCodec<T>(
  toMessage: (value: T) => MessageComposerMessage,
  fromMessage: (message: MessageComposerMessage) => T,
): PersistCodec<T> {
  const codec = createJsonCodec((value): MessageComposerMessage => {
    if (!isMessage(value)) throw new Error('Not a stored message.');
    return value;
  });
  return {
    stringify: (value) => codec.stringify(toMessage(value)),
    parse: (raw) => fromMessage(codec.parse(raw)),
  };
}
