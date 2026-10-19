import { describe, expect, it } from 'vitest';
import {
  compareBlocks,
  type ComparedBlockRow,
  type DocumentBlock,
  type DocumentMark,
} from './compare-blocks.js';

const p = (text: string, id?: string): DocumentBlock => ({ type: 'paragraph', text, id });

const summarize = (rows: readonly ComparedBlockRow[]) =>
  rows.map((row) => `${row.change}${row.move ? `-${row.move}` : ''}:${row.key}`);

describe('compareBlocks', () => {
  it('UIC-REDLINE-COMPARE-1.1 pairs blocks with equal text in order and diffs changed ids', () => {
    const { rows, counts } = compareBlocks(
      [p('Intro', 'a'), p('Keep the oven hot.', 'b'), p('Serve.', 'c')],
      [p('Intro', 'a'), p('Keep the oven warm.', 'b'), p('Serve.', 'c')],
    );
    expect(summarize(rows)).toEqual(['unchanged:id:a', 'changed:id:b', 'unchanged:id:c']);
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
    expect(summarize(rows)).toEqual(['unchanged:pair:0:0', 'unchanged:pair:1:1']);
    expect(compareBlocks([], []).rows).toEqual([]);
  });

  it('UIC-REDLINE-COMPARE-1.2 marks blocks only one document holds', () => {
    const { rows, counts } = compareBlocks(
      [p('Intro'), p('Old step'), p('End')],
      [p('Intro'), p('End'), p('Appendix')],
    );
    expect(summarize(rows)).toEqual([
      'unchanged:pair:0:0',
      'removed:old:1',
      'unchanged:pair:2:1',
      'added:new:2',
    ]);
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
      'unchanged:pair:0:0',
      'added:new:1',
      'changed:pair:1:2',
      'removed:old:2',
      'unchanged:pair:3:3',
    ]);
    expect(counts).toEqual({ added: 1, removed: 1, changed: 1, moved: 0 });
  });

  it('UIC-REDLINE-COMPARE-1.2 never pairs blocks with different ids', () => {
    const { rows } = compareBlocks([p('Same words here', 'a')], [p('Same words here!', 'b')]);
    expect(summarize(rows)).toEqual(['removed:id:a', 'added:id:b']);
  });

  it('UIC-REDLINE-COMPARE-1.3 shows a moved block at both positions, linked', () => {
    const { rows, counts } = compareBlocks(
      [p('First', 'a'), p('Second', 'b'), p('Third', 'c')],
      [p('Second', 'b'), p('Third', 'c'), p('First, revised', 'a')],
    );
    expect(summarize(rows)).toEqual([
      'moved-from:moved-from:id:a',
      'unchanged:id:b',
      'unchanged:id:c',
      'moved-to:id:a',
    ]);
    expect(rows[0]).toMatchObject({ oldIndex: 0, counterpartKey: 'id:a' });
    expect(rows[0]).not.toHaveProperty('newBlock');
    expect(rows[3]).toMatchObject({ oldIndex: 0, newIndex: 2, counterpartKey: 'moved-from:id:a' });
    expect(rows[3]!.words?.map((hunk) => hunk.kind)).toEqual(['equal', 'insert']);
    expect(counts).toEqual({ added: 0, removed: 0, changed: 0, moved: 1 });
  });

  it('UIC-REDLINE-COMPARE-1.3 moves blocks without ids by equal text, but not blank ones', () => {
    const { rows } = compareBlocks(
      [p('Alpha'), p(''), p('Blue'), p('Gamma')],
      [p('Blue'), p('Gamma'), p(''), p('Alpha')],
    );
    expect(rows.filter((row) => row.change === 'moved').map((row) => row.key)).toEqual([
      'moved-from:old:0',
      'new:3',
    ]);
    expect(rows.find((row) => row.key === 'new:3')?.words).toBeUndefined();
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
