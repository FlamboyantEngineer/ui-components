import { describe, expect, it } from 'vitest';
import { matchCompletions, scoreCompletion } from '../completion-list/completion-list.js';
import { indentInsertion, parseSnippet } from './completion-match.js';

const labels = (query: string, names: string[]) =>
  matchCompletions(
    names.map((label) => ({ label })),
    query,
  ).map(({ label }) => label);

describe('completion matching', () => {
  it('UIC-CODE-EDITOR-4.1 ranks prefixes first, then scattered matches from a word start', () => {
    expect(scoreCompletion('fruit.apple', 'FRU')).toBe(0);
    expect(scoreCompletion('fruit.apple', 'apple')).toBe(1);
    expect(scoreCompletion('fruitBasket', 'bas')).toBe(1);
    expect(scoreCompletion('fruit.apple', 'frap')).toBe(2);
    expect(scoreCompletion('fruit.apple', 'ruit')).toBeNull();
    expect(scoreCompletion('city', 'xyz')).toBeNull();
    expect(labels('ap', ['map.apply', 'apricot', 'grape', 'apple'])).toEqual([
      'apricot',
      'apple',
      'map.apply',
    ]);
    expect(labels('apple', ['apple', 'apples'])).toEqual(['apples']);
    expect(labels('', ['b', 'a'])).toEqual(['b', 'a']);
  });

  it('UIC-CODE-EDITOR-4.8 reads snippet fields and indents the lines after the first', () => {
    expect(parseSnippet('pick(${fruit}, ${})')).toEqual({
      text: 'pick(fruit, )',
      fields: [
        { start: 5, end: 10 },
        { start: 12, end: 12 },
      ],
    });
    expect(parseSnippet('plain')).toEqual({ text: 'plain', fields: [] });
    const block = parseSnippet('if (${test}) {\n  ${}\n}');
    expect(indentInsertion(block, '    ')).toEqual({
      text: 'if (test) {\n      \n    }',
      fields: [
        { start: 4, end: 8 },
        { start: 18, end: 18 },
      ],
    });
    expect(indentInsertion(block, '')).toBe(block);
  });
});
