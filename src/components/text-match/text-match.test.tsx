import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  findTermRanges,
  findWordMatches,
  isWordMatchAt,
  normalizeMatchText,
  splitMatchTerms,
  textMatchesTerms,
} from './match-ranges.js';
import { TextMatch, TextMatchProvider } from './text-match.js';

describe('text matching helpers', () => {
  it('UIC-TEXT-MATCH-1.1 normalizes case, composition and separators', () => {
    expect(normalizeMatchText('Line-Height/Top_Margin')).toBe('line height top margin');
    expect(normalizeMatchText('Cafe\u0301')).toBe('caf\u00e9');
    expect(normalizeMatchText('İstanbul', { ignoreAccents: true })).toBe('istanbul');
    expect(splitMatchTerms('  Page  size/orientation ')).toEqual(['page', 'size', 'orientation']);
    expect(splitMatchTerms('')).toEqual([]);
  });

  it('UIC-TEXT-MATCH-1.2 finds sorted, merged ranges and requires every term', () => {
    expect(findTermRanges('Apple Orchards', ['orchard'])).toEqual([{ start: 6, end: 13, term: 0 }]);
    expect(findTermRanges('Before and After', ['fore', 'before', 'after'])).toEqual([
      { start: 0, end: 6, term: 1 },
      { start: 11, end: 16, term: 2 },
    ]);
    expect(findTermRanges('aaa', ['aa'])).toEqual([{ start: 0, end: 2, term: 0 }]);
    expect(findTermRanges('pear plum', ['pe', 'ar'])).toEqual([{ start: 0, end: 4, term: 0 }]);
    expect(findTermRanges('Page size', [])).toEqual([]);
    expect(findTermRanges('Page size', [''])).toEqual([]);
    expect(textMatchesTerms('Page orientation', ['page', 'orient'])).toBe(true);
    expect(textMatchesTerms('Page orientation', ['page', 'margin'])).toBe(false);
    expect(textMatchesTerms('Anything', [])).toBe(true);
    expect(textMatchesTerms('Header height', [''])).toBe(false);
    expect(textMatchesTerms('Line-Height', ['line', 'height'])).toBe(true);
  });

  it('UIC-TEXT-MATCH-1.3 matches whole words, and word starts only for longer terms', () => {
    const text = 'Go to the top separator to add Favorites';
    expect(findTermRanges(text, ['to'], { matchWords: true })).toEqual([
      { start: 3, end: 5, term: 0 },
      { start: 24, end: 26, term: 0 },
    ]);
    expect(findTermRanges(text, ['to'])).toHaveLength(4);
    expect(findTermRanges(text, ['fav'], { matchWords: true })).toEqual([
      { start: 31, end: 34, term: 0 },
    ]);
    expect(findTermRanges(text, ['avor'], { matchWords: true })).toEqual([]);
    const normalized = normalizeMatchText(text);
    expect(findWordMatches(normalized, 'to')).toEqual([3, 24]);
    expect(findWordMatches(normalized, '')).toEqual([]);
    expect(isWordMatchAt(normalized, 10, 'top')).toBe(true);
    expect(isWordMatchAt(normalized, 10, 'to')).toBe(false);
    expect(isWordMatchAt(normalized, -1, 'go')).toBe(false);
    expect(findWordMatches('a.b (a+b)', 'a+b')).toEqual([5]);
  });
});

describe('accent-insensitive matching', () => {
  it('UIC-TEXT-MATCH-1.4 folds accents in the text and the query, keeping indexes aligned', () => {
    const options = { ignoreAccents: true };
    expect(normalizeMatchText('Café Señor Über', options)).toBe('cafe senor uber');
    expect(normalizeMatchText('Café', options)).toHaveLength('Café'.length);
    expect(normalizeMatchText('İstanbul', options)).toBe('istanbul');
    expect(normalizeMatchText('Café')).toBe('café');
    expect(splitMatchTerms('CAFÉ  crème', options)).toEqual(['cafe', 'creme']);
    expect(splitMatchTerms('cafe\u0301', options)).toEqual(['cafe']);
    expect(findTermRanges('Café crème', ['cafe'], options)).toEqual([
      { start: 0, end: 4, term: 0 },
    ]);
    expect(findTermRanges('Café crème', ['cafe'])).toEqual([]);
    expect(textMatchesTerms('Crème brûlée', ['creme', 'brulee'], options)).toBe(true);
    expect(textMatchesTerms('Crème brûlée', ['creme'])).toBe(false);
  });

  it('UIC-TEXT-MATCH-1.4 matches composed and decomposed accents alike, in the text and the query', () => {
    const options = { ignoreAccents: true };
    const terms = splitMatchTerms('resume', options);
    expect(textMatchesTerms('r\u00e9sum\u00e9', terms, options)).toBe(true);
    expect(textMatchesTerms('re\u0301sume\u0301', terms, options)).toBe(true);
    expect(textMatchesTerms('re\u0301sume', terms, options)).toBe(true);
    expect(
      textMatchesTerms('re\u0301sume', splitMatchTerms('re\u0301sume\u0301', options), options),
    ).toBe(true);
    expect(findTermRanges('Le re\u0301sume\u0301 final', terms, options)).toEqual([
      { start: 3, end: 11, term: 0 },
    ]);
    // Accent-sensitive matching treats both compositions as the same accented letter.
    expect(textMatchesTerms('re\u0301sume\u0301', splitMatchTerms('r\u00e9sum\u00e9'))).toBe(true);
    expect(findTermRanges('r\u00e9sum\u00e9', ['re\u0301sume\u0301'])).toEqual([
      { start: 0, end: 6, term: 0 },
    ]);
    expect(textMatchesTerms('re\u0301sume\u0301', ['resume'])).toBe(false);
    expect(textMatchesTerms('r\u00e9sum\u00e9', ['resume'])).toBe(false);
  });

  it('UIC-TEXT-MATCH-1.2 UIC-TEXT-MATCH-1.3 keeps whole characters and Unicode words', () => {
    expect(findTermRanges('\u{10400}ab', ['ab'], { matchWords: true })).toEqual([]);
    expect(findTermRanges('cafe\u0301ab', ['ab'], { matchWords: true })).toEqual([]);
    expect(
      findTermRanges('cafe\u0301ab', ['ab'], { matchWords: true, ignoreAccents: true }),
    ).toEqual([]);
    expect(findTermRanges('\u{10400} ab', ['ab'], { matchWords: true })).toEqual([
      { start: 3, end: 5, term: 0 },
    ]);
    expect(findTermRanges('ab\u{10400}', ['ab'], { matchWords: true })).toEqual([]);
    // An astral letter folds to another of the same length; its range spans both code units.
    expect(findTermRanges('x \u{10400}y', ['\u{10428}'])).toEqual([{ start: 2, end: 4, term: 0 }]);
    expect(findTermRanges('Stra\u00dfe', ['stra'])).toEqual([{ start: 0, end: 4, term: 0 }]);
  });

  it('UIC-TEXT-MATCH-1.2 never ends a range between a letter and its combining mark', () => {
    const decomposed = 'cafe\u0301 noir';
    // Without ignoreAccents a match that would stop before the mark does not count at all.
    expect(findTermRanges(decomposed, ['cafe'])).toEqual([]);
    expect(findTermRanges(decomposed, ['cafe', 'noir'], { ignoreAccents: true })).toEqual([
      { start: 0, end: 5, term: 0 },
      { start: 6, end: 10, term: 1 },
    ]);
  });
});

describe('TextMatch', () => {
  it('UIC-TEXT-MATCH-2.1 marks every hit of the provider terms', () => {
    const { container, rerender } = render(
      <TextMatchProvider query="size">
        <TextMatch>Page size</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe('Page <mark data-term="0" class="ui-text-match">size</mark>');
    expectHooksMatchSpec(container, 'TEXT-MATCH');

    rerender(
      <TextMatchProvider query="e">
        <TextMatch>Page size</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe(
      'Pag<mark data-term="0" class="ui-text-match">e</mark> siz<mark data-term="0" class="ui-text-match">e</mark>',
    );

    rerender(
      <TextMatchProvider query="line HEIGHT">
        <TextMatch>Line-Height</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe(
      '<mark data-term="0" class="ui-text-match">Line</mark>-<mark data-term="1" class="ui-text-match">Height</mark>',
    );
  });

  it('UIC-TEXT-MATCH-1.3 UIC-TEXT-MATCH-2.1 honours word matching from the provider', () => {
    const { container } = render(
      <TextMatchProvider query="to" matchWords>
        <TextMatch>top to</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe('top <mark data-term="0" class="ui-text-match">to</mark>');
  });

  it('UIC-TEXT-MATCH-2.1 appends the caller class and data attributes to every mark', () => {
    const { container } = render(
      <TextMatchProvider query="an">
        <TextMatch className="caller" data-testid="hit">
          Banana
        </TextMatch>
      </TextMatchProvider>,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveClass('ui-text-match', 'caller');
    expect(marks[0]).toHaveAttribute('data-testid', 'hit');
    expect(marks[0]).toHaveTextContent('anan');
    expectHooksMatchSpec(container, 'TEXT-MATCH');
  });

  it('UIC-TEXT-MATCH-1.4 counts decomposed accents the same as composed ones without ignoreAccents', () => {
    const composed = 'Caf\u00e9 au lait';
    const decomposed = 'Cafe\u0301 au lait';
    expect(textMatchesTerms(decomposed, ['cafe'])).toBe(textMatchesTerms(composed, ['cafe']));
    expect(textMatchesTerms(decomposed, ['cafe'])).toBe(false);
    expect(findTermRanges(decomposed, ['cafe'])).toEqual([]);
    expect(textMatchesTerms('Cafe cafe\u0301', ['cafe'])).toBe(true);
    expect(findTermRanges('cafe\u0301 cafe', ['cafe'])).toEqual([{ start: 6, end: 10, term: 0 }]);
    expect(textMatchesTerms(decomposed, ['cafe\u0301'])).toBe(true);
    // With ignoreAccents the mark folds away and the range takes it in.
    expect(findTermRanges(decomposed, ['cafe'], { ignoreAccents: true })).toEqual([
      { start: 0, end: 5, term: 0 },
    ]);
  });

  it('UIC-TEXT-MATCH-1.4 marks accented text from an unaccented query on request', () => {
    const { container, rerender } = render(
      <TextMatchProvider query="creme" ignoreAccents>
        <TextMatch>Crème brûlée</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.querySelector('mark')).toHaveTextContent('Crème');
    rerender(
      <TextMatchProvider query="creme">
        <TextMatch>Crème brûlée</TextMatch>
      </TextMatchProvider>,
    );
    expect(container.querySelector('mark')).toBeNull();
  });

  it('UIC-TEXT-MATCH-2.5 names the matched term on each mark', () => {
    const { container } = render(
      <TextMatchProvider query="apple pie">
        <TextMatch>Pie with apple, and apple pie</TextMatch>
      </TextMatchProvider>,
    );
    const marks = Array.from(container.querySelectorAll('mark'), (mark) => [
      mark.textContent,
      mark.getAttribute('data-term'),
    ]);
    expect(marks).toEqual([
      ['Pie', '1'],
      ['apple', '0'],
      ['apple', '0'],
      ['pie', '1'],
    ]);
    expectHooksMatchSpec(container, 'TEXT-MATCH');
  });

  it('UIC-TEXT-MATCH-2.2 returns the plain string without a provider, terms or a hit', () => {
    const plain = '<span>Page size</span>';
    const { container, rerender } = render(
      <span>
        <TextMatch>Page size</TextMatch>
      </span>,
    );
    expect(container.innerHTML).toBe(plain);
    rerender(
      <TextMatchProvider query="   ">
        <span>
          <TextMatch>Page size</TextMatch>
        </span>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe(plain);
    rerender(
      <TextMatchProvider query="margin">
        <span>
          <TextMatch>Page size</TextMatch>
        </span>
      </TextMatchProvider>,
    );
    expect(container.innerHTML).toBe(plain);
    expect(container.querySelector('span')?.childNodes).toHaveLength(1);
  });

  it('UIC-TEXT-MATCH-2.3 registers texts with the provider and unregisters them', () => {
    const registered = new Set<string>();
    const registerText = (text: string) => {
      registered.add(text);
      return () => {
        registered.delete(text);
      };
    };
    const labels = (texts: string[]) => (
      <TextMatchProvider registerText={registerText}>
        {texts.map((text) => (
          <span key={text}>
            <TextMatch>{text}</TextMatch>
          </span>
        ))}
      </TextMatchProvider>
    );
    const { container, rerender, unmount } = render(labels(['Name', 'Key']));
    expect([...registered].sort()).toEqual(['Key', 'Name']);
    expect(container.innerHTML).toBe('<span>Name</span><span>Key</span>');
    rerender(labels(['Name']));
    expect([...registered]).toEqual(['Name']);
    act(() => unmount());
    expect([...registered]).toEqual([]);
  });

  it('UIC-TEXT-MATCH-2.3 re-registers a label whose text changes', () => {
    const events: string[] = [];
    const registerText = (text: string) => {
      events.push(`+${text}`);
      return () => events.push(`-${text}`);
    };
    const { rerender } = render(
      <TextMatchProvider registerText={registerText}>
        <TextMatch>Plum</TextMatch>
      </TextMatchProvider>,
    );
    rerender(
      <TextMatchProvider registerText={registerText}>
        <TextMatch>Pear</TextMatch>
      </TextMatchProvider>,
    );
    expect(events).toEqual(['+Plum', '-Plum', '+Pear']);
  });

  it('UIC-TEXT-MATCH-2.4 keeps the accessible name of the labelled control', () => {
    render(
      <TextMatchProvider query="fix">
        <label>
          <TextMatch>Prefix</TextMatch>
          <input />
        </label>
        <button type="button">
          <TextMatch>Fixed width</TextMatch>
        </button>
      </TextMatchProvider>,
    );
    expect(screen.getByRole('textbox', { name: 'Prefix' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed width' })).toBeInTheDocument();
    expect(document.querySelector('[role], [aria-live]')).toBeNull();
    expect(document.querySelectorAll('mark')).toHaveLength(2);
  });

  it('UIC-TEXT-MATCH-2.3 passes the enclosing query through while inherited', () => {
    render(
      <TextMatchProvider query="app">
        <TextMatchProvider query="ban" isInherited>
          <TextMatch>Apple and banana</TextMatch>
        </TextMatchProvider>
      </TextMatchProvider>,
    );
    expect(Array.from(document.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      'App',
    ]);
  });
});
