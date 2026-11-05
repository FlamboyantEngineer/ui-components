import { describe, expect, it } from 'vitest';
import { formatMessage, toSelectKey } from './message-format.js';

describe('formatMessage', () => {
  it('UIC-PROVIDER-3.4 picks plural branches by the locale rules, exact values first', () => {
    const message = '{count, plural, =0 {No files} one {# file} other {# files}}';
    expect([0, 1, 2, 1500].map((count) => formatMessage(message, { count }))).toEqual([
      'No files',
      '1 file',
      '2 files',
      '1,500 files',
    ]);
    const french = '{count, plural, one {# fichier} other {# fichiers}}';
    expect(formatMessage(french, { count: 1.5 }, 'fr-FR')).toBe('1,5 fichier');
    expect(formatMessage('{count, plural, other {# 件}}', { count: 3 }, 'ja-JP')).toBe('3 件');
  });

  it('UIC-PROVIDER-3.4 reads lists, booleans and missing values', () => {
    const items = ['Ana', 'Ben', 'Chloé'];
    expect(formatMessage('{names}', { names: items })).toBe('Ana, Ben, and Chloé');
    expect(formatMessage('{names}', { names: { items, type: 'or' } }, 'es-ES')).toBe(
      'Ana, Ben o Chloé',
    );
    expect(formatMessage('{names}', { names: { items, type: 'unit' } })).toBe('Ana, Ben, Chloé');
    expect(formatMessage('{names}', { names: items }, 'ja-JP')).toBe('Ana、Ben、Chloé');
    const muted = '{isMuted, select, true {muted} other {on}}';
    expect([true, false].map((isMuted) => formatMessage(muted, { isMuted }))).toEqual([
      'muted',
      'on',
    ]);
    expect(formatMessage('[{name}]', { name: undefined })).toBe('[]');
  });

  it('UIC-PROVIDER-3.1 keeps apostrophes and tags as text and throws on a malformed message', () => {
    expect(formatMessage("It's <b>{name}</b>", { name: 'done' })).toBe("It's <b>done</b>");
    expect(formatMessage("'{name}' is literal")).toBe('{name} is literal');
    expect(() => formatMessage('{count, plural, one {# file}')).toThrow();
  });

  it('UIC-PROVIDER-3.6 reads undefined and null arguments as empty and throws on omitted ones', () => {
    const choice = '{state, select, done {Done} other {Open}}';
    const count = '{count, plural, one {# file} other {# files}}';
    for (const empty of [undefined, null]) {
      expect(formatMessage('Hello {name}', { name: empty })).toBe('Hello ');
      expect(formatMessage(choice, { state: empty })).toBe('Open');
      expect(formatMessage(count, { count: empty })).toBe('0 files');
    }
    for (const message of ['Hello {name}', choice, count]) {
      expect(() => formatMessage(message, {})).toThrow(/was not provided/);
    }
    expect(() => formatMessage('Hello {name}', { nmae: 'Ana' })).toThrow(/"name"/);
  });

  it('UIC-PROVIDER-3.6 reads only the own entries of values, whatever their names', () => {
    for (const name of ['toString', 'constructor', '__proto__']) {
      expect(() => formatMessage(`{${name}}`)).toThrow(/was not provided/);
      expect(formatMessage(`{${name}}`, Object.fromEntries([[name, 'hello']]))).toBe('hello');
      expect(formatMessage(`<{${name}}>`, Object.fromEntries([[name, null]]))).toBe('<>');
    }
  });

  it('UIC-PROVIDER-3.1 turns kebab-case values into select branch names', () => {
    expect(toSelectKey('in-progress')).toBe('inProgress');
    expect(toSelectKey('done')).toBe('done');
  });
});
