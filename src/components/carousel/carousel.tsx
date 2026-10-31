'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import {
  CarouselControls,
  CarouselPaginationButtons,
  type CarouselPagination,
} from './carousel-parts.js';
import { useCarouselAutoplay } from './use-carousel-autoplay.js';
import { clamp } from '../../utils/clamp.js';

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

const hooks = createHooks('carousel', ['viewport', 'slide']);

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

/** Moves focus to the shown slide after a change made while focus was inside the slide it hid. */
function useSlideFocus(index: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    viewportRef.current?.querySelector<HTMLElement>(`:scope > [data-current]`)?.focus();
  }, [index]);
  const markIfFocusInside = () => {
    const viewport = viewportRef.current;
    pending.current = viewport?.contains(viewport.ownerDocument.activeElement) ?? false;
  };
  return { viewportRef, markIfFocusInside };
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
  const { viewportRef, markIfFocusInside } = useSlideFocus(current);
  const goTo = (next: number) => {
    if (next === current || next < 0 || next >= count) return;
    markIfFocusInside();
    setIndex(next);
  };
  return {
    index: current,
    viewportRef,
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
  viewportRef,
}: {
  id: string;
  slides: ReturnType<typeof Children.toArray>;
  index: number;
  isRotating: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  const strings = useUiStrings();
  return (
    <div
      {...hooks.slot('viewport')}
      ref={viewportRef}
      id={id}
      aria-live={isRotating ? 'off' : 'polite'}
    >
      {slides.map((slide, position) => {
        const isCurrent = position === index;
        return (
          <div
            key={isValidElement(slide) && slide.key !== null ? slide.key : position}
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
        viewportRef={nav.viewportRef}
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
