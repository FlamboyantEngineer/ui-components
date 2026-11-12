// Mentions in a comment's stored text: the person a mention names, how a mention is written into
// the text and read back out of it (specs/COMMENT-COMPOSER.md, UIC-COMMENT-COMPOSER-2).

import type { ReactNode } from 'react';

/**
 * What a mention names: a `person` (the default), a `group` of people, an `assistant`, or a kind of
 * the host's own, in lower-case letters, digits and hyphens.
 */
export type MentionKind = 'person' | 'group' | 'assistant' | (string & {});

/** Someone or something the reader can mention: a person, a group, an assistant. */
export interface MentionCandidate {
  /** What the mention names. Defaults to `person`. */
  kind?: MentionKind | undefined;
  /** The stable id, kept in the comment's text. */
  id: string;
  /** The name shown in the suggestion list and on the mention's chip. */
  name: string;
  /** The address of the person's picture, shown in the suggestion list. */
  avatar?: string | undefined;
  /** A second line in the suggestion list, such as a role. */
  description?: string | undefined;
  /** How many people a group holds, shown in the suggestion list. */
  count?: number | undefined;
}

/**
 * A run of a comment's text: plain text, or one mention with the raw text it was written as and
 * what it names (`mentionKind`, a person when left out).
 */
export type CommentTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; id: string; name: string; mentionKind?: MentionKind };

/** Where mentions come from, and how they are written into a comment's text. */
export interface CommentMentionOptions {
  /** The people matching the text typed after `@`. Aborted once the answer is no longer wanted. */
  search: (query: string, signal: AbortSignal) => Promise<readonly MentionCandidate[]>;
  /**
   * Writes a chosen candidate into the text. Defaults to `serializeMention`: `@[Name](id)` for a
   * person, `@kind[Name](id)` for another kind.
   */
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

// `@[Name](id)` or `@kind[Name](id)`, where a backslash escapes `\`, `]` in the name and `\`, `)` in
// the id. The pattern is sticky: the scanner tries it where an `@` stands. The kind, name and id
// are bounded, so a failed try reads a bounded stretch of text and scanning stays linear in it.
const mentionPattern =
  /@([a-z][a-z0-9-]{0,63})?\[((?:\\.|[^\\\]]){0,256})\]\(((?:\\.|[^\\)]){0,256})\)/y;
const escapedPattern = /\\(.)/g;
const kindPattern = /^[a-z][a-z0-9-]{0,63}$/;

function escapeMentionPart(text: string, closer: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll(closer, `\\${closer}`);
}

function unescapeMentionPart(text: string): string {
  return text.replace(escapedPattern, '$1');
}

/**
 * Writes a candidate as the default mention token: `@[Name](id)` for a person, `@kind[Name](id)`
 * for another kind, escaping what would end it early. A kind outside lower-case letters, digits and
 * hyphens is an error, since it could not be read back.
 */
export function serializeMention(
  candidate: Pick<MentionCandidate, 'id' | 'name' | 'kind'>,
): string {
  const kind = candidate.kind ?? 'person';
  if (!kindPattern.test(kind)) throw new Error(`Mention kind "${kind}" is not lower-case words.`);
  const prefix = kind === 'person' ? '' : kind;
  return `@${prefix}[${escapeMentionPart(candidate.name, ']')}](${escapeMentionPart(candidate.id, ')')})`;
}

/**
 * The end of the code span opening at `at` (a run of backticks closed by an equal run), or -1.
 * `unclosed` holds the run lengths already known to have no closer further on, so a text of many
 * unclosed runs is searched once per length, not once per run.
 */
function findCodeSpanEnd(text: string, at: number, unclosed: Set<number>): number {
  let run = at;
  while (text[run] === '`') run += 1;
  const fence = text.slice(at, run);
  if (unclosed.has(fence.length)) return -1;
  for (let close = text.indexOf(fence, run); close >= 0; close = text.indexOf(fence, close + 1)) {
    const end = close + fence.length;
    if (text[close - 1] !== '`' && text[end] !== '`') return end;
    while (text[close + 1] === '`') close += 1;
  }
  unclosed.add(fence.length);
  return -1;
}

/** The mention token that starts at `at`, or null. */
function readMention(text: string, at: number): CommentTextSegment | null {
  mentionPattern.lastIndex = at;
  const match = mentionPattern.exec(text);
  if (!match) return null;
  const [raw, kind = 'person', name = '', id = ''] = match;
  return {
    kind: 'mention',
    text: raw,
    id: unescapeMentionPart(id),
    name: unescapeMentionPart(name),
    mentionKind: kind,
  };
}

/**
 * Splits text into plain runs and the mentions that `serializeMention` writes. Text inside a code
 * span (between equal runs of backticks) and an `@` after a backslash stay plain, so a token can be
 * quoted literally; the runs always join back into the text.
 */
export function parseMentions(text: string): CommentTextSegment[] {
  const segments: CommentTextSegment[] = [];
  const unclosed = new Set<number>();
  let plain = 0;
  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (char === '\\') {
      at += 2;
      continue;
    }
    if (char === '`') {
      const end = findCodeSpanEnd(text, at, unclosed);
      let run = at;
      while (text[run] === '`') run += 1;
      at = end < 0 ? run : end;
      continue;
    }
    const mention = char === '@' ? readMention(text, at) : null;
    if (!mention) {
      at += 1;
      continue;
    }
    if (at > plain) segments.push({ kind: 'text', text: text.slice(plain, at) });
    segments.push(mention);
    at += mention.text.length;
    plain = at;
  }
  if (plain < text.length) segments.push({ kind: 'text', text: text.slice(plain) });
  return segments;
}
