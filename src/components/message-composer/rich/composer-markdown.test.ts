import { Fragment, Slice } from 'prosemirror-model';
import { describe, expect, it, vi } from 'vitest';
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

  it('UIC-MESSAGE-COMPOSER-4.2 fences code longer than its own backtick runs, so it round-trips', () => {
    const code = (text: string) =>
      composerSchema.node('codeBlock', { language: 'md' }, composerSchema.text(text));
    const pill = composerSchema.node('pill', {
      kind: 'mention',
      id: 'maria',
      label: 'Maria Santos',
    });
    const doc = composerSchema.node('doc', null, [
      composerSchema.node('paragraph', null, [composerSchema.text('Hi '), pill]),
      code('before\n```\nafter'),
      code('````js\nx\n````'),
      composerSchema.node('paragraph', null, composerSchema.text('done')),
    ]);
    const saved = serializeComposerDocument(doc);
    expect(saved.text).toBe(
      'Hi @Maria Santos\n````md\nbefore\n```\nafter\n````\n`````md\n````js\nx\n````\n`````\ndone',
    );
    // Saved and restored again and again, the document and the token offsets stay the same.
    let restored = parseComposerMessage(saved);
    for (let round = 0; round < 3; round += 1) {
      expect(restored.eq(doc)).toBe(true);
      expect(serializeComposerDocument(restored)).toEqual(saved);
      restored = parseComposerMessage(serializeComposerDocument(restored));
    }
    // A longer closing fence closes a block too, as in CommonMark; a shorter one is code.
    const longer = parseComposerMessage({ text: '````\n```\nx\n`````\nafter', tokens: [] });
    const texts = [longer.child(0), longer.child(1)].map((block) => block.textContent);
    expect(texts).toEqual(['```\nx', 'after']);
  });

  it('UIC-MESSAGE-COMPOSER-4.2 fences code with very many backtick runs, or one long run', () => {
    for (const [body, fence] of [
      ['x` '.repeat(150_000), '```'],
      ['`'.repeat(20_000), '`'.repeat(20_001)],
    ]) {
      const text = `${fence}\n${body}\n${fence}`;
      const saved = serializeComposerDocument(parseComposerMessage({ text, tokens: [] }));
      expect(saved.text).toBe(text);
      const code = [parseComposerMessage(saved).child(0)].map((block) => block.textContent);
      expect(code).toEqual([body]);
    }
  });

  it('UIC-MESSAGE-COMPOSER-4.2 reads unclosed fences, many small blocks and many tokens in linear work', () => {
    /** The line tests a parse runs, which grow with the text when no line is searched again. */
    const countLineTests = (text: string, tokens: MessageComposerMessage['tokens'] = []) => {
      const test = vi.spyOn(RegExp.prototype, 'test');
      parseComposerMessage({ text, tokens });
      const calls = test.mock.calls.length;
      test.mockRestore();
      return calls;
    };
    const openers = (count: number) =>
      Array.from({ length: count }, () => '```javascript').join('\n');
    const blocks = (count: number) => Array.from({ length: count }, () => '```\nx\n```').join('\n');
    for (const make of [openers, blocks]) {
      const small = countLineTests(make(2000));
      expect(countLineTests(make(4000))).toBeLessThanOrEqual(small * 2 + 2);
    }
    // Every opener with no closing fence after it stays a line of text.
    const doc = parseComposerMessage({ text: `${openers(3)}\n\`\``, tokens: [] });
    expect([...Array(doc.childCount).keys()].map((index) => doc.child(index).type.name)).toEqual([
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
    ]);
    // Many mentions over many lines keep their places.
    const lines = Array.from({ length: 3000 }, (_, index) => `@Ana ${String(index)}`);
    const text = lines.join('\n');
    let start = 0;
    const tokens = lines.map((line) => {
      const token = { kind: 'mention' as const, id: 'ana', label: 'Ana', start, end: start + 4 };
      start += line.length + 1;
      return token;
    });
    expect(serializeComposerDocument(parseComposerMessage({ text, tokens }))).toEqual({
      text,
      tokens,
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.2 round-trips fences of each length and language beside tokens outside code', () => {
    const text = '@Ana see\n````py\nx = "```"\n````\n```\n@Ana in code\n```\nthen @Ana';
    const tokens = [
      { kind: 'mention' as const, id: 'ana', label: 'Ana', start: 0, end: 4 },
      { kind: 'mention' as const, id: 'ana', label: 'Ana', start: 57, end: 61 },
    ];
    const doc = parseComposerMessage({ text, tokens });
    expect(doc.child(1).attrs.language).toBe('py');
    const codes = [doc.child(1), doc.child(2)].map((block) => block.textContent);
    expect(codes[0]).toBe('x = "```"');
    // The mention inside the plain block stays code.
    expect(codes[1]).toBe('@Ana in code');
    expect(serializeComposerDocument(doc)).toEqual({ text, tokens });
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
