import { describe, expect, it } from 'vitest';
import { formatDiagramLink, indexDiagramLinks } from './diagram-links.js';

const nodes = [
  { id: 'a', x: 0, y: 0, label: 'Alpha' },
  { id: 'b', x: 100, y: 0, label: 'Blue' },
];

describe('indexDiagramLinks', () => {
  it('UIC-DIAGRAM-CANVAS-6.4 reads connections a bounded number of times for a large graph', () => {
    let reads = 0;
    const many = Array.from({ length: 1000 }, (_, id) => ({ id, x: id, y: 0, label: String(id) }));
    const edges = many.slice(1).map((node) => ({
      id: node.id,
      get source() {
        reads += 1;
        return node.id - 1;
      },
      get target() {
        reads += 1;
        return node.id;
      },
    }));
    const links = indexDiagramLinks(many, edges);
    expect(links.get(0)!.outgoing).toHaveLength(1);
    expect(links.get(999)!.incoming).toHaveLength(1);
    expect(reads).toBeLessThanOrEqual(edges.length * 4);
  });

  it('UIC-DIAGRAM-CANVAS-6.1 UIC-DIAGRAM-CANVAS-6.4 keeps loops and parallel links in edge order, omitting missing ends', () => {
    const edges = [
      { id: 1, source: 'a', target: 'b', label: 'First' },
      { id: 2, source: 'a', target: 'a' },
      { id: 3, source: 'a', target: 'b' },
      { id: 4, source: 'a', target: 'missing' },
      { id: 5, source: 'missing', target: 'b' },
    ];
    const links = indexDiagramLinks(nodes, edges);
    expect(links.get('a')!.outgoing.map(formatDiagramLink)).toEqual([
      'Blue (First)',
      'Alpha',
      'Blue',
    ]);
    expect(links.get('a')!.incoming.map((link) => link.edge.id)).toEqual([2]);
    expect(links.get('b')!.incoming.map((link) => link.edge.id)).toEqual([1, 3]);
    expect(indexDiagramLinks(nodes, []).get('b')).toEqual({ outgoing: [], incoming: [] });
  });

  it('UIC-DIAGRAM-CANVAS-6.1 UIC-DIAGRAM-CANVAS-6.4 refreshes labels and removed connections from new input', () => {
    const updated = nodes.map((node) => ({ ...node, label: `${node.label} changed` }));
    const links = indexDiagramLinks(updated, [{ id: 1, source: 'b', target: 'a' }]);
    expect(links.get('b')!.outgoing.map(formatDiagramLink)).toEqual(['Alpha changed']);
    expect(links.get('a')!.outgoing).toEqual([]);
  });
});
