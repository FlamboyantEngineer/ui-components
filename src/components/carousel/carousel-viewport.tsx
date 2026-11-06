'use client';

import {
  type Children,
  type CSSProperties,
  isValidElement,
  type Key,
  type ReactNode,
  useRef,
  useState,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { useFocusRecovery } from '../../utils/use-focus-recovery.js';
import { carouselHooks as hooks } from './carousel-hooks.js';

/** Which slides a carousel mounts: every slide, or only the slides shown so far. */
export type CarouselMountSlides = 'all' | 'visited';

interface CarouselViewportProps {
  id: string;
  slides: ReturnType<typeof Children.toArray>;
  /** The first shown slide. */
  index: number;
  /** How many slides show from `index`. */
  perPage: number;
  isRotating: boolean;
  mountSlides: CarouselMountSlides;
  /** Pointer handlers for swiping, and the drag's measured offset while one is under way. */
  swipe: { handlers: Record<string, unknown>; offset: number | null; isEnabled: boolean };
}

/** A slide's key: the child's own key, else its position. */
function toSlideKey(slide: unknown, position: number): Key {
  return isValidElement(slide) && slide.key !== null ? slide.key : position;
}

/**
 * Keeps focus in the carousel when the slide holding it stops being shown, however that happens:
 * a move, a new controlled index, or the slide's removal. Focus lost with the old slide (deep
 * focus, through shadow roots too) moves to the first newly shown one; focus that left the slides
 * (for a control, or elsewhere on the page) is never taken back.
 */
function useSlideFocus() {
  const viewportRef = useRef<HTMLDivElement>(null);
  useFocusRecovery(viewportRef, () => {
    const viewport = viewportRef.current;
    const shown = [...(viewport?.children ?? [])].find((slide) =>
      slide.hasAttribute('data-current'),
    );
    return isHTMLElement(shown) ? shown : null;
  });
  return viewportRef;
}

/**
 * The keys of the slides shown so far, among the slides there are now, so a removed slide's key is
 * forgotten and a new slide under an old position never inherits a visit.
 */
function useVisitedKeys(shownKeys: readonly Key[], allKeys: readonly Key[], isEnabled: boolean) {
  const [visited, setVisited] = useState<ReadonlySet<Key>>(() => new Set(shownKeys));
  if (!isEnabled) return null;
  const missing = shownKeys.filter((key) => !visited.has(key));
  const present = new Set(allKeys);
  const isStale = [...visited].some((key) => !present.has(key));
  if (missing.length > 0 || isStale) {
    setVisited(new Set([...visited, ...missing].filter((key) => present.has(key))));
  }
  return new Set([...visited, ...missing]);
}

/**
 * The live region holding every slide: the shown ones visible, each placed in its column through
 * `--ui-carousel-slot`, the others hidden and inert. With `mountSlides="visited"` a slide not yet
 * shown renders its empty group, and keeps its content once shown.
 */
export function CarouselViewport({
  id,
  slides,
  index,
  perPage,
  isRotating,
  mountSlides,
  swipe,
}: CarouselViewportProps) {
  const strings = useUiStrings();
  const viewportRef = useSlideFocus();
  const keys = slides.map(toSlideKey);
  const shownKeys = keys.slice(index, index + perPage);
  const visited = useVisitedKeys(shownKeys, keys, mountSlides === 'visited');
  const style = {
    ...(swipe.isEnabled ? { touchAction: 'pan-y pinch-zoom' } : {}),
    ...(swipe.offset === null ? {} : { '--ui-carousel-swipe-offset': `${swipe.offset}px` }),
  } as CSSProperties;
  return (
    <div
      {...hooks.slot('viewport', { swiping: swipe.offset !== null })}
      {...swipe.handlers}
      ref={viewportRef}
      id={id}
      aria-live={isRotating ? 'off' : 'polite'}
      style={style}
    >
      {slides.map((slide, position) => {
        const isShown = position >= index && position < index + perPage;
        const key = keys[position] ?? position;
        const content: ReactNode = visited === null || visited.has(key) ? slide : null;
        return (
          <div
            key={key}
            {...hooks.slot('slide', {
              current: isShown,
              mounted: visited === null ? undefined : content !== null,
            })}
            role="group"
            aria-roledescription={strings.slide}
            aria-label={strings.stepOfTotal(position + 1, slides.length)}
            tabIndex={-1}
            hidden={!isShown}
            inert={!isShown}
            style={
              isShown
                ? ({ '--ui-carousel-slot': position - index + 1 } as CSSProperties)
                : undefined
            }
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
