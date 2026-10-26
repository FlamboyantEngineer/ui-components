import { describe, expect, it } from 'vitest';
import { mapTree } from './map-tree.js';

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
});
