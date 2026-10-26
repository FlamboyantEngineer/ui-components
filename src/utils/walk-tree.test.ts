import { describe, expect, it, vi } from 'vitest';
import { walkTree } from './walk-tree.js';

interface Item {
  id: number;
  children?: Item[];
}

describe('walkTree', () => {
  it('UIC-TREE-1.1 visits nested items in reading order without copying sibling lists', () => {
    const items = [{ id: 1, children: [{ id: 2 }, { id: 3, children: [{ id: 4 }] }] }, { id: 5 }];
    expect([...walkTree(items, (item: Item) => item.children)].map((item) => item.id)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect([...walkTree([], () => undefined)]).toEqual([]);
  });

  it('UIC-TREE-1.1 stops before reading the children of the last item requested', () => {
    const getChildren = vi.fn((item: Item) => item.children);
    for (const item of walkTree([{ id: 1, children: [{ id: 2 }] }], getChildren)) {
      expect(item.id).toBe(1);
      break;
    }
    expect(getChildren).not.toHaveBeenCalled();
  });

  it('UIC-TREE-1.1 visits a deep hierarchy without a call stack limit', () => {
    let root: Item = { id: 20_000 };
    for (let id = 19_999; id >= 0; id -= 1) root = { id, children: [root] };
    let count = 0;
    for (const item of walkTree([root], (item) => item.children)) expect(item.id).toBe(count++);
    expect(count).toBe(20_001);
  });
});
