import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { buildTableNodes, filterTableNodes, sortTableNodes, type TableNode } from './table-tree.js';

interface Place {
  id: string;
  name: string;
  places?: Place[];
}

const places: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    places: [
      { id: 'porto', name: 'Porto' },
      { id: 'lisbon', name: 'Lisbon', places: [{ id: 'belem', name: 'Belem' }] },
    ],
  },
  { id: 'no', name: 'Norway', places: [{ id: 'oslo', name: 'Oslo' }] },
];

function outline(nodes: readonly TableNode<Place>[]): unknown[] {
  return nodes.map((node) =>
    node.children.length > 0 ? [node.row.name, outline(node.children)] : node.row.name,
  );
}

describe('table tree helpers', () => {
  it('UIC-TABLE-9.3 builds nodes keyed by row id from the child rows', () => {
    const nodes = buildTableNodes(places, (place) => place.places);
    expect(nodes.map((node) => node.id)).toEqual(['pt', 'no']);
    expect(outline(nodes)).toEqual([
      ['Portugal', ['Porto', ['Lisbon', ['Belem']]]],
      ['Norway', ['Oslo']],
    ]);
    expect(outline(buildTableNodes(places, undefined))).toEqual(['Portugal', 'Norway']);
  });

  it('UIC-TABLE-9.3 sorts every level among siblings', () => {
    const nodes = buildTableNodes(places, (place) => place.places);
    const byName = (left: Place, right: Place) => left.name.localeCompare(right.name);
    expect(outline(sortTableNodes(nodes, byName))).toEqual([
      ['Norway', ['Oslo']],
      ['Portugal', [['Lisbon', ['Belem']], 'Porto']],
    ]);
  });

  it('UIC-TABLE-9.3 keeps matches and the rows above them, with only matching children', () => {
    const nodes = buildTableNodes(places, (place) => place.places);
    expect(outline(filterTableNodes(nodes, (place) => place.name === 'Belem'))).toEqual([
      ['Portugal', [['Lisbon', ['Belem']]]],
    ]);
    expect(outline(filterTableNodes(nodes, (place) => place.name === 'Norway'))).toEqual([
      'Norway',
    ]);
  });

  it('UIC-TABLE-9.3 builds, filters and sorts deeply nested rows without a call-stack limit', () => {
    let rows: Place[] = [{ id: '19999', name: 'Match' }];
    for (let index = 19_998; index >= 0; index -= 1) {
      rows = [{ id: String(index), name: 'Parent', places: rows }];
    }
    const nodes = buildTableNodes(rows, (row) => row.places);
    const visits: string[] = [];
    const filtered = filterTableNodes(nodes, (row) => {
      visits.push(row.id);
      return row.name === 'Match';
    });
    const sorted = sortTableNodes(filtered, (left, right) => left.name.localeCompare(right.name));
    let level = sorted;
    let depth = 0;
    while (level.length > 0) {
      expect(level).toHaveLength(1);
      expect(level[0]?.id).toBe(String(depth));
      level = requireDefined(level[0]).children;
      depth += 1;
    }
    expect(depth).toBe(20_000);
    expect(visits).toHaveLength(20_000);
    expect(visits[0]).toBe('19999');
    expect(visits.at(-1)).toBe('0');
    expect(nodes[0]?.row).toBe(rows[0]);
    expect(filterTableNodes(nodes, () => false)).toEqual([]);
  });
});
