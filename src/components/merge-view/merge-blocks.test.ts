import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { mergeThreeWay } from '../../utils/three-way-merge.js';
import {
  type ConflictState,
  createMergeBlocks,
  createMergeText,
  getCleanLines,
  getConflictText,
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
    const conflict = requireDefined(blocks[3]);
    expect(conflict.lines.theirs).toEqual([
      { number: 4, text: 'cream', change: 'conflict' },
      { number: 5, text: 'butter', change: 'conflict' },
    ]);
    expect(conflict.lines.ours).toEqual([{ number: 4, text: 'oat milk', change: 'conflict' }]);
    expect(requireDefined(blocks[4]).lines.theirs[0]).toEqual({
      number: 6,
      text: 'salt',
      change: 'unchanged',
    });
    const clean = requireDefined(blocks[1]).lines;
    expect([
      requireDefined(clean.ours[0]).change,
      requireDefined(clean.base[0]).change,
      requireDefined(clean.theirs[0]).change,
    ]).toEqual(['changed', 'changed', 'unchanged']);
  });

  it('UIC-MERGE-VIEW-2.1 merges a clean chunk to the side that changed it', () => {
    const [first, second, third] = mergeThreeWay(
      ['a', 'b', 'c'].join('\n'),
      ['a', 'B', 'c'].join('\n'),
      ['a', 'b', 'C'].join('\n'),
    );
    expect(getCleanLines(requireDefined(first))).toEqual(['a']);
    expect(getCleanLines(requireDefined(second))).toEqual(['B']);
    expect(getCleanLines(requireDefined(third))).toEqual(['C']);
  });

  it('UIC-MERGE-VIEW-2.2 UIC-MERGE-VIEW-2.3 gives a conflict the text of its resolution', () => {
    const conflict = requireDefined(mergeThreeWay(base, ours, theirs)[3]);
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

  it('UIC-MERGE-VIEW-2.5 keeps empty lines a resolution takes, apart from deleted ones', () => {
    const merge = (sides: [string, string, string], resolution: ConflictState['resolution']) => {
      const blocks = createMergeBlocks(mergeThreeWay(...sides));
      const state = (
        resolution === 'edited' ? { resolution, text: '' } : { resolution }
      ) as ConflictState;
      const states = blocks.flatMap((block) => (block.conflict === null ? [] : [state]));
      return createMergeText({ blocks, states, markers, hasFinalBreak: sides[1].endsWith('\n') });
    };
    expect(merge(['a\nX\nb', 'a\n\nb', 'a\nY\nb'], 'ours')).toBe('a\n\nb');
    expect(merge(['a\n\nb', 'a\nX\nb', 'a\nY\nb'], 'base')).toBe('a\n\nb');
    expect(merge(['a\nX\nb', 'a\n\nb', 'a\nY\nb'], 'both')).toBe('a\n\nY\nb');
    expect(merge(['X\nb', '\nb', 'Y\nb'], 'ours')).toBe('\nb');
    expect(merge(['a\nX', 'a\n', 'a\nY'], 'theirs')).toBe('a\nY\n');
    expect(merge(['a\nX\n', 'a\n\n', 'a\nY\n'], 'ours')).toBe('a\n\n');
    expect(merge(['a\nX\nb', 'a\nb', 'a\nY\nb'], 'ours')).toBe('a\nb');
    expect(merge(['a\nX\nb', 'a\n\nb', 'a\nY\nb'], 'edited')).toBe('a\nb');
    expect(merge(['X', '', 'Y'], 'ours')).toBe('');
    expect(merge(['\n', '\n', '\n'], 'ours')).toBe('\n');
    expect(merge(['', '', ''], 'ours')).toBe('');
  });
});
