import { describe, expect, it } from 'vitest';
import { parseMentions, serializeMention } from './comment-mentions.js';

describe('comment mention tokens', () => {
  it('UIC-COMMENT-COMPOSER-2.3 writes a person as @[Name](id)', () => {
    expect(serializeMention({ id: 'ana', name: 'Ana Lopez' })).toBe('@[Ana Lopez](ana)');
  });

  it('UIC-COMMENT-COMPOSER-2.3 splits text into runs and mentions', () => {
    expect(parseMentions('Hi @[Ana Lopez](ana) and @[Jon](j-1)!')).toEqual([
      { kind: 'text', text: 'Hi ' },
      {
        kind: 'mention',
        text: '@[Ana Lopez](ana)',
        id: 'ana',
        name: 'Ana Lopez',
        mentionKind: 'person',
      },
      { kind: 'text', text: ' and ' },
      { kind: 'mention', text: '@[Jon](j-1)', id: 'j-1', name: 'Jon', mentionKind: 'person' },
      { kind: 'text', text: '!' },
    ]);
    expect(parseMentions('')).toEqual([]);
    expect(parseMentions('mail me @ noon [x](y)')).toEqual([
      { kind: 'text', text: 'mail me @ noon [x](y)' },
    ]);
  });

  it('UIC-COMMENT-COMPOSER-2.3 escapes brackets and backslashes so any name and id round-trip', () => {
    const person = { id: 'a)b\\c', name: 'Jo [the] \\ one' };
    const token = serializeMention(person);
    expect(token).toBe('@[Jo [the\\] \\\\ one](a\\)b\\\\c)');
    expect(parseMentions(`x${token}y`)).toEqual([
      { kind: 'text', text: 'x' },
      { kind: 'mention', text: token, ...person, mentionKind: 'person' },
      { kind: 'text', text: 'y' },
    ]);
  });

  it('UIC-COMMENT-COMPOSER-2.4 writes and reads a kind before the brackets', () => {
    const group = { kind: 'group', id: 'g-1', name: 'Bakers' } as const;
    expect(serializeMention(group)).toBe('@group[Bakers](g-1)');
    expect(serializeMention({ kind: 'person', id: 'ana', name: 'Ana' })).toBe('@[Ana](ana)');
    expect(parseMentions('Ask @group[Bakers](g-1) or @assistant[Helper](bot)')).toEqual([
      { kind: 'text', text: 'Ask ' },
      {
        kind: 'mention',
        text: '@group[Bakers](g-1)',
        id: 'g-1',
        name: 'Bakers',
        mentionKind: 'group',
      },
      { kind: 'text', text: ' or ' },
      {
        kind: 'mention',
        text: '@assistant[Helper](bot)',
        id: 'bot',
        name: 'Helper',
        mentionKind: 'assistant',
      },
    ]);
    expect(() => serializeMention({ kind: 'Team Lead', id: 'x', name: 'X' })).toThrow(
      'Mention kind "Team Lead" is not lower-case words.',
    );
  });

  it('UIC-COMMENT-COMPOSER-2.4 keeps tokens in code spans and after a backslash as text', () => {
    const text =
      'Use `@[Ana](ana)` or ``a ` @[Jon](jon)`` or \\@[Kim](kim), then @[Lee](lee) `open';
    const segments = parseMentions(text);
    expect(segments.map((segment) => segment.text).join('')).toBe(text);
    expect(segments.filter((segment) => segment.kind === 'mention')).toEqual([
      { kind: 'mention', text: '@[Lee](lee)', id: 'lee', name: 'Lee', mentionKind: 'person' },
    ]);
    expect(parseMentions('`@[Ana](ana)')).toEqual([
      { kind: 'text', text: '`' },
      { kind: 'mention', text: '@[Ana](ana)', id: 'ana', name: 'Ana', mentionKind: 'person' },
    ]);
  });

  it('UIC-COMMENT-COMPOSER-2.4 reads long unclosed tokens and backtick runs in linear time', () => {
    const tokens = '@['.repeat(50_000);
    const runs = Array.from({ length: 400 }, (_, index) => `${'`'.repeat(index + 1)}a`).join('');
    const started = performance.now();
    expect(parseMentions(`${tokens} @[Ana](ana)`).at(-1)).toMatchObject({ id: 'ana' });
    expect(parseMentions(runs)).toEqual([{ kind: 'text', text: runs }]);
    expect(performance.now() - started).toBeLessThan(2000);
    const long = 'n'.repeat(257);
    expect(parseMentions(`@[${long}](ana)`)).toEqual([{ kind: 'text', text: `@[${long}](ana)` }]);
  });
});
