import { describe, expect, it } from 'vitest';
import {
  countChanges,
  createDiffBlocks,
  createSplitRows,
  createUnifiedRows,
  type SplitRow,
  type UnifiedRow,
} from './diff-rows.js';

const lines = (count: number, prefix = 'line') =>
  Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`);

const describeUnified = (rows: UnifiedRow[]) =>
  rows.map((row) =>
    row.kind === 'fold'
      ? `fold ${row.count}`
      : `${row.line.change} ${row.line.oldNumber ?? '-'}/${row.line.newNumber ?? '-'}`,
  );

const describeSplit = (rows: SplitRow[]) =>
  rows.map((row) =>
    row.kind === 'fold'
      ? `fold ${row.count}`
      : `${row.old?.oldNumber ?? '-'}|${row.new?.newNumber ?? '-'}`,
  );

describe('text diff rows', () => {
  it('UIC-TEXT-DIFF-1.1 groups the line diff into unchanged runs and changes with line numbers', () => {
    const blocks = createDiffBlocks('apple\nbanana\ncherry\ndate', 'apple\nblueberry\ncherry\nfig');
    expect(blocks.map((block) => block.kind)).toEqual([
      'unchanged',
      'change',
      'unchanged',
      'change',
    ]);
    const [, first, , second] = blocks;
    expect(first).toMatchObject({
      kind: 'change',
      change: 0,
      removed: [{ change: 'removed', oldNumber: 2, newNumber: null, text: 'banana' }],
      added: [{ change: 'added', oldNumber: null, newNumber: 2, text: 'blueberry' }],
    });
    expect(second).toMatchObject({ change: 1 });
    expect(blocks[2]).toMatchObject({
      lines: [{ change: 'unchanged', oldNumber: 3, newNumber: 3, text: 'cherry' }],
    });
    expect(countChanges(blocks)).toEqual({ added: 2, removed: 2, changes: 2 });
    expect(createDiffBlocks('', '')).toEqual([]);
    expect(countChanges(createDiffBlocks('', 'one\ntwo'))).toEqual({
      added: 2,
      removed: 0,
      changes: 1,
    });
  });

  it('UIC-TEXT-DIFF-1.2 marks the words a paired line changed, unless the lines share no word', () => {
    const [block] = createDiffBlocks(
      'Bake for ten minutes\nServe warm',
      'Bake for twelve minutes\nPlate the dish\nGarnish',
    );
    if (block?.kind !== 'change') throw new Error('expected a change');
    expect(block.removed[0]!.words).toEqual([
      { text: 'Bake for ', isChanged: false },
      { text: 'ten', isChanged: true },
      { text: ' minutes', isChanged: false },
    ]);
    expect(block.added[0]!.words).toEqual([
      { text: 'Bake for ', isChanged: false },
      { text: 'twelve', isChanged: true },
      { text: ' minutes', isChanged: false },
    ]);
    expect(block.removed[1]!.words).toBeNull();
    expect(block.added[1]!.words).toBeNull();
    expect(block.added[2]!.words).toBeNull();
  });

  it('UIC-TEXT-DIFF-1.3 lists a change as its removed lines, then its added lines', () => {
    const blocks = createDiffBlocks('a\nb\nc', 'a\nB\nC\nD');
    expect(describeUnified(createUnifiedRows(blocks, { context: 3, expanded: new Set() }))).toEqual(
      ['unchanged 1/1', 'removed 2/-', 'removed 3/-', 'added -/2', 'added -/3', 'added -/4'],
    );
  });

  it('UIC-TEXT-DIFF-1.4 sets a change side by side, the shorter side padded', () => {
    const blocks = createDiffBlocks('a\nb\nc', 'a\nB\nC\nD');
    const rows = createSplitRows(blocks, { context: 3, expanded: new Set() });
    expect(describeSplit(rows)).toEqual(['1|1', '2|2', '3|3', '-|4']);
    expect(rows.map((row) => (row.kind === 'line' ? row.change : 'fold'))).toEqual([null, 0, 0, 0]);
  });

  it('UIC-TEXT-DIFF-1.6 folds unchanged runs down to their context', () => {
    const before = [...lines(10), 'old', ...lines(10, 'tail')].join('\n');
    const after = [...lines(10), 'new', ...lines(10, 'tail')].join('\n');
    const blocks = createDiffBlocks(before, after);
    const rows = createUnifiedRows(blocks, { context: 2, expanded: new Set() });
    expect(describeUnified(rows)).toEqual([
      'fold 8',
      'unchanged 9/9',
      'unchanged 10/10',
      'removed 11/-',
      'added -/11',
      'unchanged 12/12',
      'unchanged 13/13',
      'fold 8',
    ]);
    expect(rows[0]).toMatchObject({ kind: 'fold', block: 0, firstKey: 'u1' });
    expect(rows.at(-1)).toMatchObject({ kind: 'fold', block: 2, firstKey: 'u14' });
    const opened = createUnifiedRows(blocks, { context: 2, expanded: new Set([0]) });
    expect(describeUnified(opened).slice(0, 3)).toEqual([
      'unchanged 1/1',
      'unchanged 2/2',
      'unchanged 3/3',
    ]);
    expect(describeSplit(createSplitRows(blocks, { context: 2, expanded: new Set([2]) }))).toEqual([
      'fold 8',
      '9|9',
      '10|10',
      '11|11',
      ...lines(10).map((_, index) => `${12 + index}|${12 + index}`),
    ]);
  });

  it('UIC-TEXT-DIFF-1.6 keeps short runs and texts without changes whole', () => {
    const middle = createDiffBlocks('x\na\nb\nc\nd\ny', 'X\na\nb\nc\nd\nY');
    expect(
      createUnifiedRows(middle, { context: 2, expanded: new Set() }).some(
        (row) => row.kind === 'fold',
      ),
    ).toBe(false);
    const same = createDiffBlocks(lines(30).join('\n'), lines(30).join('\n'));
    expect(createUnifiedRows(same, { context: 0, expanded: new Set() })).toHaveLength(30);
  });
});
