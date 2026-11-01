import { describe, expect, it } from 'vitest';
import { mapTree, mapTreeToDepth } from './map-tree.js';

interface Item {
  id: string;
  children?: Item[];
}

describe('mapTree', () => {
  it('UIC-TABLE-9.3 transforms descendants before parents while retaining sibling order', () => {
    const input: Item[] = [
      { id: 'a', children: [{ id: 'b' }, { id: 'c' }] },
      { id: 'd', children: [{ id: 'e' }] },
    ];
    const reads: string[] = [];
    const visits: string[] = [];
    const result = mapTree(
      input,
      (item) => {
        reads.push(item.id);
        return item.children;
      },
      (item, children: string[], index) => {
        visits.push(`${item.id}:${index}`);
        return item.id === 'd' ? null : `${item.id}[${children.join(',')}]`;
      },
    );
    expect(reads).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(visits).toEqual(['b:0', 'c:1', 'a:0', 'e:0', 'd:1']);
    expect(result).toEqual(['a[b[],c[]]']);
    expect(
      mapTree(
        [],
        () => [],
        () => null,
      ),
    ).toEqual([]);
  });

  it('UIC-MARKUP-1.6 unwraps items past maxDepth into their ancestor at that depth, in order', () => {
    const input: Item[] = [
      {
        id: 'a',
        children: [
          { id: 'b', children: [{ id: 'c', children: [{ id: 'd' }, { id: 'e' }] }, { id: 'f' }] },
          { id: 'g' },
        ],
      },
    ];
    const result = mapTreeToDepth(input, {
      getChildren: (item) => item.children,
      transform: (item, children: string[], index) => `${item.id}${index}[${children.join(',')}]`,
      maxDepth: 2,
    });
    expect(result).toEqual(['a0[b0[d0[],e1[],f2[]],g1[]]']);
  });

  it('UIC-MARKUP-1.6 maps a very deep chain without growing deeper than maxDepth', () => {
    let deepest: Item = { id: 'leaf' };
    for (let level = 0; level < 50_000; level += 1) deepest = { id: 'node', children: [deepest] };
    const depths: number[] = [];
    mapTreeToDepth([deepest], {
      getChildren: (item) => item.children,
      transform: (_item, children: number[]) => {
        const depth = Math.max(0, ...children) + 1;
        depths.push(depth);
        return depth;
      },
      maxDepth: 256,
    });
    // The leaf joins the item at depth 256 as its child.
    expect(Math.max(...depths)).toBe(257);
  });
});
