'use client';

import { Children, type CSSProperties, type KeyboardEvent, type ReactNode, useId } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { carouselHooks as hooks } from './carousel-hooks.js';
import {
  type CarouselPaging,
  findLastStart,
  findPage,
  listPageStarts,
  resolveMove,
  toSlideCount,
} from './carousel-pages.js';
import {
  CarouselControls,
  type CarouselPagination,
  CarouselPaginationButtons,
} from './carousel-parts.js';
import { type CarouselMountSlides, CarouselViewport } from './carousel-viewport.js';
import { useCarouselAutoplay } from './use-carousel-autoplay.js';
import { useCarouselSwipe } from './use-carousel-swipe.js';

export type { CarouselPagination } from './carousel-parts.js';
export type { CarouselMountSlides } from './carousel-viewport.js';

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
  /** How many slides show together. Defaults to 1. */
  slidesPerPage?: number | undefined;
  /** How many slides one move advances. Defaults to `slidesPerPage`. */
  slidesPerMove?: number | undefined;
  /** Lets a touch, pen or mouse swipe across the slides move to the next or previous page. */
  allowsSwiping?: boolean | undefined;
  /** `all` (the default) mounts every slide; `visited` mounts a slide once shown, then keeps it. */
  mountSlides?: CarouselMountSlides | undefined;
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

/** The shown slides, kept within the pages, and the moves between pages. */
function useCarouselIndex({
  index,
  defaultIndex = 0,
  onIndexChange,
  paging,
}: Pick<CarouselProps, 'index' | 'defaultIndex' | 'onIndexChange'> & { paging: CarouselPaging }) {
  const [requested, setIndex] = useControllableState(index, defaultIndex, onIndexChange);
  const current = clamp(Math.trunc(requested) || 0, 0, findLastStart(paging));
  const goTo = (next: number) => {
    if (next === current || next < 0 || next > findLastStart(paging)) return;
    setIndex(next);
  };
  const previous = resolveMove(paging, current, -1);
  const next = resolveMove(paging, current, 1);
  return {
    index: current,
    goTo,
    step: (delta: -1 | 1) => {
      const target = delta === 1 ? next : previous;
      if (target !== null) goTo(target);
    },
    canGoPrevious: previous !== null,
    canGoNext: next !== null,
  };
}

/**
 * The carousel's state: its pages, the shown slides and the moves, automatic rotation (paused while
 * a swipe is under way) and swiping.
 */
type CarouselOptions = Omit<
  CarouselProps,
  'children' | 'pagination' | 'renderThumbnail' | 'mountSlides' | keyof BaseProps | 'ref'
> & { count: number; direction: 'ltr' | 'rtl' };

function useCarousel(props: CarouselOptions) {
  const { count, direction, autoplay = false, interval = defaultInterval } = props;
  const perPage = toSlideCount(props.slidesPerPage);
  const paging: CarouselPaging = {
    count,
    perPage,
    perMove: props.slidesPerMove === undefined ? perPage : toSlideCount(props.slidesPerMove),
    loop: props.loop ?? false,
  };
  const isNavigable = findLastStart(paging) > 0;
  const nav = useCarouselIndex({ ...props, paging });
  const swipe = useCarouselSwipe({
    isEnabled: (props.allowsSwiping ?? false) && isNavigable,
    direction,
    onStep: nav.step,
  });
  const rotation = useCarouselAutoplay({
    isEnabled: autoplay && isNavigable && !swipe.isSwiping,
    interval: Number.isFinite(interval) && interval > 0 ? interval : defaultInterval,
    index: nav.index,
    onAdvance: () => {
      const next = resolveMove({ ...paging, loop: true }, nav.index, 1);
      if (next !== null) nav.goTo(next);
    },
  });
  const starts = listPageStarts(paging);
  return { paging, isNavigable, nav, swipe, rotation, starts, page: findPage(starts, nav.index) };
}

/**
 * Slides shown a page at a time, following the ARIA carousel pattern: previous and next buttons,
 * dots or thumbnails, the arrow keys, optional swiping, and optional automatic rotation with a
 * button that stops it. A page shows `slidesPerPage` slides and a move advances `slidesPerMove`.
 */
export function Carousel({
  children,
  index,
  defaultIndex,
  onIndexChange,
  pagination = 'dots',
  renderThumbnail,
  loop,
  autoplay,
  interval,
  slidesPerPage,
  slidesPerMove,
  allowsSwiping,
  mountSlides = 'all',
  className,
  ...rest
}: CarouselProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const viewportId = useId();
  const slides = Children.toArray(children);
  const { paging, isNavigable, nav, swipe, rotation, starts, page } = useCarousel({
    ...{ index, defaultIndex, onIndexChange, loop, autoplay, interval },
    ...{ slidesPerPage, slidesPerMove, allowsSwiping, count: slides.length, direction },
  });
  return (
    <section
      {...rest}
      {...hooks.root({
        className,
        data: { pagination, rotating: rotation.isRotating, swipeable: swipe.isEnabled },
      })}
      style={{ '--ui-carousel-per-page': paging.perPage } as CSSProperties}
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
        perPage={paging.perPage}
        isRotating={rotation.isRotating}
        mountSlides={mountSlides}
        swipe={swipe}
      />
      {isNavigable && pagination !== 'none' ? (
        <CarouselPaginationButtons
          pagination={pagination}
          starts={starts}
          page={page}
          viewportId={viewportId}
          onSelect={nav.goTo}
          renderThumbnail={renderThumbnail}
        />
      ) : null}
    </section>
  );
}
