import { describe, expect, it } from 'vitest';
import { mergeThreeWay, type MergeChunk } from './three-way-merge.js';

const text = (...lines: string[]) => lines.join('\n');

const summarize = (chunks: MergeChunk[]) =>
  chunks.map((chunk) =>
    chunk.kind === 'unchanged'
      ? `unchanged ${chunk.base.join(',')}`
      : `${chunk.kind} ${chunk.base.join(',')} | ${chunk.ours.join(',')} | ${chunk.theirs.join(',')}`,
  );

/** A small deterministic pseudo-random generator, so the property checks are repeatable. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function editLines(lines: readonly string[], random: () => number, tag: string): string[] {
  return lines.flatMap((line, index) => {
    const roll = random();
    if (roll < 0.1) return [];
    if (roll < 0.2) return [`${tag}${index}`];
    if (roll < 0.25) return [line, `${tag}+${index}`];
    return [line];
  });
}

describe('mergeThreeWay', () => {
  it('UIC-DIFF-4.1 takes changes the sides make to different lines cleanly', () => {
    const base = text('a', 'b', 'c', 'd', 'e');
    const chunks = mergeThreeWay(
      base,
      text('a', 'B', 'c', 'd', 'e'),
      text('a', 'b', 'c', 'D', 'e'),
    );
    expect(summarize(chunks)).toEqual([
      'unchanged a',
      'ours b | B | b',
      'unchanged c',
      'theirs d | d | D',
      'unchanged e',
    ]);
    expect(summarize(mergeThreeWay(base, base, base))).toEqual(['unchanged a,b,c,d,e']);
    expect(mergeThreeWay('', '', '')).toEqual([]);
  });

  it('UIC-DIFF-4.1 keeps the same change on both sides as one clean chunk', () => {
    const chunks = mergeThreeWay(text('a', 'b', 'c'), text('a', 'x', 'c'), text('a', 'x', 'c'));
    expect(summarize(chunks)).toEqual(['unchanged a', 'both b | x | x', 'unchanged c']);
    expect(summarize(mergeThreeWay('a', text('a', 'z'), text('a', 'z')))).toEqual([
      'unchanged a',
      'both  | z | z',
    ]);
  });

  it('UIC-DIFF-4.1 keeps complete insertions and deletions of two hundred thousand lines', () => {
    const lines = Array.from({ length: 200_000 }, (_, index) => `Line ${index}`);
    const source = lines.join('\n');
    expect(mergeThreeWay('', source, '')).toEqual([
      { kind: 'ours', base: [], ours: lines, theirs: [] },
    ]);
    expect(mergeThreeWay(source, '', source)).toEqual([
      { kind: 'ours', base: lines, ours: [], theirs: lines },
    ]);
  });

  it('UIC-DIFF-4.2 marks different changes to the same lines as a conflict', () => {
    const chunks = mergeThreeWay(
      text('a', 'b', 'c', 'd'),
      text('a', 'mine', 'c', 'd'),
      text('a', 'yours', 'yours too', 'd'),
    );
    expect(summarize(chunks)).toEqual([
      'unchanged a',
      'conflict b,c | mine,c | yours,yours too',
      'unchanged d',
    ]);
    expect(chunks[1]).toEqual({
      kind: 'conflict',
      base: ['b', 'c'],
      ours: ['mine', 'c'],
      theirs: ['yours', 'yours too'],
    });
  });

  it('UIC-DIFF-4.2 conflicts on insertions at one place, but not on edits of neighbouring lines', () => {
    expect(
      summarize(mergeThreeWay(text('a', 'b'), text('a', 'x', 'b'), text('a', 'y', 'b'))),
    ).toEqual(['unchanged a', 'conflict  | x | y', 'unchanged b']);
    expect(
      summarize(mergeThreeWay(text('a', 'b', 'c'), text('a', 'B', 'c'), text('a', 'b', 'C'))),
    ).toEqual(['unchanged a', 'ours b | B | b', 'theirs c | c | C']);
    expect(
      summarize(mergeThreeWay(text('a', 'b', 'c'), text('a', 'B', 'c'), text('a', 'b', 'n', 'c'))),
    ).toEqual(['unchanged a', 'conflict b | B | b,n', 'unchanged c']);
    expect(summarize(mergeThreeWay('', 'one', 'two'))).toEqual(['conflict  | one | two']);
    expect(summarize(mergeThreeWay('', '', 'two'))).toEqual(['theirs  |  | two']);
  });

  it('UIC-DIFF-4.2 joins a chain of overlapping changes from both sides into one conflict', () => {
    const base = text('1', '2', '3', '4', '5', '6');
    const chunks = mergeThreeWay(
      base,
      text('1', 'A', 'B', '4', '5', '6'),
      text('1', '2', 'C', 'D', '5', '6'),
    );
    expect(summarize(chunks)).toEqual([
      'unchanged 1',
      'conflict 2,3,4 | A,B,4 | 2,C,D',
      'unchanged 5,6',
    ]);
  });

  it('UIC-DIFF-4.1 rebuilds the base and both sides from the chunks', () => {
    const random = createRandom(7);
    for (let round = 0; round < 40; round += 1) {
      const base = Array.from({ length: 30 }, (_, index) => `line ${index % 7}`);
      const ours = editLines(base, random, 'o');
      const theirs = editLines(base, random, 't');
      const chunks = mergeThreeWay(base.join('\n'), ours.join('\n'), theirs.join('\n'));
      expect(chunks.flatMap((chunk) => chunk.base)).toEqual(base);
      expect(chunks.flatMap((chunk) => chunk.ours)).toEqual(ours);
      expect(chunks.flatMap((chunk) => chunk.theirs)).toEqual(theirs);
      for (const chunk of chunks) {
        if (chunk.kind === 'ours') expect(chunk.theirs).toEqual(chunk.base);
        if (chunk.kind === 'theirs') expect(chunk.ours).toEqual(chunk.base);
        if (chunk.kind === 'both') expect(chunk.ours).toEqual(chunk.theirs);
        if (chunk.kind === 'conflict') expect(chunk.ours).not.toEqual(chunk.theirs);
      }
      expect(
        chunks.some(
          (chunk, index) => chunk.kind === 'unchanged' && chunks[index + 1]?.kind === 'unchanged',
        ),
      ).toBe(false);
    }
  });
});
