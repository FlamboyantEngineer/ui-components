import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  createTextSelection,
  readTextSelection,
  replaceMessageRange,
  replaceShownMessage,
  snapRangeToTokens,
  spliceMessage,
} from './composer-edits.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { toDocumentPosition, toTextOffset } from './composer-offsets.js';

const ana = { kind: 'mention', id: 'ana', label: 'Ana Lopez' } as const;

/** A message with a pill, a second line with Unicode, and a fenced code block. */
const MESSAGE: MessageComposerMessage = {
  text: 'Hi @Ana Lopez **now**\nCafé 👋 next\n```js\nlet a = 1;\n```\nend',
  tokens: [{ ...ana, start: 3, end: 13 }],
};

const stateOf = (message: MessageComposerMessage) =>
  EditorState.create({ doc: parseComposerMessage(message) });

describe('Rich composer text offsets', () => {
  it('UIC-MESSAGE-COMPOSER-4.11 maps every caret place to its offset in the message text and back', () => {
    const doc = parseComposerMessage(MESSAGE);
    const { text } = serializeComposerDocument(doc);
    expect(text).toBe(MESSAGE.text);
    // Every offset outside a pill and a fence line round-trips through a document position.
    const fence = { start: text.indexOf('```js'), end: text.indexOf('```js') + 6 };
    const close = text.lastIndexOf('```');
    for (let offset = 0; offset <= text.length; offset += 1) {
      const isInPill = offset > 3 && offset < 13;
      const isInFence =
        (offset >= fence.start && offset < fence.end) || (offset >= close && offset <= close + 3);
      if (isInPill || isInFence) continue;
      const pos = toDocumentPosition(doc, offset, 1);
      expect(toTextOffset(doc, pos), `offset ${String(offset)}`).toBe(offset);
    }
  });

  it('UIC-MESSAGE-COMPOSER-4.11 moves an offset inside a pill to its edge by bias', () => {
    const doc = parseComposerMessage(MESSAGE);
    expect(toTextOffset(doc, toDocumentPosition(doc, 6, -1))).toBe(3);
    expect(toTextOffset(doc, toDocumentPosition(doc, 6, 1))).toBe(13);
  });

  it('UIC-MESSAGE-COMPOSER-4.11 reads and restores a selection across lines and a pill', () => {
    const state = stateOf(MESSAGE);
    const selection = createTextSelection(state, { start: 5, end: 26 });
    const selected = state.apply(state.tr.setSelection(selection));
    // The start inside the pill takes the whole pill in.
    expect(readTextSelection(selected)).toEqual({ start: 3, end: 26 });
    const caret = createTextSelection(state, { start: 5, end: 5 });
    expect(caret.from).toBe(toDocumentPosition(state.doc, 3, -1));
  });
});

describe('Rich composer range edits', () => {
  it('UIC-MESSAGE-COMPOSER-4.11 grows a range to whole tokens and splices a fragment with its tokens', () => {
    expect(snapRangeToTokens(MESSAGE, { start: 5, end: 14 })).toEqual({ start: 3, end: 14 });
    const fragment = {
      text: '@Jon Berg',
      tokens: [{ ...ana, id: 'jon', label: 'Jon Berg', start: 0, end: 9 }],
    };
    const next = spliceMessage(MESSAGE, { start: 0, end: 2 }, fragment);
    expect(next.text.startsWith('@Jon Berg @Ana Lopez')).toBe(true);
    expect(next.tokens).toEqual([
      { ...ana, id: 'jon', label: 'Jon Berg', start: 0, end: 9 },
      { ...ana, start: 10, end: 20 },
    ]);
  });

  it('UIC-MESSAGE-COMPOSER-4.11 replaces a range as one change, with the caret after it, keeping the rest', () => {
    const state = stateOf(MESSAGE);
    const tr = replaceMessageRange(state, {
      range: { start: 22, end: 26 },
      fragment: { text: 'Tea', tokens: [] },
    });
    const next = state.apply(tr);
    const message = serializeComposerDocument(next.doc);
    expect(message.text).toBe(MESSAGE.text.replace('Café', 'Tea'));
    expect(message.tokens).toEqual(MESSAGE.tokens);
    expect(readTextSelection(next)).toEqual({ start: 25, end: 25 });
  });

  it('UIC-MESSAGE-COMPOSER-4.11 keeps the caret at its place in the text when a value from outside replaces the document', () => {
    const state = stateOf(MESSAGE);
    const at = toDocumentPosition(state.doc, 27, 1);
    const placed = state.apply(state.tr.setSelection(TextSelection.create(state.doc, at)));
    const projected = {
      text: `Hello ${MESSAGE.text.slice(3)}`,
      tokens: [{ ...ana, start: 6, end: 16 }],
    };
    const next = replaceShownMessage(placed, stateOf(projected));
    expect(serializeComposerDocument(next.doc)).toEqual(projected);
    expect(readTextSelection(next)).toEqual({ start: 30, end: 30 });
  });
});
