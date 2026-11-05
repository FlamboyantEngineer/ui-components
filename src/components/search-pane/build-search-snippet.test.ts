import { describe, expect, it } from 'vitest';
import { buildSearchSnippet, type SearchSnippetData } from './build-search-snippet.js';

/** The snippet for the first `match` in `source`. */
function snippetOf(source: string, match: string, options = {}): SearchSnippetData {
  const start = source.indexOf(match);
  return buildSearchSnippet({ source, start, end: start + match.length }, options);
}

/** The snippet's text as it reads, with its ellipses. */
function read(snippet: SearchSnippetData): string {
  const { lead, near, match, after, isStartOmitted, isEndOmitted } = snippet;
  return `${isStartOmitted ? '…' : ''}${lead}${near}[${match}]${after}${isEndOmitted ? '…' : ''}`;
}

const passage =
  'Peel the pears and cut each one in half, then poach the halves in a light syrup until a ' +
  'knife slides in easily, and lay them on the tart before glazing them with warm apricot jam.';

describe('buildSearchSnippet', () => {
  it('UIC-SEARCH-PANE-4.1 keeps the whole source when it fits, with no ellipsis', () => {
    const snippet = snippetOf('Poach the pears gently.', 'pears');
    expect(read(snippet)).toBe('Poach the [pears] gently.');
    expect(snippet).toMatchObject({
      start: 0,
      end: 23,
      isStartOmitted: false,
      isEndOmitted: false,
    });
    expect(snippet.near).toBe('the ');
    expect(snippet.lead).toBe('Poach ');
  });

  it('UIC-SEARCH-PANE-4.1 cuts the context at whole words and reports the source offsets', () => {
    const snippet = snippetOf(passage, 'syrup', { beforeLength: 20, afterLength: 22 });
    expect(read(snippet)).toBe('…halves in a light [syrup] until a knife slides…');
    expect(passage.slice(snippet.start, snippet.end)).toBe(
      'halves in a light syrup until a knife slides',
    );
    expect(snippet.near).toBe('light ');
    expect(snippet.lead).toBe('halves in a ');
  });

  it('UIC-SEARCH-PANE-4.1 writes line breaks and space runs as one space, on one line', () => {
    const source = 'First line ends\n\n   and   the next\tline goes on';
    const snippet = snippetOf(source, 'the next\tline');
    expect(read(snippet)).toBe('First line ends and [the next line] goes on');
    expect(snippet.after).toBe(' goes on');
    const spaced = snippetOf('word \n match', ' \n match');
    expect(read(spaced)).toBe('word[ match]');
  });

  it('UIC-SEARCH-PANE-4.1 keeps the source spaces beside the match and invents none', () => {
    expect(read(snippetOf('pears, then plums', 'then'))).toBe('pears, [then] plums');
    expect(read(snippetOf('pears,then plums', 'then'))).toBe('pears,[then] plums');
    expect(read(snippetOf('(pears)', 'pears'))).toBe('([pears])');
  });

  it('UIC-SEARCH-PANE-4.1 shows a match inside a word with the rest of the word', () => {
    const snippet = snippetOf('the unpeeled pear', 'peel');
    expect(read(snippet)).toBe('the un[peel]ed pear');
    expect(snippet.near).toBe('the un');
  });

  it('UIC-SEARCH-PANE-4.1 stops at the document boundaries without ellipses', () => {
    expect(read(snippetOf('pears are ripe', 'pears'))).toBe('[pears] are ripe');
    expect(read(snippetOf('ripe pears', 'pears'))).toBe('ripe [pears]');
    const all = snippetOf('pears', 'pears');
    expect(all).toMatchObject({ lead: '', near: '', after: '', start: 0, end: 5 });
  });

  it('UIC-SEARCH-PANE-4.1 cuts a word too long to keep whole, with an ellipsis', () => {
    const long = `${'x'.repeat(60)}needle${'y'.repeat(60)}`;
    const snippet = snippetOf(long, 'needle', { beforeLength: 10, afterLength: 10 });
    expect(read(snippet)).toBe(`…${'x'.repeat(10)}[needle]${'y'.repeat(10)}…`);
  });

  it('UIC-SEARCH-PANE-4.1 never splits a grapheme or surrogate pair when it cuts', () => {
    const emoji = '👩‍👩‍👧';
    const source = `${emoji.repeat(6)}match${emoji.repeat(6)}`;
    const snippet = snippetOf(source, 'match', { beforeLength: 9, afterLength: 9 });
    expect(snippet.isStartOmitted).toBe(true);
    expect(snippet.isEndOmitted).toBe(true);
    expect(snippet.near.length % emoji.length).toBe(0);
    expect(snippet.after.length % emoji.length).toBe(0);
    expect(snippet.near.length).toBeLessThanOrEqual(9);
  });

  it('UIC-SEARCH-PANE-4.1 cuts Unicode text at word boundaries', () => {
    const snippet = snippetOf('Les poires mûres sont cuites à feu doux.', 'cuites', {
      beforeLength: 12,
      afterLength: 8,
    });
    expect(read(snippet)).toBe('…mûres sont [cuites] à feu…');
  });

  it('UIC-SEARCH-PANE-4.1 clamps offsets outside the source', () => {
    const snippet = buildSearchSnippet({ source: 'pears', start: -4, end: 99 });
    expect(snippet).toMatchObject({ match: 'pears', start: 0, end: 5 });
  });
});
