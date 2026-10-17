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
import { TextMatch, TextMatchScope } from './text-match.js';

describe('text matching helpers', () => {
  it('UIC-TEXT-MATCH-1.1 normalizes case and separators without moving indexes', () => {
    expect(normalizeMatchText('Line-Height/Top_Margin')).toBe('line height top margin');
    expect(normalizeMatchText('Line-Height')).toHaveLength('Line-Height'.length);
    expect(normalizeMatchText('İstanbul')).toHaveLength('İstanbul'.length);
    expect(splitMatchTerms('  Page  size/orientation ')).toEqual(['page', 'size', 'orientation']);
    expect(splitMatchTerms('')).toEqual([]);
  });

  it('UIC-TEXT-MATCH-1.2 finds sorted, merged ranges and requires every term', () => {
    expect(findTermRanges('Apple Orchards', ['orchard'])).toEqual([{ start: 6, end: 13 }]);
    expect(findTermRanges('Before and After', ['fore', 'before', 'after'])).toEqual([
      { start: 0, end: 6 },
      { start: 11, end: 16 },
    ]);
    expect(findTermRanges('aaa', ['aa'])).toEqual([{ start: 0, end: 2 }]);
    expect(findTermRanges('pear plum', ['pe', 'ar'])).toEqual([{ start: 0, end: 4 }]);
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
      { start: 3, end: 5 },
      { start: 24, end: 26 },
    ]);
    expect(findTermRanges(text, ['to'])).toHaveLength(4);
    expect(findTermRanges(text, ['fav'], { matchWords: true })).toEqual([{ start: 31, end: 34 }]);
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

describe('TextMatch', () => {
  it('UIC-TEXT-MATCH-2.1 marks every hit of the scope terms', () => {
    const { container, rerender } = render(
      <TextMatchScope query="size">
        <TextMatch>Page size</TextMatch>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe('Page <mark class="ui-text-match">size</mark>');
    expectHooksMatchSpec(container, 'TEXT-MATCH');

    rerender(
      <TextMatchScope query="e">
        <TextMatch>Page size</TextMatch>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe(
      'Pag<mark class="ui-text-match">e</mark> siz<mark class="ui-text-match">e</mark>',
    );

    rerender(
      <TextMatchScope query="line HEIGHT">
        <TextMatch>Line-Height</TextMatch>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe(
      '<mark class="ui-text-match">Line</mark>-<mark class="ui-text-match">Height</mark>',
    );
  });

  it('UIC-TEXT-MATCH-1.3 UIC-TEXT-MATCH-2.1 honours word matching from the scope', () => {
    const { container } = render(
      <TextMatchScope query="to" matchWords>
        <TextMatch>top to</TextMatch>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe('top <mark class="ui-text-match">to</mark>');
  });

  it('UIC-TEXT-MATCH-2.1 appends the caller class and data attributes to every mark', () => {
    const { container } = render(
      <TextMatchScope query="an">
        <TextMatch className="caller" data-testid="hit">
          Banana
        </TextMatch>
      </TextMatchScope>,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveClass('ui-text-match', 'caller');
    expect(marks[0]).toHaveAttribute('data-testid', 'hit');
    expect(marks[0]).toHaveTextContent('anan');
    expectHooksMatchSpec(container, 'TEXT-MATCH');
  });

  it('UIC-TEXT-MATCH-2.2 returns the plain string without a scope, terms or a hit', () => {
    const plain = '<span>Page size</span>';
    const { container, rerender } = render(
      <span>
        <TextMatch>Page size</TextMatch>
      </span>,
    );
    expect(container.innerHTML).toBe(plain);
    rerender(
      <TextMatchScope query="   ">
        <span>
          <TextMatch>Page size</TextMatch>
        </span>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe(plain);
    rerender(
      <TextMatchScope query="margin">
        <span>
          <TextMatch>Page size</TextMatch>
        </span>
      </TextMatchScope>,
    );
    expect(container.innerHTML).toBe(plain);
    expect(container.querySelector('span')?.childNodes).toHaveLength(1);
  });

  it('UIC-TEXT-MATCH-2.3 registers texts with the scope and unregisters them', () => {
    const registered = new Set<string>();
    const registerText = (text: string) => {
      registered.add(text);
      return () => {
        registered.delete(text);
      };
    };
    const labels = (texts: string[]) => (
      <TextMatchScope registerText={registerText}>
        {texts.map((text) => (
          <span key={text}>
            <TextMatch>{text}</TextMatch>
          </span>
        ))}
      </TextMatchScope>
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
      <TextMatchScope registerText={registerText}>
        <TextMatch>Plum</TextMatch>
      </TextMatchScope>,
    );
    rerender(
      <TextMatchScope registerText={registerText}>
        <TextMatch>Pear</TextMatch>
      </TextMatchScope>,
    );
    expect(events).toEqual(['+Plum', '-Plum', '+Pear']);
  });

  it('UIC-TEXT-MATCH-2.4 keeps the accessible name of the labelled control', () => {
    render(
      <TextMatchScope query="fix">
        <label>
          <TextMatch>Prefix</TextMatch>
          <input />
        </label>
        <button type="button">
          <TextMatch>Fixed width</TextMatch>
        </button>
      </TextMatchScope>,
    );
    expect(screen.getByRole('textbox', { name: 'Prefix' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed width' })).toBeInTheDocument();
    expect(document.querySelector('[role], [aria-live]')).toBeNull();
    expect(document.querySelectorAll('mark')).toHaveLength(2);
  });
});
