import { Fragment, Slice } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';
import type { MessageComposerMessage } from '../composer-message.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { composerSchema } from './composer-schema.js';

const message: MessageComposerMessage = {
  text: '/summarize the notes for @Maria Santos\n\n```ts\nconst a = 1;\n  indented\n```\nthanks',
  tokens: [
    { start: 0, end: 10, kind: 'command', id: 'summarize', label: 'summarize' },
    { start: 25, end: 38, kind: 'mention', id: 'maria', label: 'Maria Santos' },
  ],
};

describe('rich composer Markdown', () => {
  it('UIC-MESSAGE-COMPOSER-4.2 reads a message as lines, pills and code blocks and writes it back', () => {
    const doc = parseComposerMessage(message);
    expect(doc.childCount).toBe(4);
    expect(doc.child(0).child(0).type.name).toBe('pill');
    expect(doc.child(0).child(0).attrs).toEqual({
      kind: 'command',
      id: 'summarize',
      label: 'summarize',
    });
    expect(doc.child(0).lastChild?.type.name).toBe('pill');
    expect(doc.child(1).content.size).toBe(0);
    expect(doc.child(2).type.name).toBe('codeBlock');
    expect(doc.child(2).attrs.language).toBe('ts');
    const code = doc.child(2).textBetween(0, doc.child(2).content.size);
    expect(code).toBe('const a = 1;\n  indented');
    expect(serializeComposerDocument(doc)).toEqual(message);
  });

  it('UIC-MESSAGE-COMPOSER-4.2 keeps an unclosed fence and an empty message as text', () => {
    const open = { text: '```\nnot code', tokens: [] };
    const doc = parseComposerMessage(open);
    expect(doc.childCount).toBe(2);
    expect(doc.child(0).type.name).toBe('paragraph');
    expect(serializeComposerDocument(doc)).toEqual(open);
    const empty = parseComposerMessage({ text: '', tokens: [] });
    expect(empty.childCount).toBe(1);
    expect(serializeComposerDocument(empty)).toEqual({ text: '', tokens: [] });
    const block = { text: '```\n\n```', tokens: [] };
    expect(serializeComposerDocument(parseComposerMessage(block))).toEqual(block);
  });

  it('UIC-MESSAGE-COMPOSER-4.9 reads and writes references with their identity, record type and edits around them', () => {
    const references: MessageComposerMessage = {
      text: 'TRIP-4 and NOTE-12\nTRIP-4',
      tokens: [
        { start: 0, end: 6, kind: 'reference', id: 'a1', label: 'TRIP-4', recordType: 'itinerary' },
        { start: 11, end: 18, kind: 'reference', id: 'b2', label: 'NOTE-12' },
        {
          start: 19,
          end: 25,
          kind: 'reference',
          id: 'a1',
          label: 'TRIP-4',
          recordType: 'itinerary',
        },
      ],
    };
    const doc = parseComposerMessage(references);
    expect(doc.child(0).child(0).attrs).toMatchObject({
      kind: 'reference',
      recordType: 'itinerary',
    });
    const written = serializeComposerDocument(doc);
    expect(written).toEqual(references);
    expect(written.tokens[1]).not.toHaveProperty('recordType');
    const edited = serializeComposerDocument(
      doc.replace(1, 1, new Slice(Fragment.from(composerSchema.text('See ')), 0, 0)),
    );
    expect(edited.text).toBe('See TRIP-4 and NOTE-12\nTRIP-4');
    expect(edited.tokens.map(({ start, end, id }) => [start, end, id])).toEqual([
      [4, 10, 'a1'],
      [15, 22, 'b2'],
      [23, 29, 'a1'],
    ]);
  });
});
