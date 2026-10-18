import { describe, expect, it } from 'vitest';
import type { FilterField } from '../filter-bar/filter-bar.js';
import {
  copyConditionNode,
  findConditionNode,
  matchesConditionGroup,
  moveConditionNode,
  removeConditionNode,
  replaceConditionNode,
  type ConditionGroup,
  type ConditionRule,
} from './condition-tree.js';

const rule = (id: string, value = 1): ConditionRule => ({
  type: 'rule',
  id,
  field: 'pages',
  operator: 'at-least',
  value,
});

const tree: ConditionGroup = {
  type: 'group',
  id: 'root',
  combinator: 'and',
  rules: [
    rule('a'),
    { type: 'group', id: 'g', combinator: 'or', rules: [rule('b'), rule('c')] },
    rule('d'),
  ],
};

const ids = (group: ConditionGroup): unknown[] =>
  group.rules.map((node) => (node.type === 'group' ? [node.id, ids(node)] : node.id));

describe('condition tree', () => {
  it('UIC-CONDITION-BUILDER-1.1 finds and replaces nodes at any depth', () => {
    expect(findConditionNode(tree, 'c')).toBe((tree.rules[1] as ConditionGroup).rules[1]);
    expect(findConditionNode(tree, 'root')).toBe(tree);
    expect(findConditionNode(tree, 'missing')).toBeUndefined();
    const next = replaceConditionNode(tree, 'c', rule('c', 9));
    expect((findConditionNode(next, 'c') as ConditionRule).value).toBe(9);
    expect(next.rules[0]).toBe(tree.rules[0]);
    expect(replaceConditionNode(tree, 'root', { ...tree, combinator: 'or' }).combinator).toBe('or');
  });

  it('UIC-CONDITION-BUILDER-1.5 removes, moves and copies nodes', () => {
    expect(ids(removeConditionNode(tree, 'b'))).toEqual(['a', ['g', ['c']], 'd']);
    expect(ids(moveConditionNode(tree, 'a', 1))).toEqual([['g', ['b', 'c']], 'a', 'd']);
    expect(ids(moveConditionNode(tree, 'c', -1))).toEqual(['a', ['g', ['c', 'b']], 'd']);
    expect(ids(moveConditionNode(tree, 'd', 1))).toEqual(ids(tree));
    let count = 0;
    const copy = copyConditionNode(tree.rules[1]!, () => `copy-${(count += 1)}`);
    expect(copy).toEqual({
      type: 'group',
      id: 'copy-1',
      combinator: 'or',
      rules: [rule('copy-2'), rule('copy-3')],
    });
  });

  it('UIC-CONDITION-BUILDER-2.1 evaluates all and any groups, leaving inactive nodes out', () => {
    const fields: FilterField[] = [
      { id: 'pages', label: 'Pages', type: 'number' },
      { id: 'genre', label: 'Genre', type: 'choice' },
    ];
    const books = [
      { title: 'Short history', pages: 120, genre: 'history' },
      { title: 'Long history', pages: 520, genre: 'history' },
      { title: 'Long travel', pages: 480, genre: 'travel' },
      { title: 'Short cooking', pages: 90, genre: 'cooking' },
    ];
    const query: ConditionGroup = {
      type: 'group',
      id: 'root',
      combinator: 'and',
      rules: [
        { type: 'rule', id: 'long', field: 'pages', operator: 'at-least', value: 400 },
        {
          type: 'group',
          id: 'either',
          combinator: 'or',
          rules: [
            { type: 'rule', id: 'h', field: 'genre', operator: 'any-of', value: ['history'] },
            { type: 'rule', id: 't', field: 'genre', operator: 'any-of', value: ['travel'] },
            { type: 'rule', id: 'x', field: 'genre', operator: 'any-of', value: [] },
          ],
        },
        { type: 'group', id: 'empty', combinator: 'or', rules: [] },
        { type: 'rule', id: 'unknown', field: 'colour', operator: 'equals', value: 'red' },
      ],
    };
    const options = {
      fields,
      getValue: (book: (typeof books)[number], id: string) => book[id as keyof typeof book],
    };
    const titles = (group: ConditionGroup) =>
      books.filter((book) => matchesConditionGroup(book, group, options)).map((book) => book.title);
    expect(titles(query)).toEqual(['Long history', 'Long travel']);
    expect(titles({ ...query, combinator: 'or' })).toEqual([
      'Short history',
      'Long history',
      'Long travel',
    ]);
    expect(titles({ ...query, rules: [] })).toHaveLength(4);
  });
});
