import { describe, expect, it } from 'vitest';
import {
  applyTreeMove,
  getVisibleTreeRows,
  resolveTreeDrop,
  resolveTreeKeyboardMove,
  resolveTreeMove,
  type TreeMoveRules,
} from './tree-reorder.js';

interface Shelf {
  id: string;
  children?: Shelf[];
}

/**
 * A pantry: `apple`, `pear`, `kiwi` and `berries` move among their siblings; `plum` is fixed and
 * `fig` disabled; `berries` is an open branch; `garden` sits beside `pantry` at the top level.
 */
const PANTRY: Shelf[] = [
  {
    id: 'pantry',
    children: [
      { id: 'apple' },
      { id: 'pear' },
      { id: 'plum' },
      { id: 'fig' },
      { id: 'kiwi' },
      { id: 'berries', children: [{ id: 'currant' }] },
    ],
  },
  { id: 'garden' },
];

const FIXED = new Set(['pantry', 'plum', 'fig']);
const pantryRows = (expandedKeys = ['pantry', 'berries']) =>
  getVisibleTreeRows(PANTRY, { expandedKeys, isMovable: (item) => !FIXED.has(item.id) });

/** Boxes take items, the cellar takes boxes, and nothing else nests. */
const CELLAR: Shelf[] = [
  {
    id: 'cellar',
    children: [
      { id: 'box-a', children: [{ id: 'jar' }, { id: 'box-inner', children: [] }] },
      { id: 'box-b', children: [] },
      { id: 'box-c', children: [{ id: 'tin' }] },
      { id: 'bottle' },
      { id: 'flask' },
      { id: 'box-fixed', children: [] },
    ],
  },
];
const cellarRules: TreeMoveRules<Shelf> = {
  canMoveInto: (item, parent) =>
    parent?.id === 'cellar'
      ? item.id.startsWith('box')
      : Boolean(parent?.id.startsWith('box')) && !item.id.startsWith('box'),
};
const cellarRows = () =>
  getVisibleTreeRows(CELLAR, {
    expandedKeys: ['cellar', 'box-a'],
    isMovable: (item) => item.id !== 'cellar' && item.id !== 'box-fixed',
  });

describe('getVisibleTreeRows', () => {
  it('UIC-TREE-REORDER-2.1 lists visible rows in order with their parent, movability and expansion', () => {
    const rows = pantryRows();
    expect(rows.map((row) => row.key)).toEqual([
      'pantry',
      'apple',
      'pear',
      'plum',
      'fig',
      'kiwi',
      'berries',
      'currant',
      'garden',
    ]);
    expect(rows.find((row) => row.key === 'currant')?.parentKey).toBe('berries');
    expect(rows.find((row) => row.key === 'garden')?.parentKey).toBeNull();
    expect(rows.filter((row) => row.isExpanded).map((row) => row.key)).toEqual([
      'pantry',
      'berries',
    ]);
    expect(rows.filter((row) => !row.isMovable).map((row) => row.key)).toEqual([
      'pantry',
      'plum',
      'fig',
    ]);
    expect(pantryRows(['pantry']).map((row) => row.key)).not.toContain('currant');
  });

  it('UIC-TREE-REORDER-2.1 reads children through an accessor and moves every row by default', () => {
    type Group = { id: string; entries?: Group[] };
    const rows = getVisibleTreeRows<Group>([{ id: 'g', entries: [{ id: 'e' }] }], {
      expandedKeys: ['g', 'empty'],
      getChildren: (item) => item.entries,
    });
    expect(rows.map((row) => [row.key, row.parentKey, row.isMovable])).toEqual([
      ['g', null, true],
      ['e', 'g', true],
    ]);
  });
});

describe('resolveTreeMove', () => {
  it('UIC-TREE-REORDER-2.2 moves a row beside its movable siblings', () => {
    const rows = pantryRows();
    expect(resolveTreeMove(rows, { key: 'apple', targetKey: 'kiwi', position: 'after' })).toEqual({
      key: 'apple',
      targetKey: 'kiwi',
      position: 'after',
    });
    expect(resolveTreeMove(rows, { key: 'kiwi', targetKey: 'apple', position: 'before' })).toEqual({
      key: 'kiwi',
      targetKey: 'apple',
      position: 'before',
    });
  });

  it('UIC-TREE-REORDER-2.2 refuses fixed rows, the row itself and the slot it already holds', () => {
    const rows = pantryRows();
    expect(
      resolveTreeMove(rows, { key: 'plum', targetKey: 'apple', position: 'before' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'plum', position: 'after' }),
    ).toBeNull();
    expect(resolveTreeMove(rows, { key: 'apple', targetKey: 'fig', position: 'after' })).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'apple', position: 'after' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'pear', position: 'before' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'pear', targetKey: 'apple', position: 'after' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'missing', position: 'after' }),
    ).toBeNull();
  });

  it('UIC-TREE-REORDER-2.2 keeps rows among their siblings unless the owner consents to a new parent', () => {
    const rows = pantryRows();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'currant', position: 'before' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'garden', position: 'after' }),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'kiwi', position: 'inside' }),
    ).toBeNull();
    const parents: Array<string | null> = [];
    const rules: TreeMoveRules<Shelf> = {
      canMoveInto: (_item, parent) => {
        parents.push(parent?.id ?? null);
        return parent?.id !== 'kiwi';
      },
    };
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'currant', position: 'before' }, rules),
    ).not.toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'garden', position: 'after' }, rules),
    ).not.toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'apple', targetKey: 'kiwi', position: 'inside' }, rules),
    ).toBeNull();
    expect(parents).toEqual(['berries', null, 'kiwi']);
  });

  it('UIC-TREE-REORDER-2.2 never lands a row inside its own parent or beside its own descendants', () => {
    const permissive: TreeMoveRules<Shelf> = { canMoveInto: () => true };
    const rows = cellarRows();
    expect(
      resolveTreeMove(rows, { key: 'jar', targetKey: 'box-a', position: 'inside' }, permissive),
    ).toBeNull();
    expect(
      resolveTreeMove(
        rows,
        { key: 'box-a', targetKey: 'box-inner', position: 'inside' },
        permissive,
      ),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'box-a', targetKey: 'jar', position: 'after' }, permissive),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'box-a', targetKey: 'box-b', position: 'inside' }, permissive),
    ).not.toBeNull();
  });

  it('UIC-TREE-REORDER-2.2 applies the owner placement rules between parents', () => {
    const rows = cellarRows();
    expect(
      resolveTreeMove(rows, { key: 'bottle', targetKey: 'box-b', position: 'inside' }, cellarRules)
        ?.position,
    ).toBe('inside');
    expect(
      resolveTreeMove(rows, { key: 'bottle', targetKey: 'jar', position: 'before' }, cellarRules)
        ?.position,
    ).toBe('before');
    expect(
      resolveTreeMove(rows, { key: 'box-b', targetKey: 'box-a', position: 'inside' }, cellarRules),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'box-b', targetKey: 'jar', position: 'before' }, cellarRules),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'jar', targetKey: 'box-a', position: 'before' }, cellarRules),
    ).toBeNull();
    expect(
      resolveTreeMove(
        rows,
        { key: 'bottle', targetKey: 'box-fixed', position: 'inside' },
        cellarRules,
      ),
    ).toBeNull();
    expect(
      resolveTreeMove(
        rows,
        { key: 'bottle', targetKey: 'cellar', position: 'inside' },
        cellarRules,
      ),
    ).toBeNull();
  });
});

describe('resolveTreeDrop', () => {
  it('UIC-TREE-REORDER-2.3 lands nothing just after a row whose children are listed', () => {
    const rows = cellarRows();
    expect(
      resolveTreeDrop(rows, { key: 'bottle', targetKey: 'box-a', position: 'after' }, cellarRules),
    ).toBeNull();
    expect(
      resolveTreeMove(rows, { key: 'bottle', targetKey: 'box-a', position: 'after' }, cellarRules),
    ).not.toBeNull();
    expect(
      resolveTreeDrop(rows, { key: 'flask', targetKey: 'box-c', position: 'after' }, cellarRules),
    ).toEqual({
      key: 'flask',
      targetKey: 'box-c',
      position: 'after',
    });
    expect(
      resolveTreeDrop(rows, { key: 'bottle', targetKey: 'box-c', position: 'inside' }, cellarRules)
        ?.position,
    ).toBe('inside');
  });
});

describe('resolveTreeKeyboardMove', () => {
  it('UIC-TREE-REORDER-2.4 passes the neighbouring movable sibling and does nothing at either end', () => {
    const rows = pantryRows();
    expect(resolveTreeKeyboardMove(rows, { key: 'apple', direction: 'down' })).toEqual({
      key: 'apple',
      targetKey: 'pear',
      position: 'after',
    });
    expect(resolveTreeKeyboardMove(rows, { key: 'pear', direction: 'down' })).toEqual({
      key: 'pear',
      targetKey: 'kiwi',
      position: 'after',
    });
    expect(resolveTreeKeyboardMove(rows, { key: 'kiwi', direction: 'up' })).toEqual({
      key: 'kiwi',
      targetKey: 'pear',
      position: 'before',
    });
    expect(resolveTreeKeyboardMove(rows, { key: 'apple', direction: 'up' })).toBeNull();
    expect(resolveTreeKeyboardMove(rows, { key: 'currant', direction: 'down' })).toBeNull();
  });

  it('UIC-TREE-REORDER-2.4 leaves fixed rows and parent changes without consent to navigation', () => {
    const rows = pantryRows();
    expect(resolveTreeKeyboardMove(rows, { key: 'plum', direction: 'down' })).toBeUndefined();
    expect(resolveTreeKeyboardMove(rows, { key: 'pear', direction: 'in' })).toBeUndefined();
    expect(resolveTreeKeyboardMove(rows, { key: 'currant', direction: 'out' })).toBeUndefined();
  });

  it('UIC-TREE-REORDER-2.4 moves into the sibling above and out of the parent with consent', () => {
    const rows = cellarRows();
    expect(resolveTreeKeyboardMove(rows, { key: 'bottle', direction: 'in' }, cellarRules)).toEqual({
      key: 'bottle',
      targetKey: 'box-c',
      position: 'inside',
    });
    expect(
      resolveTreeKeyboardMove(rows, { key: 'box-inner', direction: 'out' }, cellarRules),
    ).toEqual({
      key: 'box-inner',
      targetKey: 'box-a',
      position: 'after',
    });
    expect(
      resolveTreeKeyboardMove(rows, { key: 'box-a', direction: 'in' }, cellarRules),
    ).toBeNull();
    expect(
      resolveTreeKeyboardMove(rows, { key: 'box-b', direction: 'in' }, cellarRules),
    ).toBeNull();
    expect(resolveTreeKeyboardMove(rows, { key: 'jar', direction: 'out' }, cellarRules)).toBeNull();
    expect(
      resolveTreeKeyboardMove(rows, { key: 'box-a', direction: 'out' }, cellarRules),
    ).toBeNull();
  });
});

describe('applyTreeMove', () => {
  it('UIC-TREE-REORDER-2.5 places the row before, after or inside its target', () => {
    const ids = (items: readonly Shelf[]): unknown =>
      items.map((item) => (item.children ? { [item.id]: ids(item.children) } : item.id));
    expect(
      ids(applyTreeMove(PANTRY, { key: 'apple', targetKey: 'kiwi', position: 'after' })),
    ).toEqual([
      { pantry: ['pear', 'plum', 'fig', 'kiwi', 'apple', { berries: ['currant'] }] },
      'garden',
    ]);
    expect(
      ids(applyTreeMove(PANTRY, { key: 'garden', targetKey: 'pear', position: 'before' })),
    ).toEqual([
      { pantry: ['apple', 'garden', 'pear', 'plum', 'fig', 'kiwi', { berries: ['currant'] }] },
    ]);
    expect(
      ids(applyTreeMove(PANTRY, { key: 'apple', targetKey: 'garden', position: 'inside' })),
    ).toEqual([
      { pantry: ['pear', 'plum', 'fig', 'kiwi', { berries: ['currant'] }] },
      { garden: ['apple'] },
    ]);
    expect(
      ids(applyTreeMove(PANTRY, { key: 'kiwi', targetKey: 'berries', position: 'inside' })),
    ).toEqual([
      { pantry: ['apple', 'pear', 'plum', 'fig', { berries: ['currant', 'kiwi'] }] },
      'garden',
    ]);
  });

  it('UIC-TREE-REORDER-2.5 keeps the input and untouched subtrees, and ignores impossible moves', () => {
    const frozen = structuredClone(PANTRY);
    const next = applyTreeMove(PANTRY, { key: 'apple', targetKey: 'pear', position: 'after' });
    expect(PANTRY).toEqual(frozen);
    expect(next).not.toBe(PANTRY);
    const berries = PANTRY[0]?.children?.[5];
    expect(next[0]?.children?.find((item) => item.id === 'berries')).toBe(berries);
    expect(next[1]).toBe(PANTRY[1]);
    expect(applyTreeMove(PANTRY, { key: 'missing', targetKey: 'pear', position: 'after' })).toBe(
      PANTRY,
    );
    expect(applyTreeMove(PANTRY, { key: 'apple', targetKey: 'missing', position: 'after' })).toBe(
      PANTRY,
    );
    expect(applyTreeMove(PANTRY, { key: 'pantry', targetKey: 'currant', position: 'after' })).toBe(
      PANTRY,
    );
    expect(applyTreeMove(PANTRY, { key: 'apple', targetKey: 'apple', position: 'inside' })).toBe(
      PANTRY,
    );
  });
});
