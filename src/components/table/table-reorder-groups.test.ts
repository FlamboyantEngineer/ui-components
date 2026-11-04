import { describe, expect, it } from 'vitest';
import { groupTableNodes, listGroupKeys, resolveGroupings } from './table-groups.js';
import { isWithinReorderGroup, resolveGroupReorder } from './table-reorder-groups.js';
import { buildTableNodes } from './table-tree.js';

const rows = [
  { id: 'pear', kind: 'Fruit' },
  { id: 'mint', kind: 'Herb' },
  { id: 'lime', kind: 'Fruit' },
];
const columns = [{ id: 'kind', header: 'Kind' }];
const nodes = groupTableNodes(
  buildTableNodes(rows, undefined),
  resolveGroupings(['kind'], columns, []),
  { locale: 'en-US' },
);
const grouped = {
  nodes,
  isGrouped: true,
  expansion: { expandedKeys: new Set(listGroupKeys(nodes)) },
};
const view = { rows, sort: { descriptors: [] } };
const reorder = { grouped: 'within-group', onMove() {} } as const;

describe('group-constrained row moves', () => {
  it('UIC-TABLE-5.7 keeps the default grouped suppression and suspends moves while sorted', () => {
    expect(
      resolveGroupReorder({ reorder: { onMove() {} } }, view, grouped).reorder,
    ).toBeUndefined();
    expect(
      resolveGroupReorder(
        { reorder },
        { rows, sort: { descriptors: [{ column: 'kind', direction: 'ascending' }] } },
        grouped,
      ).reorder,
    ).toBeUndefined();
    expect(resolveGroupReorder({ reorder }, view, { ...grouped, isGrouped: false }).reorder).toBe(
      reorder,
    );
  });

  it('UIC-TABLE-5.7 admits only visible top-level data rows and same-leaf-group targets', () => {
    const result = resolveGroupReorder({ reorder }, view, grouped);
    expect(result.rows.map((row) => row.id)).toEqual(['pear', 'lime', 'mint']);
    expect(
      isWithinReorderGroup(result.groupKeys, {
        keys: ['pear'],
        targetKey: 'lime',
        position: 'after',
      }),
    ).toBe(true);
    expect(
      isWithinReorderGroup(result.groupKeys, {
        keys: ['pear'],
        targetKey: 'mint',
        position: 'before',
      }),
    ).toBe(false);
    expect(
      isWithinReorderGroup(result.groupKeys, {
        keys: ['pear', 'mint'],
        targetKey: 'lime',
        position: 'after',
      }),
    ).toBe(false);
    expect(
      isWithinReorderGroup(result.groupKeys, {
        keys: ['pear'],
        targetKey: 'ui-table-group:kind=Fruit',
        position: 'before',
      }),
    ).toBe(false);
    const hidden = resolveGroupReorder({ reorder }, view, {
      ...grouped,
      expansion: { expandedKeys: new Set() },
    });
    expect(hidden.rows).toEqual([]);
    expect(hidden.groupKeys?.size).toBe(0);
  });

  it('UIC-TABLE-5.7 separates nested groups and excludes child rows', () => {
    interface NestedEntry {
      id: string;
      kind: string;
      place: string;
      children?: NestedEntry[];
    }
    const nested: NestedEntry[] = [
      {
        id: 'one',
        kind: 'Fruit',
        place: 'North',
        children: [{ id: 'child', kind: 'Fruit', place: 'North' }],
      },
      { id: 'two', kind: 'Fruit', place: 'South', children: [] },
    ];
    const body = groupTableNodes(
      buildTableNodes(nested, (row) => row.children ?? []),
      resolveGroupings(['kind', 'place'], [...columns, { id: 'place', header: 'Place' }], []),
      { locale: 'en-US' },
    );
    const result = resolveGroupReorder(
      { reorder },
      { rows: nested, sort: { descriptors: [] } },
      {
        nodes: body,
        isGrouped: true,
        expansion: { expandedKeys: new Set([...listGroupKeys(body), 'one']) },
      },
    );
    expect(result.rows.map((row) => row.id)).toEqual(['one', 'two']);
    expect(result.groupKeys?.has('child')).toBe(false);
    expect(
      isWithinReorderGroup(result.groupKeys, {
        keys: ['one'],
        targetKey: 'two',
        position: 'after',
      }),
    ).toBe(false);
  });
});
