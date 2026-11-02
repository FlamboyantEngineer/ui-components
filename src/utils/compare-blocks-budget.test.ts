import { describe, expect, it, vi } from 'vitest';
import { compareBlocks, type DocumentBlock } from './compare-blocks.js';
import { diffWords } from './diff.js';

vi.mock('./diff.js', async (importOriginal) => {
  const original = await importOriginal<typeof DiffModule>();
  return { ...original, diffWords: vi.fn(original.diffWords) };
});

import type * as DiffModule from './diff.js';

const vocabulary = [
  'apple pear plum quince cherry orchard ladder basket crate press cider frost',
  'walnut hazel medlar damson sloe rowan elder bramble hedge barrel cellar harvest',
]
  .join(' ')
  .split(' ');

/** The vocabulary's words in an order fixed by `seed`, as a sentence. */
function shuffled(seed: number, words: readonly string[] = vocabulary): string {
  const order = [...words];
  let state = seed;
  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (state * 48_271) % 2_147_483_647;
    const other = state % (index + 1);
    [order[index], order[other]] = [order[other] ?? '', order[index] ?? ''];
  }
  return `${order.join(' ')}.`;
}

const paragraphs = (texts: readonly string[]): DocumentBlock[] =>
  texts.map((text) => ({ type: 'paragraph', text }));

function countDiffs(oldTexts: readonly string[], newTexts: readonly string[]) {
  const diffs = vi.mocked(diffWords);
  diffs.mockClear();
  const { counts } = compareBlocks(paragraphs(oldTexts), paragraphs(newTexts));
  return { counts, diffs: diffs.mock.calls.length };
}

const size = 300;

describe('compareBlocks pairing budget', () => {
  it('UIC-REDLINE-COMPARE-1.2 runs a bounded number of word diffs when the same words are reordered', () => {
    // Every block holds the same words, so no cheap bound rules a pair out, yet no order is close
    // enough to pair: each deleted block runs eight diffs, not one per inserted block.
    const oldTexts = Array.from({ length: size }, (_, index) => shuffled(index + 1));
    const newTexts = Array.from({ length: size }, (_, index) => shuffled(index + 10_001));
    const { counts, diffs } = countDiffs(oldTexts, newTexts);
    expect(counts).toEqual({ added: size, removed: size, changed: 0, moved: 0 });
    expect(diffs).toBe(size * 8);
  });

  it('UIC-REDLINE-COMPARE-1.2 skips blocks that cannot reach the threshold without a diff', () => {
    const oldTexts = Array.from({ length: size }, (_, index) => shuffled(index + 1));
    const otherWords = 'river stone bridge meadow lantern harbour'.split(' ');
    const newTexts = Array.from({ length: size }, (_, index) =>
      index % 2 === 0 ? shuffled(index + 1, otherWords) : `Note ${index}.`,
    );
    expect(countDiffs(oldTexts, newTexts)).toEqual({
      counts: { added: size, removed: size, changed: 0, moved: 0 },
      diffs: 0,
    });
  });

  it('UIC-REDLINE-COMPARE-1.2 still pairs every lightly edited block with two diffs each', () => {
    const oldTexts = Array.from(
      { length: size },
      (_, index) => `${shuffled(index + 1)} Note ${index}`,
    );
    const newTexts = oldTexts.map((text) => text.replace(/^\w+/, 'chestnut'));
    expect(countDiffs(oldTexts, newTexts)).toEqual({
      counts: { added: 0, removed: 0, changed: size, moved: 0 },
      diffs: size * 2,
    });
  });

  it('UIC-REDLINE-COMPARE-1.2 weighs a bounded number of candidates per block when no words are shared', () => {
    /** How many inserted blocks a comparison reads, through a proxy that counts index reads. */
    const countReads = (count: number) => {
      let reads = 0;
      const newBlocks = new Proxy(
        paragraphs(Array.from({ length: count }, (_, index) => `newword${String(index)}`)),
        {
          get(target, property, receiver) {
            if (typeof property === 'string' && /^\d+$/.test(property)) reads += 1;
            return Reflect.get(target, property, receiver) as unknown;
          },
        },
      );
      const oldBlocks = paragraphs(
        Array.from({ length: count }, (_, index) => `oldword${String(index)}`),
      );
      expect(compareBlocks(oldBlocks, newBlocks).counts).toEqual({
        added: count,
        removed: count,
        changed: 0,
        moved: 0,
      });
      return reads;
    };
    const small = countReads(500);
    const large = countReads(1000);
    expect(large).toBeLessThanOrEqual(2 * small + 100);
    expect(large).toBeLessThan(40 * 1000);
  });

  it('UIC-REDLINE-COMPARE-1.2 still pairs an edited block far past the last pair by a word few blocks share', () => {
    const fresh = Array.from({ length: 200 }, (_, index) => `Fresh note ${String(index)}.`);
    const oldTexts = ['The quince harvest fills the cellar.', 'Closing words.'];
    const newTexts = [...fresh, 'The quince harvest fills the old cellar.', 'Closing words!'];
    const { counts } = countDiffs(oldTexts, newTexts);
    expect(counts).toEqual({ added: 200, removed: 0, changed: 2, moved: 0 });
  });
});
