import { describe, expect, it } from 'vitest';
import {
  diffLines,
  diffSequences,
  diffWords,
  type LineDiffHunk,
  type WordDiffHunk,
} from './diff.js';
import { requireDefined } from './require-defined.js';

function lcsLength(a: readonly string[], b: readonly string[]): number {
  let previous = new Array<number>(b.length + 1).fill(0);
  for (const token of a) {
    const row = [0];
    b.forEach((other, index) => {
      row.push(
        token === other
          ? requireDefined(previous[index]) + 1
          : Math.max(requireDefined(previous[index + 1]), requireDefined(row[index])),
      );
    });
    previous = row;
  }
  return requireDefined(previous[b.length]);
}

function sideOf(hunks: LineDiffHunk[], side: 'old' | 'new'): string[] {
  const skipped = side === 'old' ? 'insert' : 'delete';
  return hunks.filter((hunk) => hunk.kind !== skipped).flatMap((hunk) => hunk.lines);
}

function textOf(hunks: WordDiffHunk[], side: 'old' | 'new'): string {
  const skipped = side === 'old' ? 'insert' : 'delete';
  return hunks
    .filter((hunk) => hunk.kind !== skipped)
    .map((hunk) => hunk.text)
    .join('');
}

/** A small deterministic pseudo-random generator, so the property checks are repeatable. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe('diffLines', () => {
  it('UIC-DIFF-1.1 returns equal, deleted and inserted runs with line numbers', () => {
    expect(diffLines('apple\nbanana\ncherry', 'apple\nblueberry\ncherry\ndate')).toEqual([
      { kind: 'equal', lines: ['apple'], oldStart: 1, newStart: 1 },
      { kind: 'delete', lines: ['banana'], oldStart: 2, newStart: 2 },
      { kind: 'insert', lines: ['blueberry'], oldStart: 3, newStart: 2 },
      { kind: 'equal', lines: ['cherry'], oldStart: 3, newStart: 3 },
      { kind: 'insert', lines: ['date'], oldStart: 4, newStart: 4 },
    ]);
  });

  it('UIC-DIFF-1.1 handles empty, equal and wholly different texts', () => {
    expect(diffLines('', '')).toEqual([]);
    expect(diffLines('', 'one\ntwo')).toEqual([
      { kind: 'insert', lines: ['one', 'two'], oldStart: 1, newStart: 1 },
    ]);
    expect(diffLines('one\ntwo', '')).toEqual([
      { kind: 'delete', lines: ['one', 'two'], oldStart: 1, newStart: 1 },
    ]);
    expect(diffLines('same\ntext', 'same\ntext')).toEqual([
      { kind: 'equal', lines: ['same', 'text'], oldStart: 1, newStart: 1 },
    ]);
    expect(diffLines('a\nb', 'c\nd')).toEqual([
      { kind: 'delete', lines: ['a', 'b'], oldStart: 1, newStart: 1 },
      { kind: 'insert', lines: ['c', 'd'], oldStart: 3, newStart: 1 },
    ]);
  });

  it('UIC-DIFF-1.2 splits lines at every line break and lets a final break end the last line', () => {
    expect(diffLines('one\r\ntwo\rthree\n', 'one\ntwo\nthree')).toEqual([
      { kind: 'equal', lines: ['one', 'two', 'three'], oldStart: 1, newStart: 1 },
    ]);
    expect(diffLines('one\n\n', 'one\n')).toEqual([
      { kind: 'equal', lines: ['one'], oldStart: 1, newStart: 1 },
      { kind: 'delete', lines: [''], oldStart: 2, newStart: 2 },
    ]);
  });

  it('UIC-DIFF-1.3 keeps the most lines in common, deleting before inserting in each change', () => {
    const random = createRandom(7);
    const pool = ['a', 'b', 'c', 'd'];
    for (let round = 0; round < 300; round += 1) {
      const make = () =>
        Array.from({ length: Math.floor(random() * 12) }, () =>
          requireDefined(pool[Math.floor(random() * 4)]),
        );
      const oldLines = make();
      const newLines = make();
      const hunks = diffLines(oldLines.join('\n'), newLines.join('\n'));
      expect(sideOf(hunks, 'old')).toEqual(oldLines);
      expect(sideOf(hunks, 'new')).toEqual(newLines);
      const kept = hunks.filter((hunk) => hunk.kind === 'equal').flatMap((hunk) => hunk.lines);
      expect(kept.length).toBe(lcsLength(oldLines, newLines));
      hunks.forEach((hunk, index) => {
        expect(hunk.lines.length).toBeGreaterThan(0);
        const next = hunks[index + 1];
        if (next) expect(`${hunk.kind}>${next.kind}`).not.toMatch(/^(\w+)>\1$|^insert>delete$/);
      });
    }
  });

  it('UIC-DIFF-1.3 stays fast on long texts with scattered changes', () => {
    const oldLines = Array.from({ length: 20000 }, (_, index) => `Line ${index}`);
    const newLines = oldLines.map((line, index) => (index % 1000 === 0 ? `${line} edited` : line));
    const started = performance.now();
    const hunks = diffLines(oldLines.join('\n'), newLines.join('\n'));
    expect(performance.now() - started).toBeLessThan(2000);
    expect(hunks.filter((hunk) => hunk.kind === 'insert')).toHaveLength(20);
    expect(hunks.at(-1)).toEqual({
      kind: 'equal',
      lines: oldLines.slice(19001),
      oldStart: 19002,
      newStart: 19002,
    });
    const unrelated = diffLines(
      Array.from({ length: 3000 }, (_, index) => `old ${index}`).join('\n'),
      Array.from({ length: 3000 }, (_, index) => `new ${index}`).join('\n'),
    );
    expect(unrelated.map((hunk) => hunk.kind)).toEqual(['delete', 'insert']);
  });

  it('UIC-DIFF-1.3 replaces texts with no line in common at once, at any length', () => {
    // The search would take tens of seconds here; texts with nothing in common skip it.
    const lines = 20_000;
    const before = Array.from({ length: lines }, (_, index) => `old ${index}`);
    const after = Array.from({ length: lines }, (_, index) => `new ${index}`);
    const started = performance.now();
    const hunks = diffLines(before.join('\n'), after.join('\n'));
    expect(performance.now() - started).toBeLessThan(1000);
    expect(hunks).toEqual([
      { kind: 'delete', lines: before, oldStart: 1, newStart: 1 },
      { kind: 'insert', lines: after, oldStart: lines + 1, newStart: 1 },
    ]);
  });

  it('UIC-DIFF-1.3 replaces a disjoint middle between a shared start and end', () => {
    const before = ['head', 'old 1', 'old 2', 'old 2', 'tail'];
    const after = ['head', 'new 1', 'new 1', 'tail'];
    expect(
      diffLines(before.join('\n'), after.join('\n')).map(({ kind, lines }) => [kind, lines]),
    ).toEqual([
      ['equal', ['head']],
      ['delete', ['old 1', 'old 2', 'old 2']],
      ['insert', ['new 1', 'new 1']],
      ['equal', ['tail']],
    ]);
    // One shared line in the middle is still found and kept.
    const overlapping = diffLines(
      ['head', 'old 1', 'shared', 'old 2', 'tail'].join('\n'),
      ['head', 'new 1', 'shared', 'new 2', 'tail'].join('\n'),
    );
    expect(
      overlapping.filter((hunk) => hunk.kind === 'equal').flatMap((hunk) => hunk.lines),
    ).toEqual(['head', 'shared', 'tail']);
  });
});

describe('diffWords', () => {
  it('UIC-DIFF-2.1 returns equal, deleted and inserted runs of words', () => {
    expect(diffWords('The red apple is ripe.', 'The green apple is very ripe!')).toEqual([
      { kind: 'equal', text: 'The ' },
      { kind: 'delete', text: 'red' },
      { kind: 'insert', text: 'green' },
      { kind: 'equal', text: ' apple is ' },
      { kind: 'insert', text: 'very ' },
      { kind: 'equal', text: 'ripe' },
      { kind: 'delete', text: '.' },
      { kind: 'insert', text: '!' },
    ]);
    expect(diffWords('', '')).toEqual([]);
    expect(diffWords('', 'New text')).toEqual([{ kind: 'insert', text: 'New text' }]);
    expect(diffWords('Old text', '')).toEqual([{ kind: 'delete', text: 'Old text' }]);
  });

  it('UIC-DIFF-2.2 compares whole words, spaces and marks, in any script', () => {
    expect(diffWords('colour', 'color')).toEqual([
      { kind: 'delete', text: 'colour' },
      { kind: 'insert', text: 'color' },
    ]);
    expect(diffWords('café crème', 'café noir')).toEqual([
      { kind: 'equal', text: 'café ' },
      { kind: 'delete', text: 'crème' },
      { kind: 'insert', text: 'noir' },
    ]);
    expect(diffWords('a  b', 'a b')).toEqual([
      { kind: 'equal', text: 'a' },
      { kind: 'delete', text: '  ' },
      { kind: 'insert', text: ' ' },
      { kind: 'equal', text: 'b' },
    ]);
  });

  it('UIC-DIFF-2.3 joins changes separated only by spaces', () => {
    expect(diffWords('The quick brown fox', 'The slow red fox')).toEqual([
      { kind: 'equal', text: 'The ' },
      { kind: 'delete', text: 'quick brown' },
      { kind: 'insert', text: 'slow red' },
      { kind: 'equal', text: ' fox' },
    ]);
    const random = createRandom(11);
    const words = ['pear', 'plum', ' ', ',', 'fig'];
    for (let round = 0; round < 200; round += 1) {
      const make = () =>
        Array.from({ length: Math.floor(random() * 10) }, () =>
          requireDefined(words[Math.floor(random() * 5)]),
        )
          .join('')
          .trim();
      const before = make();
      const after = make();
      const hunks = diffWords(before, after);
      expect(textOf(hunks, 'old')).toBe(before);
      expect(textOf(hunks, 'new')).toBe(after);
    }
  });
});

describe('diffSequences', () => {
  it('UIC-DIFF-3.1 returns equal, deleted and inserted runs of items compared with ===', () => {
    expect(diffSequences(['a', 'b', 'c', 'd'], ['a', 'c', 'e', 'd'])).toEqual([
      { kind: 'equal', items: ['a'] },
      { kind: 'delete', items: ['b'] },
      { kind: 'equal', items: ['c'] },
      { kind: 'insert', items: ['e'] },
      { kind: 'equal', items: ['d'] },
    ]);
    expect(diffSequences([1, 2, 3], [3, 1, 2])).toEqual([
      { kind: 'insert', items: [3] },
      { kind: 'equal', items: [1, 2] },
      { kind: 'delete', items: [3] },
    ]);
    expect(diffSequences([], [])).toEqual([]);
    expect(diffSequences([1, 2], [])).toEqual([{ kind: 'delete', items: [1, 2] }]);
  });
});
