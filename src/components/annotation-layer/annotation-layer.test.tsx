import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  AnnotationLayer,
  AnnotationMargin,
  type Annotation,
  type AnnotationLayerProps,
} from './annotation-layer.js';

/** Viewport boxes by element id, and card heights by card text. */
let boxes: Record<string, { top: number; left: number; width?: number; height?: number }>;
let targetRects: Record<
  string,
  Array<{ top: number; left: number; width: number; height: number }>
>;
let cardHeight: number;

class FakeResizeObserver {
  static observers: FakeResizeObserver[] = [];
  readonly elements = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.observers.push(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
}

function resize() {
  act(() => {
    for (const observer of FakeResizeObserver.observers) {
      observer.callback([], observer as unknown as ResizeObserver);
    }
  });
}

beforeEach(() => {
  boxes = { layer: { top: 100, left: 50 }, margin: { top: 100, left: 450 } };
  targetRects = {
    phrase: [
      { top: 140, left: 90, width: 200, height: 20 },
      { top: 160, left: 50, width: 80, height: 20 },
    ],
  };
  cardHeight = 40;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const box = boxes[this.getAttribute('data-box') ?? ''] ?? { top: 0, left: 0 };
    return { ...box, width: box.width ?? 0, height: box.height ?? 0 } as DOMRect;
  });
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (targetRects[this.id] ?? []) as unknown as DOMRectList;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('ui-annotation-layer__card') ? cardHeight : 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  FakeResizeObserver.observers = [];
});

const annotations: Annotation[] = [
  { id: 'figure', rects: [{ top: 10, left: 20, width: 100, height: 60 }] },
  { id: 'phrase', targetId: 'phrase' },
  { id: 'missing', targetId: 'nowhere' },
];

function Notes(props: Partial<AnnotationLayerProps> & { withMargin?: boolean }) {
  const { withMargin = true, ...rest } = props;
  return (
    <AnnotationLayer annotations={annotations} data-box="layer" {...rest}>
      <p>
        Peel the apples, then <span id="phrase">slice them thin and toss them in lemon</span>.
      </p>
      {withMargin ? (
        <AnnotationMargin
          data-box="margin"
          renderCard={(annotation, { isActive, isOrphaned }) => (
            <button type="button">
              Note {annotation.id}
              {isActive ? ' (active)' : ''}
              {isOrphaned ? ' (orphaned)' : ''}
            </button>
          )}
        />
      ) : null}
    </AnnotationLayer>
  );
}

const marks = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-annotation-layer__mark'),
];
const cards = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.ui-annotation-layer__card'),
];

describe('AnnotationLayer', () => {
  it('UIC-ANNOTATION-LAYER-1.1 draws a hidden mark per anchor rectangle over the content', () => {
    const { container } = render(<Notes withMargin={false} defaultActiveId="phrase" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-annotation-layer');
    expect(root).toHaveStyle({ position: 'relative' });
    const layer = container.querySelector('.ui-annotation-layer__marks');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveStyle({ position: 'absolute', pointerEvents: 'none' });
    expect(marks(container)).toHaveLength(3);
    expect(marks(container)[0]).toHaveStyle({
      position: 'absolute',
      top: '10px',
      left: '20px',
      width: '100px',
      height: '60px',
    });
    expect(marks(container).map((mark) => mark.hasAttribute('data-active'))).toEqual([
      false,
      true,
      true,
    ]);
    expectHooksMatchSpec(container, 'ANNOTATION-LAYER', {
      slots: ['marks', 'mark'],
      callerAttributes: ['data-box'],
    });
  });

  it('UIC-ANNOTATION-LAYER-1.2 measures target elements in the content coordinates, again on resize', () => {
    const { container } = render(<Notes withMargin={false} />);
    expect(marks(container)[1]).toHaveStyle({ top: '40px', left: '40px', width: '200px' });
    expect(marks(container)[2]).toHaveStyle({ top: '60px', left: '0px', width: '80px' });
    targetRects.phrase = [{ top: 200, left: 60, width: 120, height: 20 }];
    resize();
    expect(marks(container)).toHaveLength(2);
    expect(marks(container)[1]).toHaveStyle({ top: '100px', left: '10px', width: '120px' });
  });

  it('UIC-ANNOTATION-LAYER-1.3 activates the annotation under a press, the last listed on top', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    const { container } = render(
      <Notes
        annotations={[
          ...annotations,
          { id: 'corner', rects: [{ top: 50, left: 100, width: 40, height: 40 }] },
        ]}
        onActiveChange={onActiveChange}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    await user.pointer({
      keys: '[MouseLeft]',
      target: root,
      coords: { clientX: 80, clientY: 120 },
    });
    expect(onActiveChange).toHaveBeenLastCalledWith('figure');
    await user.pointer({
      keys: '[MouseLeft]',
      target: root,
      coords: { clientX: 160, clientY: 160 },
    });
    expect(onActiveChange).toHaveBeenLastCalledWith('corner');
    await user.pointer({
      keys: '[MouseLeft]',
      target: root,
      coords: { clientX: 400, clientY: 400 },
    });
    expect(onActiveChange).toHaveBeenCalledTimes(2);
    onActiveChange.mockClear();
    // A card activates its own annotation, so press one whose annotation is not under the point.
    await user.pointer({
      keys: '[MouseLeft]',
      target: requireDefined(cards(container)[1]),
      coords: { clientX: 80, clientY: 120 },
    });
    expect(onActiveChange).not.toHaveBeenCalledWith('figure');
  });

  it('UIC-ANNOTATION-LAYER-1.3 follows a controlled active annotation', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [active, setActive] = useState<Key | null>('figure');
      return (
        <>
          <Notes activeId={active} onActiveChange={setActive} />
          <button type="button" onClick={() => setActive(null)}>
            Clear
          </button>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(marks(container)[0]).toHaveAttribute('data-active', 'true');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(container.querySelector('[data-active]')).toBeNull();
  });
});

describe('AnnotationMargin', () => {
  it('UIC-ANNOTATION-LAYER-2.1 keeps numeric and text IDs distinct when a card is removed', () => {
    const entries: Annotation[] = [
      { id: 1, rects: [{ top: 10, left: 20, width: 10, height: 10 }] },
      { id: '1', rects: [{ top: 30, left: 20, width: 10, height: 10 }] },
    ];
    const renderCard = (annotation: Annotation) => `${typeof annotation.id} card`;
    const { rerender } = render(
      <AnnotationLayer annotations={entries}>
        <AnnotationMargin renderCard={renderCard} />
      </AnnotationLayer>,
    );
    const textCard = screen.getByText('string card');
    rerender(
      <AnnotationLayer annotations={entries.slice(1)}>
        <AnnotationMargin renderCard={renderCard} />
      </AnnotationLayer>,
    );
    expect(screen.getByText('string card')).toBe(textCard);
    expect(screen.queryByText('number card')).not.toBeInTheDocument();
  });

  it('UIC-ANNOTATION-LAYER-2.1 keeps the marks of numeric and text IDs distinct', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const entries: Annotation[] = [
      { id: 1, rects: [{ top: 10, left: 20, width: 10, height: 10 }] },
      { id: '1', rects: [{ top: 30, left: 20, width: 10, height: 10 }] },
    ];
    const { container, rerender } = render(<AnnotationLayer annotations={entries} />);
    expect(marks(container)).toHaveLength(2);
    const textMark = marks(container)[1];
    rerender(<AnnotationLayer annotations={entries.slice(1)} />);
    expect(marks(container)).toEqual([textMark]);
    expect(textMark).toHaveStyle({ top: '30px' });
    expect(error).not.toHaveBeenCalled();
  });

  it('UIC-ANNOTATION-LAYER-2.1 lists a card per annotation in anchor order, orphans last', () => {
    const { container } = render(<Notes defaultActiveId="missing" />);
    const list = screen.getByRole('list', { name: 'Annotations' });
    expect(list).toHaveClass('ui-annotation-layer__margin');
    expect(screen.getAllByRole('listitem').map((card) => card.textContent)).toEqual([
      'Note figure',
      'Note phrase',
      'Note missing (active) (orphaned)',
    ]);
    expect(cards(container)[2]).toHaveAttribute('data-orphaned', 'true');
    expect(cards(container)[2]).toHaveAttribute('data-active', 'true');
    expectHooksMatchSpec(container, 'ANNOTATION-LAYER', {
      slots: ['margin', 'card'],
      callerAttributes: ['data-box'],
    });
  });

  it('UIC-ANNOTATION-LAYER-2.1 takes a caller name and refuses to render outside a layer', () => {
    render(
      <UiProvider messages={{ annotations: 'Notes' }}>
        <Notes />
      </UiProvider>,
    );
    expect(screen.getByRole('list', { name: 'Notes' })).toBeInTheDocument();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AnnotationMargin renderCard={() => null} />)).toThrow(
      'AnnotationMargin must be inside an AnnotationLayer.',
    );
  });

  it('UIC-ANNOTATION-LAYER-2.2 stacks the cards beside their anchors without overlap', () => {
    const { container } = render(<Notes />);
    expect(cards(container).map((card) => card.style.top)).toEqual(['10px', '58px', '106px']);
    expect(cards(container)[0]).toHaveStyle({ position: 'absolute' });
    const margin = container.querySelector('.ui-annotation-layer__margin');
    expect(margin).toHaveStyle({ position: 'relative', minHeight: '146px' });
  });

  it('UIC-ANNOTATION-LAYER-2.2 keeps the active card level with its anchor, with a gap', () => {
    cardHeight = 30;
    const { container } = render(
      <AnnotationLayer annotations={annotations} data-box="layer" defaultActiveId="phrase">
        <span id="phrase">slice</span>
        <AnnotationMargin data-box="margin" gap={4} renderCard={() => 'Note'} />
      </AnnotationLayer>,
    );
    expect(cards(container).map((card) => card.style.top)).toEqual(['6px', '40px', '74px']);
  });

  it('UIC-ANNOTATION-LAYER-2.3 lays out again when the margin moves or a card resizes', () => {
    const { container } = render(<Notes />);
    boxes.margin = { top: 80, left: 450 };
    cardHeight = 60;
    resize();
    expect(cards(container).map((card) => card.style.top)).toEqual(['30px', '98px', '166px']);
  });

  it('UIC-ANNOTATION-LAYER-2.4 moves between cards from one tab stop and activates the focused one', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    const { container } = render(<Notes onActiveChange={onActiveChange} />);
    expect(cards(container).map((card) => card.tabIndex)).toEqual([0, -1, -1]);
    await user.tab();
    expect(cards(container)[0]).toHaveFocus();
    expect(onActiveChange).toHaveBeenLastCalledWith('figure');
    await user.keyboard('{ArrowDown}');
    expect(cards(container)[1]).toHaveFocus();
    expect(onActiveChange).toHaveBeenLastCalledWith('phrase');
    expect(cards(container).map((card) => card.tabIndex)).toEqual([-1, 0, -1]);
    await user.keyboard('{End}');
    expect(cards(container)[2]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(cards(container)[2]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cards(container)[0]).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(cards(container)[0]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Note figure (active)' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Note figure (active)' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Note missing (orphaned)' }));
    expect(onActiveChange).toHaveBeenLastCalledWith('missing');
  });

  it('UIC-ANNOTATION-LAYER-3.1 UIC-ANNOTATION-LAYER-3.2 keeps marks decorative and forwards caller attributes', () => {
    const { container } = render(
      <AnnotationLayer annotations={annotations} className="notes" id="notes" data-owner="layer">
        <span id="phrase">slice</span>
        <AnnotationMargin
          className="side"
          id="side"
          data-owner="margin"
          aria-label="Review notes"
          renderCard={() => 'Note'}
        />
      </AnnotationLayer>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-annotation-layer', 'notes');
    expect(root).toHaveAttribute('id', 'notes');
    expect(root).toHaveAttribute('data-owner', 'layer');
    const margin = screen.getByRole('list', { name: 'Review notes' });
    expect(margin).toHaveClass('ui-annotation-layer__margin', 'side');
    expect(margin).toHaveAttribute('id', 'side');
    expect(margin).toHaveAttribute('data-owner', 'margin');
    expect(container.querySelector('.ui-annotation-layer__marks')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'ANNOTATION-LAYER', { callerAttributes: ['data-owner'] });
  });
});
