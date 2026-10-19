import { describe, expect, it } from 'vitest';
import { compareBlocks, type DocumentBlock } from '../../utils/compare-blocks.js';
import { createRedlineWords, cutAtMarks, type RedlineWords } from './redline-text.js';

const flatten = (words: RedlineWords[]) =>
  words.map(({ change, runs }) => `${change}:${runs.map((run) => run.text).join('|')}`);

const oldBlock: DocumentBlock = {
  id: 'a',
  type: 'paragraph',
  text: 'Bake the tart hot.',
  marks: [{ type: 'bold', start: 0, end: 4 }],
};
const newBlock: DocumentBlock = {
  id: 'a',
  type: 'paragraph',
  text: 'Bake the tart warm.',
  marks: [{ type: 'italic', start: 9, end: 18 }],
};

describe('cutAtMarks', () => {
  it('UIC-REDLINE-COMPARE-2.3 cuts text where marks start and end and keeps those over each cut', () => {
    const block: DocumentBlock = {
      type: 'paragraph',
      text: 'one two three',
      marks: [
        { type: 'bold', start: 0, end: 7 },
        { type: 'link', start: 4, end: 13, href: '/two' },
        { type: 'code', start: 2, end: 2 },
      ],
    };
    const runs = cutAtMarks('ne two thr', { block, start: 1 });
    expect(runs.map((run) => [run.text, run.marks.map((mark) => mark.type)])).toEqual([
      ['ne ', ['bold']],
      ['two', ['bold', 'link']],
      [' thr', ['link']],
    ]);
    expect(cutAtMarks('', { block, start: 0 })).toEqual([]);
  });
});

describe('createRedlineWords', () => {
  const [row] = compareBlocks([oldBlock], [newBlock]).rows;

  it('UIC-REDLINE-COMPARE-2.1 draws kept, deleted and inserted words inline', () => {
    expect(flatten(createRedlineWords(row!, 'both'))).toEqual([
      'equal:Bake the |tart ',
      'removed:hot',
      'added:warm',
      'equal:.',
    ]);
  });

  it('UIC-REDLINE-COMPARE-2.2 keeps deleted words on the old side and inserted on the new', () => {
    expect(flatten(createRedlineWords(row!, 'old'))).toEqual([
      'equal:Bake| the tart ',
      'removed:hot',
      'equal:.',
    ]);
    expect(flatten(createRedlineWords(row!, 'new'))).toEqual([
      'equal:Bake the |tart ',
      'added:warm',
      'equal:.',
    ]);
  });

  it('UIC-REDLINE-COMPARE-2.3 takes deleted words’ marks from the old block and the rest from the new', () => {
    const words = createRedlineWords(row!, 'both');
    expect(words[0]!.runs.map((run) => run.marks.map((mark) => mark.type))).toEqual([
      [],
      ['italic'],
    ]);
    expect(words[1]!.runs[0]!.marks).toEqual([]);
    expect(words[2]!.runs[0]!.marks.map((mark) => mark.type)).toEqual(['italic']);
  });

  it('UIC-REDLINE-COMPARE-2.1 draws added and removed blocks whole', () => {
    const { rows } = compareBlocks(
      [{ type: 'quote', text: 'Gone' }],
      [{ type: 'code', text: 'x = 1' }],
    );
    const [removed, added] = rows;
    expect(flatten(createRedlineWords(removed!, 'both'))).toEqual(['removed:Gone']);
    expect(flatten(createRedlineWords(removed!, 'old'))).toEqual(['removed:Gone']);
    expect(createRedlineWords(removed!, 'new')).toEqual([]);
    expect(flatten(createRedlineWords(added!, 'both'))).toEqual(['added:x = 1']);
    expect(createRedlineWords(added!, 'old')).toEqual([]);
  });

  it('UIC-REDLINE-COMPARE-2.2 draws a moved block only at its own position on each side', () => {
    const { rows } = compareBlocks(
      [
        { id: 'm', type: 'paragraph', text: 'Moved text' },
        { id: 'k', type: 'paragraph', text: 'Kept' },
      ],
      [
        { id: 'k', type: 'paragraph', text: 'Kept' },
        { id: 'm', type: 'paragraph', text: 'Moved text now' },
      ],
    );
    const from = rows[0]!;
    const to = rows[2]!;
    expect(flatten(createRedlineWords(from, 'both'))).toEqual(['equal:Moved text']);
    expect(flatten(createRedlineWords(from, 'old'))).toEqual(['equal:Moved text']);
    expect(createRedlineWords(from, 'new')).toEqual([]);
    expect(createRedlineWords(to, 'old')).toEqual([]);
    expect(flatten(createRedlineWords(to, 'new'))).toEqual(['equal:Moved text', 'added: now']);
    expect(flatten(createRedlineWords(to, 'both'))).toEqual(['equal:Moved text', 'added: now']);
  });
});
