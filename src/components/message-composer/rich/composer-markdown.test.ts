import { describe, expect, it } from 'vitest';
import type { MessageComposerMessage } from '../composer-message.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';

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
});
