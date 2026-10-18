import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { useAnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import { getLayerOrigin, type Annotation } from './anchor-geometry.js';
import { stackAnnotationCards } from './stack-cards.js';

/** What a card shows about its annotation. */
export interface AnnotationCardState {
  /** The annotation is the active one. */
  isActive: boolean;
  /** Its anchor is gone: it has no rectangles and no target element in the layer. */
  isOrphaned: boolean;
}

export interface AnnotationMarginProps extends BaseProps, AriaLabellingProps {
  /** Draws an annotation's card. */
  renderCard: (annotation: Annotation, state: AnnotationCardState) => ReactNode;
  /** Space kept between stacked cards, in pixels. Defaults to 8. */
  gap?: number | undefined;
}

/** The margin's measurements: its top in the layer's content and each card's height. */
interface MarginGeometry {
  offset: number;
  heights: ReadonlyMap<Key, number>;
}

const steps: Readonly<Record<string, (index: number, last: number) => number>> = {
  ArrowDown: (index, last) => Math.min(last, index + 1),
  ArrowUp: (index) => Math.max(0, index - 1),
  Home: () => 0,
  End: (_, last) => last,
};

function isSameGeometry(a: MarginGeometry, b: MarginGeometry): boolean {
  if (a.offset !== b.offset || a.heights.size !== b.heights.size) return false;
  for (const [id, height] of a.heights) if (b.heights.get(id) !== height) return false;
  return true;
}

/** Measures the margin's place in its layer and its cards' heights, again on every resize. */
function useMarginGeometry(margin: HTMLElement | null, layer: HTMLElement | null) {
  const cards = useRef(new Map<Key, HTMLElement>());
  const [geometry, setGeometry] = useState<MarginGeometry>({ offset: 0, heights: new Map() });
  const measure = () => {
    if (!margin || !layer) return;
    const heights = new Map<Key, number>();
    for (const [id, card] of cards.current) heights.set(id, card.offsetHeight);
    const offset =
      margin.getBoundingClientRect().top + margin.clientTop - getLayerOrigin(layer).top;
    const next = { offset, heights };
    setGeometry((current) => (isSameGeometry(current, next) ? current : next));
  };
  useLayoutEffect(measure);
  useResizeObserver(() => [margin, ...cards.current.values()], measure);
  const register = (id: Key) => (element: HTMLElement | null) => {
    if (element) cards.current.set(id, element);
    else cards.current.delete(id);
  };
  return { geometry, cards: cards.current, register };
}

/**
 * Lays out a card for each annotation of the layer around it, level with its anchor and stacked
 * without overlap, the active card kept level with its anchor. The cards are a list; arrow keys,
 * Home and End move between them, and focusing a card makes its annotation active.
 */
export function AnnotationMargin({
  renderCard,
  gap = 8,
  className,
  ...rest
}: AnnotationMarginProps) {
  const strings = useUiStrings();
  const { anchors, activeId, setActiveId, layer } = useAnnotationContext();
  const [margin, setMargin] = useState<HTMLDivElement | null>(null);
  const { geometry, cards, register } = useMarginGeometry(margin, layer);
  const byId = new Map(anchors.map((anchor) => [anchor.annotation.id, anchor.annotation]));
  const placements = stackAnnotationCards(
    anchors.map(({ annotation, rects }) => ({
      id: annotation.id,
      anchorTop:
        rects.length === 0 ? null : Math.min(...rects.map((rect) => rect.top)) - geometry.offset,
      height: geometry.heights.get(annotation.id) ?? 0,
    })),
    { activeId, gap },
  );
  const tabStop = placements.some((card) => card.id === activeId) ? activeId : placements[0]?.id;
  const height = placements.reduce(
    (end, card) => Math.max(end, card.top + (geometry.heights.get(card.id) ?? 0)),
    0,
  );
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    const step = steps[event.key];
    if (event.target !== event.currentTarget || !step) return;
    event.preventDefault();
    const card = placements[step(index, placements.length - 1)];
    if (card) cards.get(card.id)?.focus();
  };

  return (
    <div
      aria-label={strings.annotations}
      {...rest}
      {...hooks.slot('margin', undefined, className)}
      ref={setMargin}
      role="list"
      style={{ position: 'relative', minHeight: height }}
    >
      {placements.map((card, index) => {
        const isActive = card.id === activeId;
        return (
          <div
            key={card.id}
            ref={register(card.id)}
            role="listitem"
            tabIndex={card.id === tabStop ? 0 : -1}
            {...hooks.slot('card', { active: isActive, orphaned: card.isOrphaned })}
            style={{ position: 'absolute', top: card.top }}
            onFocus={() => {
              if (!isActive) setActiveId(card.id);
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {renderCard(byId.get(card.id)!, { isActive, isOrphaned: card.isOrphaned })}
          </div>
        );
      })}
    </div>
  );
}
