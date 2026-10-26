import { describe, expect, it } from 'vitest';
import { compareTrees, type CompareTreeNode, type ComparedTreeRow } from './compare-trees.js';
import { requireDefined } from './require-defined.js';

const node = (id: string, label: string, children?: CompareTreeNode[]): CompareTreeNode => ({
  id,
  label,
  ...(children ? { children } : {}),
});

/** Each row as `id change left|right`, indented by depth. */
function describeRows(rows: readonly ComparedTreeRow[], depth = 0): string[] {
  return rows.flatMap((row) => [
    `${'  '.repeat(depth)}${String(row.id)} ${row.change} ${row.left?.label ?? '-'}|${row.right?.label ?? '-'}`,
    ...describeRows(row.children, depth + 1),
  ]);
}

describe('compareTrees', () => {
  it('UIC-TREE-COMPARE-1.3 avoids moved-row ids that collide with input ids', () => {
    const a = node('a', 'A');
    const b = node('b', 'B');
    const c = node('c', 'C');
    const reserved = node('moved-from:a', 'Reserved');
    const alsoReserved = node('moved-from:a:2', 'Also reserved');
    for (const [left, right] of [
      [
        [a, b, c, reserved, alsoReserved],
        [b, c, a, reserved, alsoReserved],
      ],
      [
        [b, c, a, reserved, alsoReserved],
        [a, b, c, reserved, alsoReserved],
      ],
    ]) {
      const { rows, counts } = compareTrees(requireDefined(left), requireDefined(right));
      expect(counts.moved).toBe(1);
      expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
      const from = requireDefined(rows.find((row) => row.change === 'moved' && row.left));
      const to = requireDefined(rows.find((row) => row.change === 'moved' && row.right));
      expect(from.id).toBe('moved-from:a:3');
      expect(from.counterpartId).toBe(to.id);
      expect(to.counterpartId).toBe(from.id);
    }
  });

  it('UIC-TREE-COMPARE-1.1 UIC-TREE-COMPARE-1.2 aligns twenty thousand nested nodes on either side', () => {
    let nodes: CompareTreeNode[] = [];
    for (let id = 19_999; id >= 0; id -= 1) nodes = [{ id, label: `Node ${id}`, children: nodes }];
    const cases = [
      { left: nodes, right: nodes, change: 'unchanged', added: 0, removed: 0 },
      { left: nodes, right: [], change: 'removed', added: 0, removed: 20_000 },
      { left: [], right: nodes, change: 'added', added: 20_000, removed: 0 },
    ] as const;
    for (const item of cases) {
      const comparison = compareTrees(item.left, item.right);
      let depth = 0;
      let rows = comparison.rows;
      let last: ComparedTreeRow | undefined;
      while (rows.length === 1) {
        last = requireDefined(rows[0]);
        depth += 1;
        rows = last.children;
      }
      expect(depth).toBe(20_000);
      expect(last).toMatchObject({ nodeId: 19_999, change: item.change });
      expect(comparison.counts).toEqual({
        added: item.added,
        removed: item.removed,
        changed: 0,
        moved: 0,
      });
    }
  });

  it('UIC-TREE-COMPARE-1.1 calls isEqual in depth-first reading order', () => {
    const tree = [node('a', 'A', [node('child', 'Child')]), node('b', 'B')];
    const visited: string[] = [];
    compareTrees(tree, tree, {
      isEqual: (left) => {
        visited.push(String(left.id));
        return true;
      },
    });
    expect(visited).toEqual(['a', 'child', 'b']);
  });

  it('UIC-TREE-COMPARE-1.1 pairs nodes by id and compares them by label or isEqual', () => {
    const left = [node('fruit', 'Fruit', [node('apple', 'Apple'), node('pear', 'Pears')])];
    const right = [node('fruit', 'Fruit', [node('apple', 'Apple'), node('pear', 'Pear')])];
    const { rows, counts } = compareTrees(left, right);
    expect(describeRows(rows)).toEqual([
      'fruit unchanged Fruit|Fruit',
      '  apple unchanged Apple|Apple',
      '  pear changed Pears|Pear',
    ]);
    expect(requireDefined(rows[0]).left).toBe(left[0]);
    expect(requireDefined(rows[0]).right).toBe(right[0]);
    expect(counts).toEqual({ added: 0, removed: 0, changed: 1, moved: 0 });
    const lenient = compareTrees(left, right, {
      isEqual: (a, b) => a.label.startsWith(b.label),
    });
    expect(lenient.counts.changed).toBe(0);
    expect(compareTrees([], [])).toEqual({
      rows: [],
      counts: { added: 0, removed: 0, changed: 0, moved: 0 },
    });
  });

  it('UIC-TREE-COMPARE-1.2 marks one-sided nodes added or removed with their subtrees', () => {
    const left = [
      node('fruit', 'Fruit', [node('apple', 'Apple')]),
      node('nuts', 'Nuts', [node('pecan', 'Pecan')]),
    ];
    const right = [
      node('fruit', 'Fruit', [node('apple', 'Apple'), node('kiwi', 'Kiwi')]),
      node('herbs', 'Herbs', [node('basil', 'Basil')]),
    ];
    const { rows, counts } = compareTrees(left, right);
    expect(describeRows(rows)).toEqual([
      'fruit unchanged Fruit|Fruit',
      '  apple unchanged Apple|Apple',
      '  kiwi added -|Kiwi',
      'nuts removed Nuts|-',
      '  pecan removed Pecan|-',
      'herbs added -|Herbs',
      '  basil added -|Basil',
    ]);
    expect(counts).toEqual({ added: 3, removed: 2, changed: 0, moved: 0 });
  });

  it('UIC-TREE-COMPARE-1.3 shows a moved node at both positions, linked to each other', () => {
    const left = [
      node('fruit', 'Fruit', [node('apple', 'Apple'), node('fig', 'Fig', [node('seed', 'Seed')])]),
      node('nuts', 'Nuts'),
    ];
    const right = [
      node('fruit', 'Fruit', [node('apple', 'Apple')]),
      node('nuts', 'Nuts', [node('fig', 'Fig', [node('seed', 'Seed'), node('skin', 'Skin')])]),
    ];
    const { rows, counts } = compareTrees(left, right);
    expect(describeRows(rows)).toEqual([
      'fruit unchanged Fruit|Fruit',
      '  apple unchanged Apple|Apple',
      '  moved-from:fig moved Fig|-',
      'nuts unchanged Nuts|Nuts',
      '  fig moved -|Fig',
      '    seed unchanged Seed|Seed',
      '    skin added -|Skin',
    ]);
    const from = requireDefined(requireDefined(rows[0]).children[1]);
    const to = requireDefined(requireDefined(rows[1]).children[0]);
    expect(from.counterpartId).toBe('fig');
    expect(to.counterpartId).toBe('moved-from:fig');
    expect(counts).toEqual({ added: 1, removed: 0, changed: 0, moved: 1 });
  });

  it('UIC-TREE-COMPARE-1.3 keeps the longest common order and moves the rest among siblings', () => {
    const left = [node('a', 'A'), node('b', 'B'), node('c', 'C'), node('d', 'D')];
    const right = [node('b', 'B'), node('c', 'C'), node('a', 'A'), node('d', 'D')];
    const { rows, counts } = compareTrees(left, right);
    expect(describeRows(rows)).toEqual([
      'moved-from:a moved A|-',
      'b unchanged B|B',
      'c unchanged C|C',
      'a moved -|A',
      'd unchanged D|D',
    ]);
    expect(counts.moved).toBe(1);
  });

  it('UIC-TREE-COMPARE-1.3 ends when a parent and its child swap places', () => {
    const left = [node('a', 'A', [node('b', 'B')])];
    const right = [node('b', 'B', [node('a', 'A')])];
    expect(describeRows(compareTrees(left, right).rows)).toEqual([
      'moved-from:a moved A|-',
      'b moved -|B',
      '  a moved -|A',
      '    moved-from:b moved B|-',
    ]);
  });

  it('UIC-TREE-COMPARE-1.4 counts every kind of change, a moved node once', () => {
    const left = [
      node('x', 'X', [node('x1', 'X1'), node('x2', 'X2')]),
      node('y', 'Y'),
      node('gone', 'Gone'),
    ];
    const right = [
      node('x', 'X!', [node('x2', 'X2'), node('x1', 'X1')]),
      node('y', 'Y', [node('new', 'New')]),
    ];
    expect(compareTrees(left, right).counts).toEqual({
      added: 1,
      removed: 1,
      changed: 1,
      moved: 1,
    });
  });
});
