import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
          anchors: [{ annotation: { id: 'note' }, rects }],
          activeId: null,
          setActiveId: () => {},
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
});
