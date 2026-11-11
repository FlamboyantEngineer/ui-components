import { describe, expect, it } from 'vitest';
import { parseMentions, serializeMention } from './comment-mentions.js';

describe('comment mention tokens', () => {
  it('UIC-COMMENT-COMPOSER-2.3 writes a person as @[Name](id)', () => {
    expect(serializeMention({ id: 'ana', name: 'Ana Lopez' })).toBe('@[Ana Lopez](ana)');
  });

  it('UIC-COMMENT-COMPOSER-2.3 splits text into runs and mentions', () => {
    expect(parseMentions('Hi @[Ana Lopez](ana) and @[Jon](j-1)!')).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'mention', text: '@[Ana Lopez](ana)', id: 'ana', name: 'Ana Lopez' },
      { kind: 'text', text: ' and ' },
      { kind: 'mention', text: '@[Jon](j-1)', id: 'j-1', name: 'Jon' },
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
      { kind: 'mention', text: token, ...person },
      { kind: 'text', text: 'y' },
    ]);
  });
});
