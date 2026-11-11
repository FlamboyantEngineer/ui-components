// Mentions in a comment's stored text: the person a mention names, how a mention is written into
// the text and read back out of it (specs/COMMENT-COMPOSER.md, UIC-COMMENT-COMPOSER-2).

import type { ReactNode } from 'react';

/** A person the reader can mention. */
export interface MentionCandidate {
  /** The person's stable id, kept in the comment's text. */
  id: string;
  /** The name shown in the suggestion list and on the mention's chip. */
  name: string;
  /** The address of the person's picture, shown in the suggestion list. */
  avatar?: string | undefined;
  /** A second line in the suggestion list, such as a role. */
  description?: string | undefined;
}

/** A run of a comment's text: plain text, or one mention with the raw text it was written as. */
export type CommentTextSegment =
  { kind: 'text'; text: string } | { kind: 'mention'; text: string; id: string; name: string };

/** Where mentions come from, and how they are written into a comment's text. */
export interface CommentMentionOptions {
  /** The people matching the text typed after `@`. Aborted once the answer is no longer wanted. */
  search: (query: string, signal: AbortSignal) => Promise<readonly MentionCandidate[]>;
  /** Writes a chosen person into the text. Defaults to `serializeMention`, `@[Name](id)`. */
  serialize?: ((candidate: MentionCandidate) => string) | undefined;
  /** Splits stored text into text and mentions; the inverse of `serialize`. Defaults to `parseMentions`. */
  parse?: ((text: string) => readonly CommentTextSegment[]) | undefined;
}

/** What a comment composer hands the text box that takes mentions. */
export interface CommentMentionFieldProps {
  /** The text box's hook class, `ui-comment-composer__field`. */
  className: string;
  /** Names the text box. */
  label: string;
  placeholder: string;
  /** The draft, with each mention written as `serialize` writes it. */
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
  autoFocus: boolean | undefined;
}

/** Mentions for comments, made by `createCommentMentions` from the `comment-composer/rich` entry point. */
export interface CommentMentions extends Required<CommentMentionOptions> {
  /** Draws the text box that takes mentions, which needs the rich text peers. */
  renderField: (field: CommentMentionFieldProps) => ReactNode;
}

// `@[Name](id)`, where a backslash escapes `\`, `]` in the name and `\`, `)` in the id.
const mentionPattern = /@\[((?:\\.|[^\\\]])*)\]\(((?:\\.|[^\\)])*)\)/g;
const escapedPattern = /\\(.)/g;

function escapeMentionPart(text: string, closer: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll(closer, `\\${closer}`);
}

function unescapeMentionPart(text: string): string {
  return text.replace(escapedPattern, '$1');
}

/** Writes a person as the default mention token, `@[Name](id)`, escaping what would end it early. */
export function serializeMention(candidate: Pick<MentionCandidate, 'id' | 'name'>): string {
  return `@[${escapeMentionPart(candidate.name, ']')}](${escapeMentionPart(candidate.id, ')')})`;
}

/** Splits text into plain runs and the `@[Name](id)` mentions that `serializeMention` writes. */
export function parseMentions(text: string): CommentTextSegment[] {
  const segments: CommentTextSegment[] = [];
  let at = 0;
  for (const match of text.matchAll(mentionPattern)) {
    if (match.index > at) segments.push({ kind: 'text', text: text.slice(at, match.index) });
    const [raw, name = '', id = ''] = match;
    segments.push({
      kind: 'mention',
      text: raw,
      id: unescapeMentionPart(id),
      name: unescapeMentionPart(name),
    });
    at = match.index + raw.length;
  }
  if (at < text.length) segments.push({ kind: 'text', text: text.slice(at) });
  return segments;
}
