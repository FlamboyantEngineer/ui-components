import { describe, expect, it } from 'vitest';
import { stackAnnotationCards } from './stack-cards.js';

const cards = [
  { id: 'c', anchorTop: 120, height: 40 },
  { id: 'a', anchorTop: 0, height: 50 },
  { id: 'b', anchorTop: 20, height: 30 },
  { id: 'd', anchorTop: 300, height: 20 },
];

describe('stackAnnotationCards', () => {
  it('UIC-ANNOTATION-LAYER-2.2 stacks cards in anchor order, each below the one before', () => {
    expect(stackAnnotationCards(cards, { currentKey: null, gap: 10 })).toEqual([
      { id: 'a', top: 0, isOrphaned: false },
      { id: 'b', top: 60, isOrphaned: false },
      { id: 'c', top: 120, isOrphaned: false },
      { id: 'd', top: 300, isOrphaned: false },
    ]);
  });

  it('UIC-ANNOTATION-LAYER-2.2 keeps the active card at its anchor where the cards before it fit, never above the top', () => {
    expect(stackAnnotationCards(cards, { currentKey: 'b', gap: 10 })).toEqual([
      { id: 'a', top: 0, isOrphaned: false },
      { id: 'b', top: 60, isOrphaned: false },
      { id: 'c', top: 120, isOrphaned: false },
      { id: 'd', top: 300, isOrphaned: false },
    ]);
    const crowded = [
      { id: 'x', anchorTop: 100, height: 40 },
      { id: 'y', anchorTop: 110, height: 40 },
      { id: 'z', anchorTop: 120, height: 40 },
    ];
    expect(stackAnnotationCards(crowded, { currentKey: 'z', gap: 8 })).toEqual([
      { id: 'x', top: 24, isOrphaned: false },
      { id: 'y', top: 72, isOrphaned: false },
      { id: 'z', top: 120, isOrphaned: false },
    ]);
    expect(stackAnnotationCards(crowded, { currentKey: 'y', gap: 8 })).toEqual([
      { id: 'x', top: 62, isOrphaned: false },
      { id: 'y', top: 110, isOrphaned: false },
      { id: 'z', top: 158, isOrphaned: false },
    ]);
  });

  it('UIC-ANNOTATION-LAYER-2.2 places cards without an anchor after the others', () => {
    const placements = stackAnnotationCards(
      [
        { id: 'gone', anchorTop: null, height: 30 },
        { id: 'a', anchorTop: 40, height: 20 },
        { id: 'lost', anchorTop: null, height: 10 },
      ],
      { currentKey: 'gone', gap: 8 },
    );
    expect(placements).toEqual([
      { id: 'a', top: 40, isOrphaned: false },
      { id: 'gone', top: 68, isOrphaned: true },
      { id: 'lost', top: 106, isOrphaned: true },
    ]);
    expect(stackAnnotationCards([], { currentKey: null, gap: 8 })).toEqual([]);
  });
});
