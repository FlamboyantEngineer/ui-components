import { describe, expect, it } from 'vitest';
import {
  compareBlocks,
  type ComparedBlockRow,
  type DocumentBlock,
  type DocumentMark,
} from './compare-blocks.js';

const p = (text: string, id?: DocumentBlock['id']): DocumentBlock => ({
  type: 'paragraph',
  text,
  id,
});

const summarize = (rows: readonly ComparedBlockRow[]) =>
  rows.map(
    (row) =>
      `${row.change}${row.move ? `-${row.move}` : ''}:${row.oldIndex ?? '-'}:${row.newIndex ?? '-'}`,
  );

describe('compareBlocks', () => {
  it('UIC-REDLINE-COMPARE-1.1 encodes numeric and string ids as distinct opaque row keys', () => {
    const { rows, counts } = compareBlocks(
      [p('Numeric', 1), p('Text', '1')],
      [p('Numeric', 1), p('Text', '1')],
    );
    expect(rows.map((row) => row.key)).toEqual(['id:["number","1"]', 'id:["string","1"]']);
    expect(counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 0 });
    const unusual = [Infinity, -Infinity, NaN, 'Infinity', '["number","1"]', 'x|id:y'];
    const blocks = unusual.map((id) => p(String(id), id));
    expect(new Set(compareBlocks(blocks, blocks).rows.map((row) => row.key)).size).toBe(
      unusual.length,
    );
  });

  it('UIC-REDLINE-COMPARE-1.3 links moves between typed and delimiter-containing ids in both directions', () => {
    const blocks = [p('Number', 1), p('String', '1'), p('Delimited', 'x|id:y'), p('Keep', 'keep')];
    for (const [before, after] of [
      [blocks, [blocks[1]!, blocks[2]!, blocks[3]!, blocks[0]!]],
      [[blocks[1]!, blocks[2]!, blocks[3]!, blocks[0]!], blocks],
    ]) {
      const { rows, counts } = compareBlocks(before!, after!);
      expect(counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 1 });
      expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
      const from = rows.find((row) => row.move === 'from')!;
      const to = rows.find((row) => row.move === 'to')!;
      expect(from.oldBlock?.id).toBe(1);
      expect(to.newBlock?.id).toBe(1);
      expect(from.counterpartKey).toBe(to.key);
      expect(to.counterpartKey).toBe(from.key);
    }
  });

  it('UIC-REDLINE-COMPARE-1.3 pairs repeated moved paragraphs in their original order', () => {
    const repeated = Array.from({ length: 128 }, () => p('Repeated paragraph'));
    const anchors = Array.from({ length: 129 }, (_, index) =>
      p(`Anchor ${index}`, `anchor-${index}`),
    );
    const { rows, counts } = compareBlocks([...repeated, ...anchors], [...anchors, ...repeated]);
    const moved = rows.filter((row) => row.move === 'to');
    expect(counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 128 });
    expect(moved.map((row) => [row.oldIndex, row.newIndex])).toEqual(
      repeated.map((_, index) => [index, index + 129]),
    );
    for (const row of moved) {
      const from = rows.find((candidate) => candidate.key === row.counterpartKey)!;
      expect(from.counterpartKey).toBe(row.key);
    }
  });

  it('UIC-REDLINE-COMPARE-1.2 keeps ordered rewritten pairs after an unrelated insertion', () => {
    const oldBlocks = Array.from({ length: 200 }, (_, index) =>
      p(`Line ${index} has several shared words before.`),
    );
    const newBlocks = [
      p('Unrelated.'),
      ...Array.from({ length: 200 }, (_, index) =>
        p(`Line ${index} has several shared words after.`),
      ),
    ];
    const { rows, counts } = compareBlocks(oldBlocks, newBlocks);
    expect(counts).toEqual({ added: 1, removed: 0, changed: 200, moved: 0 });
    expect(
      rows.filter((row) => row.change === 'changed').map((row) => [row.oldIndex, row.newIndex]),
    ).toEqual(oldBlocks.map((_, index) => [index, index + 1]));
  });

  it('UIC-REDLINE-COMPARE-1.1 pairs blocks with equal text in order and diffs changed ids', () => {
    const { rows, counts } = compareBlocks(
      [p('Intro', 'a'), p('Keep the oven hot.', 'b'), p('Serve.', 'c')],
      [p('Intro', 'a'), p('Keep the oven warm.', 'b'), p('Serve.', 'c')],
    );
    expect(summarize(rows)).toEqual(['unchanged:0:0', 'changed:1:1', 'unchanged:2:2']);
    expect(rows[1]).toMatchObject({ oldIndex: 1, newIndex: 1, isTypeChanged: false });
    expect(rows[1]!.words).toEqual([
      { kind: 'equal', text: 'Keep the oven ' },
      { kind: 'delete', text: 'hot' },
      { kind: 'insert', text: 'warm' },
      { kind: 'equal', text: '.' },
    ]);
    expect(rows[0]!.words).toBeUndefined();
    expect(counts).toEqual({ added: 0, removed: 0, changed: 1, moved: 0 });
  });

  it('UIC-REDLINE-COMPARE-1.1 matches blocks without ids by their text', () => {
    const { rows } = compareBlocks([p('One'), p('Two')], [p('One'), p('Two')]);
    expect(summarize(rows)).toEqual(['unchanged:0:0', 'unchanged:1:1']);
    expect(compareBlocks([], []).rows).toEqual([]);
  });

  it('UIC-REDLINE-COMPARE-1.2 marks blocks only one document holds', () => {
    const { rows, counts } = compareBlocks(
      [p('Intro'), p('Old step'), p('End')],
      [p('Intro'), p('End'), p('Appendix')],
    );
    expect(summarize(rows)).toEqual(['unchanged:0:0', 'removed:1:-', 'unchanged:2:1', 'added:-:2']);
    expect(rows[1]).toMatchObject({ oldIndex: 1 });
    expect(rows[1]).not.toHaveProperty('newBlock');
    expect(rows[3]).toMatchObject({ newIndex: 2 });
    expect(rows[3]).not.toHaveProperty('oldBlock');
    expect(counts).toEqual({ added: 1, removed: 1, changed: 0, moved: 0 });
  });

  it('UIC-REDLINE-COMPARE-1.2 pairs similar blocks without ids and leaves different ones apart', () => {
    const { rows, counts } = compareBlocks(
      [p('Intro'), p('Whisk four eggs with the juice.'), p('Bake it.'), p('End')],
      [p('Intro'), p('A new note about tins.'), p('Whisk five eggs with the juice.'), p('End')],
    );
    expect(summarize(rows)).toEqual([
      'unchanged:0:0',
      'added:-:1',
      'changed:1:2',
      'removed:2:-',
      'unchanged:3:3',
    ]);
    expect(counts).toEqual({ added: 1, removed: 1, changed: 1, moved: 0 });
  });

  it('UIC-REDLINE-COMPARE-1.2 never pairs blocks with different ids', () => {
    const { rows } = compareBlocks([p('Same words here', 'a')], [p('Same words here!', 'b')]);
    expect(summarize(rows)).toEqual(['removed:0:-', 'added:-:0']);
  });

  it('UIC-REDLINE-COMPARE-1.3 shows a moved block at both positions, linked', () => {
    const { rows, counts } = compareBlocks(
      [p('First', 'a'), p('Second', 'b'), p('Third', 'c')],
      [p('Second', 'b'), p('Third', 'c'), p('First, revised', 'a')],
    );
    expect(summarize(rows)).toEqual([
      'moved-from:0:-',
      'unchanged:1:0',
      'unchanged:2:1',
      'moved-to:0:2',
    ]);
    expect(rows[0]).toMatchObject({ oldIndex: 0, counterpartKey: rows[3]!.key });
    expect(rows[0]).not.toHaveProperty('newBlock');
    expect(rows[3]).toMatchObject({ oldIndex: 0, newIndex: 2, counterpartKey: rows[0]!.key });
    expect(rows[3]!.words?.map((hunk) => hunk.kind)).toEqual(['equal', 'insert']);
    expect(counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 1 });
  });

  it('UIC-REDLINE-COMPARE-1.3 moves blocks without ids by equal text, but not blank ones', () => {
    const { rows } = compareBlocks(
      [p('Alpha'), p(''), p('Blue'), p('Gamma')],
      [p('Blue'), p('Gamma'), p(''), p('Alpha')],
    );
    expect(rows.filter((row) => row.change === 'moved').map((row) => row.move)).toEqual([
      'from',
      'to',
    ]);
    expect(rows.find((row) => row.move === 'to')?.words).toBeUndefined();
  });

  it('UIC-REDLINE-COMPARE-1.4 notes type, level and format changes', () => {
    const bold: DocumentMark = { type: 'bold', start: 0, end: 4 };
    const { rows, counts } = compareBlocks<DocumentBlock>(
      [
        { id: 'h', type: 'heading', level: 2, text: 'Plan' },
        { id: 'q', type: 'paragraph', text: 'Note' },
        { id: 'm', type: 'paragraph', text: 'Bold', marks: [bold] },
        { id: 'n', type: 'paragraph', text: 'Same', marks: [bold] },
      ],
      [
        { id: 'h', type: 'heading', level: 3, text: 'Plan' },
        { id: 'q', type: 'quote', text: 'Note' },
        { id: 'm', type: 'paragraph', text: 'Bold', marks: [{ ...bold, type: 'italic' }] },
        { id: 'n', type: 'paragraph', text: 'Same!', marks: [bold, { ...bold, end: 0 }] },
      ],
    );
    expect(rows.map((row) => [row.change, row.isTypeChanged, row.isFormatChanged])).toEqual([
      ['changed', true, false],
      ['changed', true, false],
      ['changed', false, true],
      ['changed', false, false],
    ]);
    expect(counts.changed).toBe(4);
    const same = compareBlocks(
      [
        {
          type: 'paragraph',
          text: 'Link',
          marks: [{ type: 'link', start: 0, end: 4, href: '/a' }],
        },
      ],
      [
        {
          type: 'paragraph',
          text: 'Link',
          marks: [{ type: 'link', start: 0, end: 4, href: '/b' }],
        },
      ],
    );
    expect(same.rows[0]).toMatchObject({ change: 'changed', isFormatChanged: true });
  });
});
