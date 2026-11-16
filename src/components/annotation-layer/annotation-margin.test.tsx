import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { describe, expect, it } from 'vitest';
import type { Key } from '../../core/props.js';
import { toAnchorTop } from './anchor-geometry.js';
import { AnnotationContext } from './annotation-context.js';
import { AnnotationMargin } from './annotation-margin.js';

const rectAt = (top: number) => [{ top, left: 0, width: 10, height: 10 }];

/** A margin over two annotations whose cards each hold a menu button that opens a portal menu. */
function MenuCards({ clearsActiveOnBlur }: { clearsActiveOnBlur?: boolean }) {
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const [menuFor, setMenuFor] = useState<Key | null>(null);
  const anchors = ['first', 'second'].map((id, index) => ({
    annotation: { id },
    rects: rectAt(index * 40),
    top: index * 40,
  }));
  return (
    <>
      <AnnotationContext value={{ anchors, currentKey, setCurrentKey, layer: null }}>
        <AnnotationMargin
          clearsActiveOnBlur={clearsActiveOnBlur}
          renderCard={(annotation, { isActive }) => (
            <>
              <button type="button">
                Note {annotation.id}
                {isActive ? ' (active)' : ''}
              </button>
              <button type="button" aria-haspopup="menu" onClick={() => setMenuFor(annotation.id)}>
                More for {annotation.id}
              </button>
              {menuFor === annotation.id
                ? createPortal(
                    <div role="menu" aria-label="Actions">
                      <button type="button" role="menuitem" autoFocus>
                        Edit
                      </button>
                    </div>,
                    document.body,
                  )
                : null}
            </>
          )}
        />
      </AnnotationContext>
      <button type="button">Outside</button>
      <output>{String(currentKey)}</output>
    </>
  );
}

describe('AnnotationMargin', () => {
  it('UIC-ANNOTATION-LAYER-2.10 opens a card menu without making the card active', async () => {
    const user = userEvent.setup();
    render(<MenuCards />);
    await user.click(screen.getByRole('button', { name: 'More for second' }));
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('null');
    await user.click(screen.getByRole('button', { name: 'Note second' }));
    expect(screen.getByRole('status')).toHaveTextContent('second');
  });

  it('UIC-ANNOTATION-LAYER-2.9 makes no annotation active once focus leaves the margin, with clearsActiveOnBlur', async () => {
    const user = userEvent.setup();
    render(<MenuCards clearsActiveOnBlur />);
    await user.click(screen.getByRole('button', { name: 'Note first' }));
    expect(screen.getByRole('status')).toHaveTextContent('first');
    await user.click(screen.getByRole('button', { name: 'More for first' }));
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Note first (active)' }));
    expect(screen.getByRole('status')).toHaveTextContent('first');
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('null'));
  });

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
