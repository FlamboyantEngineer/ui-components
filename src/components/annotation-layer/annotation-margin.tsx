'use client';

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { type Annotation, getLayerFrame } from './anchor-geometry.js';
import { useAnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import { AnnotationMarkerEntry, type AnnotationMarkerState } from './annotation-marker.js';
import { stackAnnotationCards } from './stack-cards.js';

/** What a card shows about its annotation. */
export interface AnnotationCardState {
  /** The annotation is the active one. */
  isActive: boolean;
  /** Its anchor is gone: it has no rectangles and no target element in the layer; a target scrolled or clipped out of view is not gone. */
  isOrphaned: boolean;
}

export interface AnnotationMarginProps
  extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** Draws an annotation's card. */
  renderCard: (annotation: Annotation, state: AnnotationCardState) => ReactNode;
  /** Space kept between stacked cards, in pixels. Defaults to 8. */
  gap?: number | undefined;
  /** Cards for every annotation, or a marker for each that opens its card. Defaults to `'cards'`. */
  presentation?: 'cards' | 'icons' | undefined;
  /** Draws a marker's content in the icons presentation, usually a glyph. Defaults to its number. */
  renderMarker?: ((annotation: Annotation, state: AnnotationMarkerState) => ReactNode) | undefined;
  /** The annotations whose cards are open in the icons presentation. Controlled. */
  openKeys?: Iterable<Key> | undefined;
  /** The annotations whose cards are open at first, uncontrolled. */
  defaultOpenKeys?: Iterable<Key> | undefined;
  /** Called with the open annotations after each change. */
  onOpenChange?: ((keys: Set<Key>) => void) | undefined;
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
    const box = margin.getBoundingClientRect();
    const offset = getLayerFrame(layer).toLocalPoint(box.left, box.top).y + margin.clientTop;
    const next = { offset, heights };
    setGeometry((current) => (isSameGeometry(current, next) ? current : next));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Card heights and the margin's offset exist only once the cards are committed.
  useLayoutEffect(measure);
  useResizeObserver(() => [margin, ...cards.current.values()], measure);
  const register = (id: Key) => (element: HTMLElement | null) => {
    if (element) cards.current.set(id, element);
    else cards.current.delete(id);
  };
  return { geometry, cards, register };
}

/** The annotations whose cards are open, the caller's or the margin's own. */
function useOpenKeys(
  openKeys: Iterable<Key> | undefined,
  defaultOpenKeys: Iterable<Key> | undefined,
  onOpenChange: ((keys: Set<Key>) => void) | undefined,
) {
  const [open, setOpen] = useControllableState(
    openKeys === undefined ? undefined : new Set(openKeys),
    new Set(defaultOpenKeys),
    onOpenChange,
  );
  const toggle = (id: Key, isOpen: boolean) => {
    const next = new Set(open);
    if (isOpen) next.add(id);
    else next.delete(id);
    setOpen(next);
  };
  return { open, toggle };
}

/** The cards' places beside their anchors, the margin's tab stop and the height that holds them. */
function useMarginLayout(margin: HTMLElement | null, gap: number) {
  const context = useAnnotationContext();
  const { anchors, currentKey } = context;
  const { geometry, cards, register } = useMarginGeometry(margin, context.layer);
  const placements = stackAnnotationCards(
    anchors.map(({ annotation, top }) => ({
      id: annotation.id,
      anchorTop: top === null ? null : top - geometry.offset,
      height: geometry.heights.get(annotation.id) ?? 0,
    })),
    { currentKey, gap },
  );
  const tabStop = placements.some((card) => card.id === currentKey)
    ? currentKey
    : placements[0]?.id;
  const height = placements.reduce(
    (end, card) => Math.max(end, card.top + (geometry.heights.get(card.id) ?? 0)),
    0,
  );
  const byId = new Map(anchors.map((anchor) => [anchor.annotation.id, anchor.annotation]));
  const activate = (id: Key) => {
    if (id !== currentKey) context.setCurrentKey(id);
  };
  return { ...context, placements, tabStop, height, byId, cards, register, activate };
}

/** Keeps each annotation's element by its id, for moving focus between them. */
function useElementMap<T extends HTMLElement>() {
  const elements = useRef(new Map<Key, T>());
  const register = (id: Key) => (element: T | null) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  };
  return { elements, register };
}

/** Arrow keys, Home and End on an entry focus another: its card, or in icons its marker. */
function moveFocusFrom(
  placements: readonly { id: Key }[],
  targets: RefObject<ReadonlyMap<Key, HTMLElement>>,
) {
  return (event: KeyboardEvent<HTMLElement>, index: number) => {
    const step = steps[event.key];
    if (event.target !== event.currentTarget || !step) return;
    event.preventDefault();
    const card = placements[step(index, placements.length - 1)];
    if (card) targets.current.get(card.id)?.focus();
  };
}

const toPlace = (top: number) => ({ position: 'absolute', top }) as const;

/** One annotation's card in the cards presentation, itself the list item that takes focus. */
function AnnotationCardEntry({
  cardRef,
  isTabStop,
  state,
  style,
  onFocus,
  onKeyDown,
  children,
}: {
  cardRef: Ref<HTMLDivElement>;
  isTabStop: boolean;
  state: AnnotationCardState;
  style: CSSProperties;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={cardRef}
      role="listitem"
      tabIndex={isTabStop ? 0 : -1}
      {...hooks.slot('card', { active: state.isActive, orphaned: state.isOrphaned })}
      style={style}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

/**
 * Lays out a card for each annotation of the layer around it, level with its anchor and stacked
 * without overlap, the active card kept level with its anchor. The cards are a list; arrow keys,
 * Home and End move between them, and focusing a card makes its annotation active. With
 * `presentation="icons"`, each annotation is a marker instead, which opens its card below it.
 */
export function AnnotationMargin({
  ref,
  renderCard,
  renderMarker,
  gap = 8,
  presentation = 'cards',
  openKeys,
  defaultOpenKeys,
  onOpenChange,
  className,
  ...rest
}: AnnotationMarginProps) {
  const strings = useUiStrings();
  const [margin, setMargin] = useState<HTMLDivElement | null>(null);
  const rootRefs = useMergedRefs(setMargin, ref);
  const layout = useMarginLayout(margin, gap);
  const { placements, currentKey, cards } = layout;
  const markers = useElementMap<HTMLButtonElement>();
  const { open, toggle } = useOpenKeys(openKeys, defaultOpenKeys, onOpenChange);
  const isIcons = presentation === 'icons';
  const onKeyDown = moveFocusFrom(placements, isIcons ? markers.elements : cards);
  const entry = (card: (typeof placements)[number], index: number) => {
    const annotation = requireDefined(layout.byId.get(card.id));
    const isActive = card.id === currentKey;
    const isOpen = open.has(card.id);
    const key = toKeyIdentity(card.id);
    const shared = { onFocus: () => layout.activate(card.id), style: toPlace(card.top) };
    if (!isIcons) {
      return (
        <AnnotationCardEntry
          key={key}
          {...shared}
          cardRef={layout.register(card.id)}
          isTabStop={card.id === layout.tabStop}
          state={{ isActive, isOrphaned: card.isOrphaned }}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {renderCard(annotation, { isActive, isOrphaned: card.isOrphaned })}
        </AnnotationCardEntry>
      );
    }
    return (
      <AnnotationMarkerEntry
        key={key}
        {...shared}
        annotation={annotation}
        state={{ isActive, isOrphaned: card.isOrphaned, isOpen }}
        index={index}
        total={placements.length}
        isTabStop={card.id === layout.tabStop}
        entryRef={layout.register(card.id)}
        markerRef={markers.register(card.id)}
        renderMarker={renderMarker}
        renderCard={renderCard}
        onToggle={() => toggle(card.id, !isOpen)}
        onClose={() => {
          toggle(card.id, false);
          markers.elements.current.get(card.id)?.focus();
        }}
        onMarkerKeyDown={(event) => onKeyDown(event, index)}
      />
    );
  };

  return (
    <div
      aria-label={strings.annotations}
      {...rest}
      {...hooks.slot('margin', { presentation, empty: layout.anchors.length === 0 }, className)}
      ref={rootRefs}
      role="list"
      style={{ position: 'relative', minHeight: layout.height }}
    >
      {placements.map(entry)}
    </div>
  );
}
