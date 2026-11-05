import { describe, expect, it } from 'vitest';
import {
  chooseRelation,
  listRelationTrail,
  type RelationDirection,
  resolveRelationColumns,
} from './relation-columns-model.js';

interface Node {
  id: string;
}

const links: Record<string, Partial<Record<RelationDirection, string[]>>> = {
  goal: { downstream: ['need'] },
  need: { upstream: ['goal'], downstream: ['spec', 'plan'] },
  spec: { upstream: ['need'], downstream: ['test'] },
  plan: { upstream: ['need'] },
  test: { upstream: ['spec'] },
};
const getRelated = (node: Node, direction: RelationDirection) =>
  (links[node.id]?.[direction] ?? []).map((id) => ({ id }));
const ids = (nodes: readonly Node[]) => nodes.map((node) => node.id);

describe('relation columns model', () => {
  it('UIC-RELATION-COLUMNS-1.2 lays out the columns of a path in reading order', () => {
    const columns = resolveRelationColumns({
      item: { id: 'need' },
      path: { upstream: ['goal'], downstream: ['spec'] },
      getRelated,
    });
    expect(columns.map((column) => [column.direction, column.depth, column.source.id])).toEqual([
      ['upstream', 2, 'goal'],
      ['upstream', 1, 'need'],
      ['item', 0, 'need'],
      ['downstream', 1, 'need'],
      ['downstream', 2, 'spec'],
    ]);
    expect(columns.map((column) => ids(column.items))).toEqual([
      [],
      ['goal'],
      ['need'],
      ['spec', 'plan'],
      ['test'],
    ]);
    expect(columns.map((column) => column.selectedKey)).toEqual([null, 'goal', null, 'spec', null]);
    expect(ids(listRelationTrail(columns).map((step) => step.item))).toEqual([
      'goal',
      'need',
      'spec',
    ]);
  });

  it('UIC-RELATION-COLUMNS-1.2 stops a side at the first key that is not related', () => {
    const columns = resolveRelationColumns({
      item: { id: 'need' },
      path: { upstream: [], downstream: ['plan', 'test'] },
      getRelated,
    });
    expect(columns.map((column) => `${column.direction}${column.depth}`)).toEqual([
      'upstream1',
      'item0',
      'downstream1',
      'downstream2',
    ]);
    expect(columns[3]?.items).toEqual([]);
    const lost = resolveRelationColumns({
      item: { id: 'need' },
      path: { upstream: ['nobody'], downstream: [] },
      getRelated,
    });
    expect(lost).toHaveLength(3);
    expect(lost[0]?.selectedKey).toBeNull();
  });

  it('UIC-RELATION-COLUMNS-1.3 chooses an item and drops the choices beyond it', () => {
    const path = { upstream: ['goal'], downstream: ['spec', 'test'] };
    expect(chooseRelation(path, { direction: 'downstream', depth: 1, key: 'plan' })).toEqual({
      upstream: ['goal'],
      downstream: ['plan'],
    });
    expect(chooseRelation(path, { direction: 'downstream', depth: 3, key: 'more' })).toEqual({
      upstream: ['goal'],
      downstream: ['spec', 'test', 'more'],
    });
    expect(chooseRelation(path, { direction: 'upstream', depth: 1, key: null })).toEqual({
      upstream: [],
      downstream: ['spec', 'test'],
    });
  });
});
