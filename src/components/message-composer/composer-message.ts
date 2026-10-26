// The message a composer holds: Markdown text and the mentions, commands and record references
// placed in it.

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
export const tokenTriggers: Readonly<Record<MessageComposerTokenKind, string>> = {
  mention: '@',
  command: '/',
  reference: '',
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
    (token.recordType === undefined || typeof token.recordType === 'string')
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

/** Whether two messages hold the same text and tokens. */
export function isSameMessage(a: MessageComposerMessage, b: MessageComposerMessage): boolean {
  return a.text === b.text && JSON.stringify(a.tokens) === JSON.stringify(b.tokens);
}

/**
 * Stores a draft as the message's JSON, whichever composer holds it, so plain and rich composers
 * read each other's drafts; anything else in storage reads as a parse failure.
 */
export function createMessageCodec<T>(
  toMessage: (value: T) => MessageComposerMessage,
  fromMessage: (message: MessageComposerMessage) => T,
): PersistCodec<T> {
  return {
    stringify: (value) => JSON.stringify(toMessage(value)),
    parse: (raw) => {
      const value: unknown = JSON.parse(raw);
      if (!isMessage(value)) throw new Error('Not a stored message.');
      return fromMessage(value);
    },
  };
}
