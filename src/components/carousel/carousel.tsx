'use client';

import {
  Children,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { containsComposed, getComposedActiveElement } from '../../utils/focus-target.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isHTMLElement, isNode } from '../../utils/is-element.js';
import {
  CarouselControls,
  CarouselPaginationButtons,
  type CarouselPagination,
} from './carousel-parts.js';
import { useCarouselAutoplay } from './use-carousel-autoplay.js';
import { clamp } from '../../utils/clamp.js';
import { carouselHooks as hooks } from './carousel-hooks.js';

export type { CarouselPagination } from './carousel-parts.js';

export interface CarouselProps extends BaseProps, AriaLabellingProps, RefProps<HTMLElement> {
  /** The slides, one child each. */
  children: ReactNode;
  /** The shown slide's index (controlled). */
  index?: number | undefined;
  /** The slide shown first (uncontrolled). Defaults to 0. */
  defaultIndex?: number | undefined;
  /** Called with the index of each slide moved to. */
  onIndexChange?: ((index: number) => void) | undefined;
  /** How the reader picks a slide directly: `dots` (the default), `thumbnails` or `none`. */
  pagination?: CarouselPagination | undefined;
  /** A slide's thumbnail with `pagination="thumbnails"`; its button is named, so images are decorative. */
  renderThumbnail?: ((index: number) => ReactNode) | undefined;
  /** Previous on the first slide shows the last, and next on the last shows the first. */
  loop?: boolean | undefined;
  /** Advances on its own, pausing while hovered or focused and starting stopped for reduced motion. */
  autoplay?: boolean | undefined;
  /** The time each slide shows with `autoplay`, in milliseconds. Defaults to 5000. */
  interval?: number | undefined;
}

const defaultInterval = 5000;

/**
 * Keys that move between slides, unless pressed with a modifier, inside a control that uses them, or
 * already handled by a widget inside a slide.
 */
function resolveSlideKey(event: KeyboardEvent, direction: 'ltr' | 'rtl'): -1 | 1 | 0 {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return 0;
  if (isEditableTarget(event.target, '[role="slider"]')) return 0;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  return event.key === forward ? 1 : event.key === backward ? -1 : 0;
}

/** A slide's key: the child's own key, else its position. */
function toSlideKey(slide: unknown, position: number) {
  return isValidElement(slide) && slide.key !== null ? slide.key : position;
}

/** Whether `element` was hidden or removed, rather than left by the reader. */
function isHiddenOrGone(element: Element) {
  return !element.isConnected || element.closest('[hidden], [inert]') !== null;
}

/**
 * Keeps focus in the carousel when the slide holding it stops being shown, however that happens:
 * a move, a new controlled index, or the slide's removal. While focus is inside a slide (deep
 * focus, through shadow roots too), a change of the shown slide moves focus to the newly shown one
 * if focus was lost with the old one. Focus that left the slides (for a control, or elsewhere on
 * the page) is never taken back.
 */
function useSlideFocus(shownKey: unknown) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const isFocusInside = useRef(false);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isFocusInside.current) return;
    const shown = [...viewport.children].find((slide) => slide.hasAttribute('data-current'));
    const active = getComposedActiveElement(viewport);
    if (!isHTMLElement(shown) || containsComposed(shown, active)) return;
    const isLost =
      active === null ||
      active === viewport.ownerDocument.body ||
      containsComposed(viewport, active);
    if (isLost) shown.focus();
  }, [shownKey]);
  const focusHandlers = {
    onFocus: () => {
      isFocusInside.current = true;
    },
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (isNode(next) && containsComposed(event.currentTarget, next)) return;
      if (next === null && isHiddenOrGone(event.target)) return;
      isFocusInside.current = false;
    },
  };
  return { viewportRef, focusHandlers };
}

/** The shown slide, kept within the slides, and the moves between slides. */
function useCarouselIndex({
  index,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  count,
}: Pick<CarouselProps, 'index' | 'defaultIndex' | 'onIndexChange' | 'loop'> & { count: number }) {
  const [requested, setIndex] = useControllableState(index, defaultIndex, onIndexChange);
  const current = clamp(Math.trunc(requested) || 0, 0, Math.max(0, count - 1));
  const goTo = (next: number) => {
    if (next === current || next < 0 || next >= count) return;
    setIndex(next);
  };
  return {
    index: current,
    goTo,
    step: (delta: -1 | 1) => goTo(loop ? (current + delta + count) % count : current + delta),
    canGoPrevious: loop || current > 0,
    canGoNext: loop || current < count - 1,
  };
}

/** The live region holding every slide, only the shown one visible. */
function CarouselViewport({
  id,
  slides,
  index,
  isRotating,
}: {
  id: string;
  slides: ReturnType<typeof Children.toArray>;
  index: number;
  isRotating: boolean;
}) {
  const strings = useUiStrings();
  const { viewportRef, focusHandlers } = useSlideFocus(toSlideKey(slides[index], index));
  return (
    <div
      {...hooks.slot('viewport')}
      {...focusHandlers}
      ref={viewportRef}
      id={id}
      aria-live={isRotating ? 'off' : 'polite'}
    >
      {slides.map((slide, position) => {
        const isCurrent = position === index;
        return (
          <div
            key={toSlideKey(slide, position)}
            {...hooks.slot('slide', { current: isCurrent })}
            role="group"
            aria-roledescription={strings.slide}
            aria-label={strings.stepOfTotal(position + 1, slides.length)}
            tabIndex={-1}
            hidden={!isCurrent}
            inert={!isCurrent}
          >
            {slide}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Slides shown one at a time, following the ARIA carousel pattern: previous and next buttons,
 * dots or thumbnails, the arrow keys, and optional automatic rotation with a button that stops it.
 */
export function Carousel({
  children,
  index: indexProp,
  defaultIndex,
  onIndexChange,
  pagination = 'dots',
  renderThumbnail,
  loop,
  autoplay = false,
  interval = defaultInterval,
  className,
  ...rest
}: CarouselProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const viewportId = useId();
  const slides = Children.toArray(children);
  const count = slides.length;
  const isNavigable = count > 1;
  const nav = useCarouselIndex({ index: indexProp, defaultIndex, onIndexChange, loop, count });
  const rotation = useCarouselAutoplay({
    isEnabled: autoplay && isNavigable,
    interval: Number.isFinite(interval) && interval > 0 ? interval : defaultInterval,
    index: nav.index,
    onAdvance: () => nav.goTo((nav.index + 1) % count),
  });
  return (
    <section
      {...rest}
      {...hooks.root({ className, data: { pagination, rotating: rotation.isRotating } })}
      aria-roledescription={strings.carousel}
      {...rotation.pauseHandlers}
      onKeyDown={(event) => {
        const delta = resolveSlideKey(event, direction);
        if (delta === 0 || !isNavigable) return;
        event.preventDefault();
        nav.step(delta);
      }}
    >
      {isNavigable ? (
        <CarouselControls
          viewportId={viewportId}
          canGoPrevious={nav.canGoPrevious}
          canGoNext={nav.canGoNext}
          onPrevious={() => nav.step(-1)}
          onNext={() => nav.step(1)}
          rotation={autoplay ? rotation : undefined}
        />
      ) : null}
      <CarouselViewport
        id={viewportId}
        slides={slides}
        index={nav.index}
        isRotating={rotation.isRotating}
      />
      {isNavigable && pagination !== 'none' ? (
        <CarouselPaginationButtons
          pagination={pagination}
          count={count}
          index={nav.index}
          viewportId={viewportId}
          onSelect={nav.goTo}
          renderThumbnail={renderThumbnail}
        />
      ) : null}
    </section>
  );
}
