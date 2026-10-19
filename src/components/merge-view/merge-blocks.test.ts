import { describe, expect, it } from 'vitest';
import { mergeThreeWay } from '../../utils/three-way-merge.js';
import {
  createMergeBlocks,
  createMergeText,
  getCleanLines,
  getConflictText,
  type ConflictState,
} from './merge-blocks.js';

const base = ['flour', 'sugar', 'eggs', 'milk', 'salt'].join('\n');
const ours = ['flour', 'brown sugar', 'eggs', 'oat milk', 'salt'].join('\n');
const theirs = ['flour', 'sugar', 'eggs', 'cream', 'butter', 'salt'].join('\n');
const markers = { ours: 'Ours', theirs: 'Theirs' };

describe('merge blocks', () => {
  it('UIC-MERGE-VIEW-1.2 numbers each side through its text and pads chunks to their row count', () => {
    const blocks = createMergeBlocks(mergeThreeWay(base, ours, theirs));
    expect(blocks.map((block) => [block.chunk.kind, block.conflict, block.rows])).toEqual([
      ['unchanged', null, 1],
      ['ours', null, 1],
      ['unchanged', null, 1],
      ['conflict', 0, 2],
      ['unchanged', null, 1],
    ]);
    const conflict = blocks[3]!;
    expect(conflict.lines.theirs).toEqual([
      { number: 4, text: 'cream', change: 'conflict' },
      { number: 5, text: 'butter', change: 'conflict' },
    ]);
    expect(conflict.lines.ours).toEqual([{ number: 4, text: 'oat milk', change: 'conflict' }]);
    expect(blocks[4]!.lines.theirs[0]).toEqual({ number: 6, text: 'salt', change: 'unchanged' });
    const clean = blocks[1]!.lines;
    expect([clean.ours[0]!.change, clean.base[0]!.change, clean.theirs[0]!.change]).toEqual([
      'changed',
      'changed',
      'unchanged',
    ]);
  });

  it('UIC-MERGE-VIEW-2.1 merges a clean chunk to the side that changed it', () => {
    const [first, second, third] = mergeThreeWay(
      ['a', 'b', 'c'].join('\n'),
      ['a', 'B', 'c'].join('\n'),
      ['a', 'b', 'C'].join('\n'),
    );
    expect(getCleanLines(first!)).toEqual(['a']);
    expect(getCleanLines(second!)).toEqual(['B']);
    expect(getCleanLines(third!)).toEqual(['C']);
  });

  it('UIC-MERGE-VIEW-2.2 UIC-MERGE-VIEW-2.3 gives a conflict the text of its resolution', () => {
    const conflict = mergeThreeWay(base, ours, theirs)[3]!;
    const text = (state: ConflictState) => getConflictText(conflict, state, markers);
    expect(text({ resolution: 'unresolved' })).toBe(
      ['<<<<<<< Ours', 'oat milk', '=======', 'cream', 'butter', '>>>>>>> Theirs'].join('\n'),
    );
    expect(text({ resolution: 'ours' })).toBe('oat milk');
    expect(text({ resolution: 'theirs' })).toBe('cream\nbutter');
    expect(text({ resolution: 'both' })).toBe('oat milk\ncream\nbutter');
    expect(text({ resolution: 'base' })).toBe('milk');
    expect(text({ resolution: 'edited', text: 'whole milk' })).toBe('whole milk');
  });

  it('UIC-MERGE-VIEW-2.5 joins clean lines and conflict results into the merged text', () => {
    const blocks = createMergeBlocks(mergeThreeWay(base, ours, theirs));
    const merge = (states: ConflictState[], hasFinalBreak = false) =>
      createMergeText({ blocks, states, markers, hasFinalBreak });
    expect(merge([{ resolution: 'theirs' }])).toBe('flour\nbrown sugar\neggs\ncream\nbutter\nsalt');
    expect(merge([{ resolution: 'edited', text: '' }], true)).toBe(
      'flour\nbrown sugar\neggs\nsalt\n',
    );
    expect(merge([{ resolution: 'unresolved' }])).toContain('<<<<<<< Ours\noat milk\n=======');
    expect(createMergeText({ blocks: [], states: [], markers, hasFinalBreak: true })).toBe('');
  });
});
