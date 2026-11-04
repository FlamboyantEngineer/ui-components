import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import type { FilterField } from '../filter-bar/filter-bar.js';
import {
  type ConditionGroup,
  type ConditionRule,
  copyConditionNode,
  createConditionMatcher,
  findConditionNode,
  matchesConditionGroup,
  moveConditionNode,
  removeConditionNode,
  replaceConditionNode,
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
    const copy = copyConditionNode(requireDefined(tree.rules[1]), () => `copy-${(count += 1)}`);
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

  it('UIC-CONDITION-BUILDER-2.2 resolves fields once and reads only active values per record', () => {
    const reads = vi.fn();
    const fields = new Proxy<FilterField[]>(
      [
        { id: 'pages', label: 'Pages', type: 'number' },
        { id: 'genre', label: 'Genre', type: 'choice' },
        { id: 'title', label: 'Title', type: 'text' },
      ],
      {
        get(target, property, receiver) {
          reads(property);
          return Reflect.get(target, property, receiver) as unknown;
        },
      },
    );
    const group: ConditionGroup = {
      type: 'group',
      id: 'root',
      combinator: 'and',
      rules: [
        { type: 'rule', id: 'long', field: 'pages', operator: 'at-least', value: 400 },
        {
          type: 'group',
          id: 'kinds',
          combinator: 'or',
          rules: [
            { type: 'rule', id: 'h', field: 'genre', operator: 'any-of', value: ['history'] },
            { type: 'rule', id: 'blank', field: 'title', operator: 'contains', value: '' },
            { type: 'rule', id: 'unknown', field: 'colour', operator: 'equals', value: 'red' },
          ],
        },
      ],
    };
    const books = [
      { title: 'Long history', pages: 520, genre: 'history' },
      { title: 'Long travel', pages: 480, genre: 'travel' },
      { title: 'Short history', pages: 120, genre: 'history' },
    ];
    const getValue = vi.fn(
      (book: (typeof books)[number], id: string) => book[id as keyof typeof book],
    );
    const matches = createConditionMatcher({ group, fields, getValue });
    reads.mockClear();
    expect(books.filter(matches).map((book) => book.title)).toEqual(['Long history']);
    expect(reads).not.toHaveBeenCalled();
    expect(new Set(getValue.mock.calls.map(([, id]) => id))).toEqual(new Set(['pages', 'genre']));
    const options = { fields, getValue };
    expect(books.map((book) => matchesConditionGroup(book, group, options))).toEqual(
      books.map(matches),
    );
    const none = createConditionMatcher({ group: { ...group, rules: [] }, fields, getValue });
    expect(books.every(none)).toBe(true);
  });
});
