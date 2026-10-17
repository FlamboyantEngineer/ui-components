import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type WheelEvent,
} from 'react';
import type { ComponentHooks, HookProps } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';

export type ScrollAxis = 'x' | 'y' | 'both' | 'none';
type Orientation = 'vertical' | 'horizontal';
type Slot = 'viewport' | 'overview' | 'track' | 'thumb';

/** Smallest thumb length, so a thumb over very long content stays easy to grab. */
export const MIN_THUMB_SIZE = 24;
/** Arrow keys on a thumb scroll this many pixels. */
export const THUMB_ARROW_STEP = 40;

interface Metrics {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  top: number;
  left: number;
  header: number;
  rtl: boolean;
  lift: number;
  trackX: number;
  trackY: number;
}

const EMPTY: Metrics = {
  width: 0,
  height: 0,
  contentWidth: 0,
  contentHeight: 0,
  top: 0,
  left: 0,
  header: 0,
  rtl: false,
  lift: 0,
  trackX: 0,
  trackY: 0,
};

function sameMetrics(left: Metrics, right: Metrics): boolean {
  return (Object.keys(left) as Array<keyof Metrics>).every((key) => left[key] === right[key]);
}

/** Space below content shorter than the viewport, which the horizontal thumb rises over. */
function measureLift(element: HTMLElement): number {
  if (element.scrollHeight > element.clientHeight + 1 || element.children.length === 0) return 0;
  const top = element.getBoundingClientRect().top;
  const bottom = Math.max(
    0,
    ...Array.from(element.children, (child) => child.getBoundingClientRect().bottom - top),
  );
  return Math.max(0, Math.floor(element.clientHeight - bottom));
}

export interface OverlayScrollbarsOptions {
  viewport: RefObject<HTMLDivElement | null>;
  viewportId: string;
  enabled: boolean;
  axis: ScrollAxis;
  /** Measure registered headers and keep the vertical thumb below them. */
  headerInset: boolean;
  hooks: ComponentHooks<Slot>;
}

export interface OverlayScrollbars {
  onScroll: () => void;
  /** Registers a sticky header to exclude from the vertical thumb's range, when insets are on. */
  registerHeader: ((element: HTMLElement | null) => (() => void) | undefined) | undefined;
  /** Root custom properties and overflow states, in overlay mode. */
  header: number;
  lift: number;
  overflowX: boolean;
  overflowY: boolean;
  controls: ReactNode;
}

/**
 * Overlay thumbs for a natively scrolling viewport: content, wheel and touch scrolling stay native,
 * and React draws only the thumbs, positioned with inline offsets inside tracks the stylesheet places.
 */
export function useOverlayScrollbars({
  viewport,
  viewportId,
  enabled,
  axis,
  headerInset,
  hooks,
}: OverlayScrollbarsOptions): OverlayScrollbars {
  const headers = useRef(new Set<HTMLElement>());
  const tracks = useRef<{ x: HTMLElement | null; y: HTMLElement | null }>({ x: null, y: null });
  const observeRef = useRef<(() => void) | null>(null);
  const scheduleRef = useRef<(() => void) | null>(null);
  const [metrics, setMetrics] = useState(EMPTY);

  const registerHeader = useCallback((element: HTMLElement | null) => {
    if (!element) return undefined;
    headers.current.add(element);
    observeRef.current?.();
    return () => {
      headers.current.delete(element);
      observeRef.current?.();
    };
  }, []);

  const verticalTrackRef = useCallback((element: HTMLElement | null) => {
    tracks.current.y = element;
    observeRef.current?.();
  }, []);
  const horizontalTrackRef = useCallback((element: HTMLElement | null) => {
    tracks.current.x = element;
    observeRef.current?.();
  }, []);

  useEffect(() => {
    const element = viewport.current;
    const owner = element?.ownerDocument.defaultView;
    if (!enabled || !element || !owner) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rtl = owner.getComputedStyle(element).direction === 'rtl';
      const next: Metrics = {
        width: element.clientWidth,
        height: element.clientHeight,
        contentWidth: element.scrollWidth,
        contentHeight: element.scrollHeight,
        top: element.scrollTop,
        // Right-to-left positions run from 0 down to the negative range; measure from the left.
        left: rtl
          ? element.scrollWidth - element.clientWidth + element.scrollLeft
          : element.scrollLeft,
        header: headerInset
          ? Math.max(
              0,
              ...Array.from(headers.current, (header) => header.getBoundingClientRect().height),
            )
          : 0,
        rtl,
        lift: measureLift(element),
        trackX: tracks.current.x?.clientWidth ?? 0,
        trackY: tracks.current.y?.clientHeight ?? 0,
      };
      setMetrics((previous) => (sameMetrics(previous, next) ? previous : next));
    };
    const schedule = () => {
      if (!frame) frame = owner.requestAnimationFrame(measure);
    };
    scheduleRef.current = schedule;
    // Without ResizeObserver, scrolling and content mutations still remeasure.
    const resize =
      typeof owner.ResizeObserver === 'function' ? new owner.ResizeObserver(schedule) : null;
    const observeAll = () => {
      if (resize) {
        resize.disconnect();
        resize.observe(element);
        for (const child of element.children) resize.observe(child);
        for (const header of headers.current) resize.observe(header);
        if (tracks.current.x) resize.observe(tracks.current.x);
        if (tracks.current.y) resize.observe(tracks.current.y);
      }
      schedule();
    };
    const mutations = new owner.MutationObserver(observeAll);
    observeRef.current = observeAll;
    mutations.observe(element, { childList: true, subtree: true });
    observeAll();
    return () => {
      scheduleRef.current = null;
      observeRef.current = null;
      resize?.disconnect();
      mutations.disconnect();
      owner.cancelAnimationFrame(frame);
    };
  }, [enabled, headerInset, viewport]);

  const overflowY =
    enabled && (axis === 'y' || axis === 'both') && metrics.contentHeight > metrics.height + 1;
  const overflowX =
    enabled && (axis === 'x' || axis === 'both') && metrics.contentWidth > metrics.width + 1;

  // The live position, which may be ahead of the last measurement between frames.
  const readPosition = (orientation: Orientation) => {
    const element = viewport.current;
    if (!element) return 0;
    if (orientation === 'vertical') return element.scrollTop;
    return metrics.rtl
      ? element.scrollLeft + (metrics.contentWidth - metrics.width)
      : element.scrollLeft;
  };

  const scrollTo = (orientation: Orientation, value: number) => {
    const element = viewport.current;
    if (!element) return;
    if (orientation === 'vertical') element.scrollTop = value;
    else element.scrollLeft = metrics.rtl ? value - (metrics.contentWidth - metrics.width) : value;
    scheduleRef.current?.();
  };

  const controls = enabled ? (
    <>
      {overflowY ? (
        <div
          {...hooks.slot('track', { orientation: 'vertical' })}
          ref={verticalTrackRef}
          style={{ pointerEvents: 'none' }}
        >
          <OverlayThumb
            orientation="vertical"
            hookProps={hooks.slot('thumb', { orientation: 'vertical' })}
            viewport={viewport}
            viewportId={viewportId}
            track={metrics.trackY}
            page={Math.max(0, metrics.height - metrics.header)}
            max={metrics.contentHeight - metrics.height}
            value={metrics.top}
            readValue={() => readPosition('vertical')}
            onChange={(value) => scrollTo('vertical', value)}
          />
        </div>
      ) : null}
      {overflowX ? (
        <div
          {...hooks.slot('track', { orientation: 'horizontal' })}
          ref={horizontalTrackRef}
          style={{ pointerEvents: 'none' }}
        >
          <OverlayThumb
            orientation="horizontal"
            hookProps={hooks.slot('thumb', { orientation: 'horizontal' })}
            viewport={viewport}
            viewportId={viewportId}
            track={metrics.trackX}
            page={metrics.width}
            max={metrics.contentWidth - metrics.width}
            value={metrics.left}
            readValue={() => readPosition('horizontal')}
            onChange={(value) => scrollTo('horizontal', value)}
          />
        </div>
      ) : null}
    </>
  ) : null;

  return {
    onScroll: () => scheduleRef.current?.(),
    registerHeader: enabled && headerInset ? registerHeader : undefined,
    header: metrics.header,
    lift: metrics.lift,
    overflowX,
    overflowY,
    controls,
  };
}

interface OverlayThumbProps {
  orientation: Orientation;
  hookProps: HookProps;
  viewport: RefObject<HTMLDivElement | null>;
  viewportId: string;
  /** Measured length of the track the thumb travels in. */
  track: number;
  /** Visible length of the viewport, for Page Up and Page Down. */
  page: number;
  /** Largest scroll position. */
  max: number;
  value: number;
  /** Reads the live scroll position. */
  readValue(): number;
  onChange(value: number): void;
}

function OverlayThumb({
  orientation,
  hookProps,
  viewport,
  viewportId,
  track,
  page,
  max,
  value,
  readValue,
  onChange,
}: OverlayThumbProps) {
  const strings = useUiStrings();
  const drag = useRef<{ pointerId: number; start: number; value: number } | null>(null);
  const thumb = useRef<HTMLDivElement | null>(null);
  const vertical = orientation === 'vertical';

  // A focused thumb that disappears hands focus back to the viewport it scrolls.
  useLayoutEffect(() => {
    const element = thumb.current;
    const scroller = viewport.current;
    return () => {
      if (element && element.ownerDocument.activeElement === element) {
        scroller?.focus({ preventScroll: true });
      }
    };
  }, [viewport]);

  const size = Math.min(track, Math.max(MIN_THUMB_SIZE, (track * page) / (max + page)));
  const travel = track - size;
  const position = Math.max(0, Math.min(max, value));
  const offset = max > 0 ? (position / max) * travel : 0;
  const clampValue = (next: number) => Math.max(0, Math.min(max, next));

  return (
    <div
      ref={thumb}
      {...hookProps}
      role="scrollbar"
      aria-label={vertical ? strings.scrollVertically : strings.scrollHorizontally}
      aria-controls={viewportId}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      hidden={track <= 0}
      style={
        vertical
          ? { position: 'absolute', top: offset, height: size, pointerEvents: 'auto' }
          : { position: 'absolute', left: offset, width: size, pointerEvents: 'auto' }
      }
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          start: vertical ? event.clientY : event.clientX,
          value: clampValue(readValue()),
        };
      }}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        const active = drag.current;
        if (!active || active.pointerId !== event.pointerId || travel <= 0) return;
        const delta = (vertical ? event.clientY : event.clientX) - active.start;
        onChange(clampValue(active.value + (delta / travel) * max));
      }}
      onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1;
        viewport.current?.scrollBy({ left: event.deltaX * unit, top: event.deltaY * unit });
        event.stopPropagation();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        const current = clampValue(readValue());
        let next: number;
        switch (event.key) {
          case 'Home':
            next = 0;
            break;
          case 'End':
            next = max;
            break;
          case 'PageUp':
            next = current - page;
            break;
          case 'PageDown':
            next = current + page;
            break;
          case 'ArrowUp':
          case 'ArrowDown':
            if (!vertical) return;
            next = current + (event.key === 'ArrowDown' ? THUMB_ARROW_STEP : -THUMB_ARROW_STEP);
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
            if (vertical) return;
            next = current + (event.key === 'ArrowRight' ? THUMB_ARROW_STEP : -THUMB_ARROW_STEP);
            break;
          default:
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        onChange(clampValue(next));
      }}
    />
  );
}
