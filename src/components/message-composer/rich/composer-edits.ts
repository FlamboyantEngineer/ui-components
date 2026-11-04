// Edits of the rich composer's message by text range: the host's range replacement, the result of
// an interceptable paste and controlled values that replace the shown document
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.11).

import { closeHistory } from 'prosemirror-history';
import type { Node } from 'prosemirror-model';
import { EditorState, Selection, TextSelection, type Transaction } from 'prosemirror-state';
import type { MessageComposerMessage, MessageComposerToken } from '../composer-message.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { toDocumentPosition, toTextOffset, type OffsetBias } from './composer-offsets.js';

/** A range of the message's text, by UTF-16 offsets; `end` is exclusive. */
export interface MessageComposerRange {
  start: number;
  end: number;
}

/** Whether a range lies within a text of this length, in order. */
export function isRangeWithin(range: MessageComposerRange, length: number): boolean {
  const { start, end } = range;
  return (
    Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end && end <= length
  );
}

/** The range grown to take in whole every token it cuts, so no token is ever split. */
export function snapRangeToTokens(
  message: MessageComposerMessage,
  range: MessageComposerRange,
): MessageComposerRange {
  let { start, end } = range;
  for (const token of message.tokens) {
    if (token.start < start && token.end > start) start = token.start;
    if (token.start < end && token.end > end) end = token.end;
  }
  return { start, end };
}

/** Tokens of a fragment that lie inside it, in order and without overlapping, moved by `shift`. */
function placeFragmentTokens(
  fragment: MessageComposerMessage,
  shift: number,
): MessageComposerToken[] {
  const placed: MessageComposerToken[] = [];
  let reached = 0;
  const sorted = [...fragment.tokens].sort((a, b) => a.start - b.start);
  for (const token of sorted) {
    if (token.start < reached || token.end > fragment.text.length || token.start >= token.end) {
      continue;
    }
    placed.push({ ...token, start: token.start + shift, end: token.end + shift });
    reached = token.end;
  }
  return placed;
}

/** The message with `range` replaced by `fragment`; the range must not cut a token. */
export function spliceMessage(
  message: MessageComposerMessage,
  range: MessageComposerRange,
  fragment: MessageComposerMessage,
): MessageComposerMessage {
  const delta = fragment.text.length - (range.end - range.start);
  const before = message.tokens.filter((token) => token.end <= range.start);
  const after = message.tokens
    .filter((token) => token.start >= range.end)
    .map((token) => ({ ...token, start: token.start + delta, end: token.end + delta }));
  return {
    text: message.text.slice(0, range.start) + fragment.text + message.text.slice(range.end),
    tokens: [...before, ...placeFragmentTokens(fragment, range.start), ...after],
  };
}

/** Text alone as a fragment without tokens; a message as itself. */
export function toFragment(content: string | MessageComposerMessage): MessageComposerMessage {
  return typeof content === 'string' ? { text: content, tokens: [] } : content;
}

/**
 * Replaces the document's content with `doc`'s, changing only what differs, so positions outside
 * the change (the selection, a pending paste) map through it.
 */
function replaceDocument(tr: Transaction, doc: Node): Transaction {
  const current = tr.doc;
  const start = current.content.findDiffStart(doc.content);
  if (start === null) return tr;
  const diffEnd = current.content.findDiffEnd(doc.content);
  let endA = diffEnd?.a ?? current.content.size;
  let endB = diffEnd?.b ?? doc.content.size;
  const overlap = start - Math.min(endA, endB);
  if (overlap > 0) {
    endA += overlap;
    endB += overlap;
  }
  return tr.replace(start, endA, doc.slice(start, endB));
}

/**
 * Replaces a range of the shown message with a fragment, as one undo step of its own, and puts the
 * caret after the fragment, or keeps the selection where it maps when `keepSelection` is set.
 */
export function replaceMessageRange(
  state: EditorState,
  edit: { range: MessageComposerRange; fragment: MessageComposerMessage; keepSelection?: boolean },
): Transaction {
  const message = serializeComposerDocument(state.doc);
  const range = snapRangeToTokens(message, edit.range);
  const next = spliceMessage(message, range, edit.fragment);
  const doc = parseComposerMessage(next);
  const tr = replaceDocument(closeHistory(state.tr), doc);
  if (!edit.keepSelection) {
    const caret = toDocumentPosition(tr.doc, range.start + edit.fragment.text.length, 1);
    tr.setSelection(TextSelection.create(tr.doc, caret));
  }
  return tr.scrollIntoView();
}

/** The selection as a range of the message's text. */
export function readTextSelection(state: EditorState): MessageComposerRange {
  const { from, to } = state.selection;
  return { start: toTextOffset(state.doc, from), end: toTextOffset(state.doc, to) };
}

/**
 * A selection over a range of the message's text: an end inside a pill moves out of it, the start
 * to the pill's start and the end to its end, and a caret to the nearer side.
 */
export function createTextSelection(
  state: EditorState,
  range: MessageComposerRange,
): TextSelection {
  const { doc } = state;
  if (range.start === range.end) {
    const before = toDocumentPosition(doc, range.start, -1);
    const after = toDocumentPosition(doc, range.start, 1);
    const isNearerStart =
      range.start - toTextOffset(doc, before) <= toTextOffset(doc, after) - range.start;
    return TextSelection.create(doc, isNearerStart ? before : after);
  }
  return TextSelection.create(
    doc,
    toDocumentPosition(doc, range.start, -1),
    toDocumentPosition(doc, range.end, 1),
  );
}

/** The lengths of the text two strings share at their start and, apart from that, at their end. */
function measureCommonEnds(before: string, after: string) {
  let prefix = 0;
  const shorter = Math.min(before.length, after.length);
  while (prefix < shorter && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < shorter - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return { prefix, suffix };
}

/**
 * Where an offset of the old text lands in the new one: before the change it stays, after it it
 * moves with the text, at the end it stays at the end, at an insertion it follows the inserted
 * text, and inside a rewritten stretch it keeps its offset within that stretch.
 */
function mapTextOffset(offset: number, before: string, after: string): number {
  if (offset >= before.length) return after.length;
  const { prefix, suffix } = measureCommonEnds(before, after);
  const changedEnd = before.length - suffix;
  if (offset < prefix) return offset;
  if (offset > changedEnd) return offset + after.length - before.length;
  if (prefix === changedEnd) return after.length - suffix;
  return Math.min(offset, after.length - suffix);
}

/**
 * A fresh state showing a controlled value, with an empty history, whose selection keeps its place
 * in the text (`mapTextOffset`): a caret at the end stays at the end, and a caret in text the value
 * rewrote, as a host's projection does, keeps its offset.
 */
export function replaceShownMessage(state: EditorState, fresh: EditorState): EditorState {
  const before = serializeComposerDocument(state.doc).text;
  const after = serializeComposerDocument(fresh.doc).text;
  // The document's last caret place, as after a code block's text, stands for its end.
  const end = Selection.atEnd(state.doc).from;
  const place = (pos: number, bias: OffsetBias) =>
    pos >= end
      ? Selection.atEnd(fresh.doc).from
      : toDocumentPosition(
          fresh.doc,
          mapTextOffset(toTextOffset(state.doc, pos), before, after),
          bias,
        );
  const { anchor, head } = state.selection;
  const isForward = anchor <= head;
  const selection = TextSelection.create(
    fresh.doc,
    place(anchor, isForward ? -1 : 1),
    place(head, isForward ? 1 : -1),
  );
  return EditorState.create({ doc: fresh.doc, plugins: fresh.plugins, selection });
}
