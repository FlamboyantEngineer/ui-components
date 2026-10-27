import { describe, expect, it } from 'vitest';
import { formatMessage, toMessageList, toSelectKey } from './message-format.js';

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
    expect(formatMessage('{names}', { names: toMessageList(items, 'or') }, 'es-ES')).toBe(
      'Ana, Ben o Chloé',
    );
    expect(formatMessage('{names}', { names: toMessageList(items, 'unit') })).toBe(
      'Ana, Ben, Chloé',
    );
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

  it('UIC-PROVIDER-3.1 turns kebab-case values into select branch names', () => {
    expect(toSelectKey('in-progress')).toBe('inProgress');
    expect(toSelectKey('done')).toBe('done');
  });
});
