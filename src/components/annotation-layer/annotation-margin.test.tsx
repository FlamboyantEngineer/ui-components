import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { toAnchorTop } from './anchor-geometry.js';
import { AnnotationContext } from './annotation-context.js';
import { AnnotationMargin } from './annotation-margin.js';

describe('AnnotationMargin', () => {
  it('UIC-ANNOTATION-LAYER-2.2 finds the first anchor line in a large set of rectangles', () => {
    const rects = Array.from({ length: 200_000 }, (_, index) => ({
      top: 200_000 - index,
      left: 0,
      width: 10,
      height: 1,
    }));
    render(
      <AnnotationContext
        value={{
          anchors: [{ annotation: { id: 'note' }, rects, top: toAnchorTop(rects) }],
          currentKey: null,
          setCurrentKey: () => {},
          layer: null,
        }}
      >
        <AnnotationMargin renderCard={() => 'Note'} />
      </AnnotationContext>,
    );
    const card = screen.getByRole('listitem');
    expect(card).toHaveTextContent('Note');
    expect(card.style.top).toBe('1px');
  });

  it.each(['cards', 'icons'] as const)(
    'UIC-ANNOTATION-LAYER-2.7 starts each %s entry where getInlineOffset places it',
    (presentation) => {
      const rect = (top: number) => [{ top, left: 0, width: 10, height: 10 }];
      const anchors = [
        { annotation: { id: 'first' }, rects: rect(0), top: 0 },
        { annotation: { id: 'second' }, rects: rect(40), top: 40 },
      ];
      render(
        <AnnotationContext
          value={{ anchors, currentKey: null, setCurrentKey: () => {}, layer: null }}
        >
          <AnnotationMargin
            presentation={presentation}
            getInlineOffset={(annotation) => (annotation.id === 'second' ? -24 : undefined)}
            renderCard={() => 'Note'}
          />
        </AnnotationContext>,
      );
      const [first, second] = screen.getAllByRole('listitem');
      expect(first?.style.insetInlineStart).toBe('');
      expect(second?.style.insetInlineStart).toBe('-24px');
      expect(second?.style.top).toBe('40px');
    },
  );
});
