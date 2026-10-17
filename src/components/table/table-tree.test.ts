import { describe, expect, it } from 'vitest';
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
});
