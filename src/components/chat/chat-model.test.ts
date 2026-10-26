import { describe, expect, it } from 'vitest';
import { ana, helper, message, people, reader } from '../../../test/chat-fixtures.js';
import type { ChatMessageData, ChatTextToken } from '../chat-parts/chat-parts.js';
import {
  findLastOwnText,
  findMessageMatches,
  findStatusText,
  hasAssistant,
  indexParticipants,
  listReaders,
  listTypingNames,
  readMessageText,
  toComposerTokens,
  toDisplayStatus,
  toDisplayTokens,
  toExcerpt,
  toMessageAuthor,
  toMessageOrigin,
  toMessageText,
  toThinkingActivity,
} from './chat-model.js';

const index = indexParticipants([...people, helper]);

describe('chat model', () => {
  it('UIC-CHAT-1.3 maps a participant to an author, an assistant rounded', () => {
    expect(toMessageAuthor(ana)).toEqual({
      name: 'Ana Lopez',
      status: 'active',
      statusLabel: 'Active',
    });
    expect(toMessageAuthor(helper)).toEqual({ name: 'Trip helper', shape: 'rounded' });
    expect(toMessageAuthor({ ...helper, shape: 'square' })).toMatchObject({ shape: 'square' });
    expect(hasAssistant(people)).toBe(false);
    expect(hasAssistant([reader, helper])).toBe(true);
  });

  it('UIC-CHAT-1.3 reads the origin from the author and the reader', () => {
    expect(toMessageOrigin(message('a', 'sam'), 'sam')).toBe('sent');
    expect(toMessageOrigin(message('b', 'ana'), 'sam')).toBe('received');
    expect(toMessageOrigin(message('c', undefined), 'sam')).toBe('system');
  });

  it('UIC-CHAT-1.4 shows a reply waiting for the reader as complete', () => {
    const waiting: ChatMessageData = {
      ...message('r', 'helper', { status: 'streaming' }),
      parts: [{ type: 'question', id: 'q', status: 'pending', questions: [] }],
    };
    expect(toDisplayStatus(waiting)).toBe('complete');
    expect(toDisplayStatus({ ...waiting, parts: [] })).toBe('streaming');
    expect(toDisplayStatus(message('d', 'ana'))).toBe('complete');
  });

  it('UIC-CHAT-2.2 reads a message’s text and code, and cuts a long excerpt', () => {
    const mixed: ChatMessageData = {
      ...message('x', 'helper'),
      parts: [
        { type: 'text', text: 'Run this:' },
        { type: 'reasoning', id: 'r', text: 'hidden', status: 'complete' },
        { type: 'code', code: 'ls trips' },
      ],
    };
    expect(readMessageText(mixed)).toBe('Run this:\n\nls trips');
    expect(toExcerpt('  two\n lines ')).toBe('two lines');
    const long = toExcerpt('word '.repeat(60));
    expect(long).toHaveLength(140);
    expect(long.endsWith('…')).toBe(true);
  });

  it('UIC-CHAT-3.2 adds the trigger to sent tokens and takes it off for the composer', () => {
    const bare: ChatTextToken[] = [
      { start: 0, end: 10, kind: 'mention', id: 'ana', label: 'Ana Lopez' },
      { start: 11, end: 21, kind: 'command', id: 'sum', label: 'summarize' },
    ];
    const shown = toDisplayTokens(bare);
    expect(shown.map((token) => token.label)).toEqual(['@Ana Lopez', '/summarize']);
    expect(toDisplayTokens(shown)).toEqual(shown);
    expect(toComposerTokens(shown)).toEqual(bare);
    const edited = { ...message('e', 'sam', { text: '@Ana Lopez hi' }) };
    edited.parts = [{ type: 'text', text: '@Ana Lopez hi', tokens: [shown[0]!] }];
    expect(toMessageText(edited)).toEqual({ text: '@Ana Lopez hi', tokens: [bare[0]] });
  });

  it('UIC-CHAT-2.5 finds the reader’s last message they may edit', () => {
    const messages = [
      message('a', 'sam'),
      message('b', 'sam', { isDeleted: true }),
      { ...message('c', 'sam'), parts: [] },
      message('d', 'ana'),
    ];
    expect(findLastOwnText(messages, 'sam')?.id).toBe('a');
    expect(findLastOwnText([message('d', 'ana')], 'sam')).toBeUndefined();
  });

  it('UIC-CHAT-4.1 names who types, the reader left out', () => {
    expect(listTypingNames(['ana', 'sam', 'nobody'], index, 'sam')).toEqual(['Ana Lopez']);
    expect(listTypingNames(undefined, index, 'sam')).toEqual([]);
  });

  it('UIC-CHAT-4.2 thinks while a streaming reply shows nothing or says what it does, as long as asked', () => {
    const writing = message('r', 'helper', { status: 'streaming' });
    const empty = { ...writing, parts: [] };
    const saying = { ...writing, statusText: 'Searching…' };
    const reasoning = { type: 'reasoning', id: 'why', text: 'Hm', status: 'streaming' } as const;
    const reasoningLast = { ...writing, parts: [...writing.parts, reasoning] };
    const cases = [
      [empty, ['thinking', 'thinking', 'thinking']],
      [saying, ['thinking', 'thinking', 'thinking']],
      [reasoningLast, [undefined, 'thinking', 'thinking']],
      [writing, [undefined, undefined, 'writing']],
      [{ ...empty, status: 'complete' }, [undefined, undefined, undefined]],
      [
        { ...writing, parts: [{ type: 'question', id: 'q', status: 'pending', questions: [] }] },
        [undefined, undefined, undefined],
      ],
    ] as const satisfies readonly (readonly [ChatMessageData, readonly unknown[]])[];
    for (const [reply, expected] of cases) {
      expect(
        (['content', 'text', 'end'] as const).map((until) => toThinkingActivity(reply, until)),
      ).toEqual(expected);
    }
  });

  it('UIC-CHAT-5.1 reads the status of the reply that streams', () => {
    const working = message('r', 'helper', { status: 'streaming', statusText: 'Searching…' });
    expect(findStatusText([working])).toBe('Searching…');
    expect(findStatusText([{ ...working, status: 'complete' }])).toBeUndefined();
    expect(findStatusText([])).toBeUndefined();
  });

  it('UIC-CHAT-4.3 lists each message’s readers, the reader and strangers left out', () => {
    const readers = listReaders({ ana: 'm2', ben: 'm2', sam: 'm2', ghost: 'm1' }, index, 'sam');
    expect(readers.get('m2')?.map((person) => person.name)).toEqual(['Ana Lopez', 'Ben Carter']);
    expect(readers.get('m2')?.[0]).not.toHaveProperty('status');
    expect(readers.has('m1')).toBe(false);
    expect(listReaders(undefined, index, 'sam').size).toBe(0);
  });

  it('UIC-CHAT-5.3 matches messages holding every term, ignoring case and accents', () => {
    const messages = [
      message('a', 'ana', { text: 'The Café by the river' }),
      message('b', 'ben', { text: 'A cafe near the castle' }),
      message('c', 'ben', { text: 'cafe river', isDeleted: true }),
    ];
    expect(findMessageMatches(messages, 'cafe')).toEqual(['a', 'b']);
    expect(findMessageMatches(messages, 'RIVER café')).toEqual(['a']);
    expect(findMessageMatches(messages, '  ')).toEqual([]);
  });
});
