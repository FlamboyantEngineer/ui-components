import { describe, expect, it } from 'vitest';
import {
  type CommandMatcher,
  type CommandPaletteEntry,
  rankCommands,
  resolveCommandPage,
  toMenuEntries,
} from './command-palette-entries.js';

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const match: CommandMatcher = {
  startsWith: (text, query) => fold(text).startsWith(fold(query)),
  contains: (text, query) => fold(text).includes(fold(query)),
};

function labels(entries: readonly CommandPaletteEntry[]): string[] {
  return entries.flatMap((entry) =>
    entry.type === 'section'
      ? [`[${entry.title ?? ''}]`, ...labels(entry.items)]
      : entry.type === 'separator'
        ? ['---']
        : [entry.label],
  );
}

const entries: CommandPaletteEntry[] = [
  { id: 'theme', label: 'Change theme', keywords: ['appearance', 'dark mode'] },
  { id: 'them', label: 'Them' },
  { id: 'export', label: 'Export theme files', isDisabled: true },
  { id: 'mathematics', label: 'Mathematics' },
  { type: 'separator', id: 'rule' },
  {
    type: 'section',
    id: 'go',
    title: 'Go to',
    items: [
      { id: 'home', label: 'Home' },
      { id: 'themes', label: 'Thèmes', commands: [{ id: 'light', label: 'Light' }] },
    ],
  },
];

describe('command palette entries', () => {
  it('UIC-COMMAND-PALETTE-2.7 finds a command by a keyword it does not show', () => {
    expect(labels(rankCommands(entries, { query: 'appear', match }))).toEqual(['Change theme']);
    expect(labels(rankCommands(entries, { query: 'DARK', match }))).toEqual(['Change theme']);
  });

  it('UIC-COMMAND-PALETTE-2.7 ranks whole, starting, word-starting and inner label matches, then keywords, ties in order', () => {
    expect(labels(rankCommands(entries, { query: 'them', match }))).toEqual([
      'Them',
      'Change theme',
      'Export theme files',
      'Mathematics',
      '[Go to]',
      'Thèmes',
    ]);
    expect(labels(rankCommands(entries, { query: '  ', match }))).toEqual(labels(entries));
    expect(rankCommands(entries, { query: 'zzz', match })).toEqual([]);
  });

  it('UIC-COMMAND-PALETTE-2.7 lets a filter keep or drop by label and keywords, in the given order', () => {
    const exact = (text: string, input: string) => text === input;
    expect(labels(rankCommands(entries, { query: 'appearance', match, filter: exact }))).toEqual([
      'Change theme',
    ]);
  });

  it('UIC-COMMAND-PALETTE-2.8 resolves a page path as far as its branches exist', () => {
    expect(labels(resolveCommandPage(entries, ['themes']).entries)).toEqual(['Light']);
    expect(resolveCommandPage(entries, ['themes']).pages).toEqual([
      { id: 'themes', label: 'Thèmes' },
    ]);
    expect(resolveCommandPage(entries, ['gone', 'themes']).pages).toEqual([]);
    expect(resolveCommandPage(entries, ['home']).pages).toEqual([]);
    const menu = toMenuEntries(entries);
    expect(menu[0]).not.toHaveProperty('keywords');
    const section = menu[5];
    expect(section?.type === 'section' ? section.items[1] : null).toMatchObject({
      id: 'themes',
      shouldCloseOnSelect: false,
    });
  });
});
