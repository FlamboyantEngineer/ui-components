import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from 'react';
import type { Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { scrollRegionHooks as hooks } from './styling-hooks.js';
import type { OverlayMeasurement } from './use-overlay-metrics.js';

export interface OverlayScrollbarsProps {
  /** The natively scrolling viewport the thumbs scroll. */
  viewport: RefObject<HTMLDivElement | null>;
  /** The viewport's id, which each thumb controls. */
  viewportId: string | undefined;
  /** The viewport's measured geometry and track refs. */
  measurement: OverlayMeasurement;
  /** Draw the horizontal track. */
  drawX: boolean;
  /** Draw the vertical track. */
  drawY: boolean;
  /** The visibility mode shows the tracks now; a focused thumb also keeps them shown. */
  isVisible: boolean;
}

interface ThumbProps {
  orientation: Orientation;
  viewport: RefObject<HTMLDivElement | null>;
  viewportId: string | undefined;
  /** Measured length of the track the thumb travels in. */
  track: number;
  /** Visible length of the viewport, for Page Up and Page Down. */
  page: number;
  /** Largest scroll position. */
  max: number;
  /** Scroll position at the last measurement. */
  value: number;
  /** The viewport is right to left, so horizontal positions run from 0 down to `-max`. */
  rtl: boolean;
  /** Called after the thumb scrolled the viewport. */
  onScrolled: () => void;
}

interface TrackProps extends ThumbProps {
  trackRef: (element: HTMLElement | null) => void;
  /** Show the track; it stays mounted through its exit. */
  isVisible: boolean;
  /** Called when focus enters or leaves the track's thumb. */
  onFocusChange: (isFocused: boolean) => void;
}

interface ThumbDrag {
  pointerId: number;
  start: number;
  value: number;
}

/** Smallest thumb length, so a thumb over very long content stays easy to grab. */
export const MIN_THUMB_SIZE = 24;
/** Arrow keys on a thumb scroll this many pixels. */
export const THUMB_ARROW_STEP = 40;

const arrowKeys: Readonly<Record<string, { orientation: Orientation; step: number }>> = {
  ArrowUp: { orientation: 'vertical', step: -THUMB_ARROW_STEP },
  ArrowDown: { orientation: 'vertical', step: THUMB_ARROW_STEP },
  ArrowLeft: { orientation: 'horizontal', step: -THUMB_ARROW_STEP },
  ArrowRight: { orientation: 'horizontal', step: THUMB_ARROW_STEP },
};

/** The scroll position a key moves to from `current`, or null for a key the thumb leaves alone. */
function resolveThumbKey(key: string, current: number, thumb: ThumbProps): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return thumb.max;
  if (key === 'PageUp') return current - thumb.page;
  if (key === 'PageDown') return current + thumb.page;
  const arrow = arrowKeys[key];
  return arrow?.orientation === thumb.orientation ? current + arrow.step : null;
}

/** The thumb's live position, which may be ahead of the last measurement between frames. */
function readScrollPosition({ viewport, orientation, rtl, max }: ThumbProps): number {
  const element = viewport.current;
  if (!element) return 0;
  if (orientation === 'vertical') return element.scrollTop;
  return rtl ? element.scrollLeft + max : element.scrollLeft;
}

function scrollViewportTo(thumb: ThumbProps, value: number): void {
  const element = thumb.viewport.current;
  if (!element) return;
  if (thumb.orientation === 'vertical') element.scrollTop = value;
  else element.scrollLeft = thumb.rtl ? value - thumb.max : value;
  thumb.onScrolled();
}

/** A focused thumb that disappears hands focus back to the viewport it scrolls. */
function useFocusHandback(viewport: RefObject<HTMLDivElement | null>) {
  const thumb = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = thumb.current;
    const scroller = viewport.current;
    return () => {
      if (element && element.ownerDocument.activeElement === element) {
        scroller?.focus({ preventScroll: true });
      }
    };
  }, [viewport]);
  return thumb;
}

/** Pointer dragging with capture: the viewport scrolls in proportion to the thumb's travel. */
function useThumbDrag(thumb: ThumbProps, travel: number) {
  const drag = useRef<ThumbDrag | null>(null);
  const vertical = thumb.orientation === 'vertical';
  const coordinate = (event: PointerEvent) => (vertical ? event.clientY : event.clientX);
  const release = () => {
    drag.current = null;
  };
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const value = clamp(readScrollPosition(thumb), 0, thumb.max);
      drag.current = { pointerId: event.pointerId, start: coordinate(event), value };
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const active = drag.current;
      if (!active || active.pointerId !== event.pointerId || travel <= 0) return;
      const delta = coordinate(event) - active.start;
      scrollViewportTo(thumb, clamp(active.value + (delta / travel) * thumb.max, 0, thumb.max));
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      release();
    },
    onPointerCancel: release,
    onLostPointerCapture: release,
  };
}

function OverlayThumb(props: ThumbProps) {
  const { orientation, viewport, viewportId, track, page, max, value } = props;
  const strings = useUiStrings();
  const thumb = useFocusHandback(viewport);
  const vertical = orientation === 'vertical';
  const size = Math.min(track, Math.max(MIN_THUMB_SIZE, (track * page) / (max + page)));
  const travel = track - size;
  const position = clamp(value, 0, max);
  const offset = max > 0 ? (position / max) * travel : 0;
  const dragHandlers = useThumbDrag(props, travel);

  return (
    <div
      ref={thumb}
      {...hooks.slot('thumb', { orientation })}
      role="scrollbar"
      aria-label={vertical ? strings.scrollVertically : strings.scrollHorizontally}
      aria-controls={viewportId}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(position)}
      tabIndex={max > 0 ? 0 : -1}
      hidden={track <= 0}
      style={{
        position: 'absolute',
        pointerEvents: 'auto',
        ...(vertical ? { top: offset, height: size } : { left: offset, width: size }),
      }}
      {...dragHandlers}
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1;
        viewport.current?.scrollBy({ left: event.deltaX * unit, top: event.deltaY * unit });
        event.stopPropagation();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        const current = clamp(readScrollPosition(props), 0, max);
        const next = resolveThumbKey(event.key, current, props);
        if (next === null) return;
        event.preventDefault();
        event.stopPropagation();
        scrollViewportTo(props, clamp(next, 0, max));
      }}
    />
  );
}

/** A press on the track, beside the thumb, scrolls one visible length toward the pointer. */
function pageTowardPointer(event: PointerEvent<HTMLDivElement>, thumb: ThumbProps) {
  const element = event.currentTarget.firstElementChild;
  if (event.button !== 0 || event.target !== event.currentTarget || !element) return;
  event.preventDefault();
  const rect = element.getBoundingClientRect();
  const before =
    thumb.orientation === 'vertical' ? event.clientY < rect.top : event.clientX < rect.left;
  const current = clamp(readScrollPosition(thumb), 0, thumb.max);
  scrollViewportTo(thumb, clamp(current + (before ? -thumb.page : thumb.page), 0, thumb.max));
}

function OverlayTrack({ trackRef, isVisible, onFocusChange, ...thumb }: TrackProps) {
  const element = useRef<HTMLDivElement | null>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(element, isVisible);
  const setElement = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      trackRef(node);
    },
    [trackRef],
  );
  if (!isMounted) return null;
  return (
    <div
      {...hooks.slot('track', {
        orientation: thumb.orientation,
        entering: isEntering,
        exiting: isExiting,
      })}
      ref={setElement}
      onPointerDown={(event) => pageTowardPointer(event, thumb)}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
    >
      <OverlayThumb {...thumb} />
    </div>
  );
}

/**
 * Overlay thumbs for a natively scrolling viewport: content, wheel and touch scrolling stay native,
 * and React draws only the thumbs, positioned with inline offsets inside tracks the stylesheet places.
 * Tracks show and hide with the visibility mode, staying mounted through their exit.
 */
export function OverlayScrollbars({
  viewport,
  viewportId,
  measurement,
  drawX,
  drawY,
  isVisible,
}: OverlayScrollbarsProps) {
  const { metrics, schedule, verticalTrackRef, horizontalTrackRef } = measurement;
  const [isFocused, setFocused] = useState(false);
  const shared = {
    viewport,
    viewportId,
    rtl: metrics.rtl,
    onScrolled: schedule,
    isVisible: isVisible || isFocused,
    onFocusChange: setFocused,
  };
  return (
    <>
      {drawY ? (
        <OverlayTrack
          {...shared}
          orientation="vertical"
          trackRef={verticalTrackRef}
          track={metrics.trackY}
          page={Math.max(0, metrics.height - metrics.header)}
          max={Math.max(0, metrics.contentHeight - metrics.height)}
          value={metrics.top}
        />
      ) : null}
      {drawX ? (
        <OverlayTrack
          {...shared}
          orientation="horizontal"
          trackRef={horizontalTrackRef}
          track={metrics.trackX}
          page={metrics.width}
          max={Math.max(0, metrics.contentWidth - metrics.width)}
          value={metrics.left}
        />
      ) : null}
    </>
  );
}
