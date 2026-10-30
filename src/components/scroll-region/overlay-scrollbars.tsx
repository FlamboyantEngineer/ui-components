'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type ReactNode,
} from 'react';
import type { Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { scrollRegionHooks as hooks } from './styling-hooks.js';
import type { OverlayMeasurement } from './use-overlay-metrics.js';
import { useThumbWheel } from './use-thumb-wheel.js';
import { MIN_THUMB_SIZE, THUMB_ARROW_STEP } from './scroll-region-defaults.js';

interface OverlayScrollbarsProps {
  /** Tab order of the thumbs; native editable viewports already provide keyboard scrolling. */
  tabIndex?: 0 | -1 | undefined;
  /** Decorations inside the vertical track, behind the thumb. */
  verticalMarks?: ReactNode;
  /** The natively scrolling viewport the thumbs scroll. */
  viewport: RefObject<HTMLElement | null>;
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
  tabIndex?: 0 | -1 | undefined;
  orientation: Orientation;
  viewport: RefObject<HTMLElement | null>;
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

interface FocusProps {
  /** Called when focus enters or leaves the thumb, including when a focused thumb disappears. */
  onFocusChange: (isFocused: boolean) => void;
}

interface TrackProps extends ThumbProps, FocusProps {
  marks?: ReactNode;
  trackRef: (element: HTMLElement | null) => void;
  /** Show the track; it stays mounted through its exit. */
  isVisible: boolean;
}

interface ThumbDrag {
  start: number;
  value: number;
}

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

/**
 * A focused thumb that disappears hands focus back to the viewport it scrolls and reports that it
 * lost focus, since a removed element fires no blur.
 */
function useFocusHandback(
  viewport: RefObject<HTMLElement | null>,
  onFocusChange: FocusProps['onFocusChange'],
) {
  const thumb = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = thumb.current;
    const scroller = viewport.current;
    return () => {
      if (element && element.ownerDocument.activeElement === element) {
        scroller?.focus({ preventScroll: true });
        onFocusChange(false);
      }
    };
  }, [viewport, onFocusChange]);
  return thumb;
}

/** Pointer dragging with capture: the viewport scrolls in proportion to the thumb's travel. */
function useThumbDrag(thumb: ThumbProps, travel: number) {
  const vertical = thumb.orientation === 'vertical';
  const coordinate = (event: PointerEvent) => (vertical ? event.clientY : event.clientX);
  return usePointerDrag<HTMLDivElement, ThumbDrag>({
    onStart: (event) => {
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      return { start: coordinate(event), value: clamp(readScrollPosition(thumb), 0, thumb.max) };
    },
    onMove: (event, active) => {
      if (travel <= 0) return;
      const delta = coordinate(event) - active.start;
      scrollViewportTo(thumb, clamp(active.value + (delta / travel) * thumb.max, 0, thumb.max));
    },
  });
}

function OverlayThumb({ onFocusChange, ...props }: ThumbProps & FocusProps) {
  const { orientation, viewport, viewportId, track, page, max, value, rtl } = props;
  const strings = useUiStrings();
  const thumb = useFocusHandback(viewport, onFocusChange);
  useThumbWheel(thumb, { viewport, page, rtl });
  const vertical = orientation === 'vertical';
  const size =
    max > 0 ? Math.min(track, Math.max(MIN_THUMB_SIZE, (track * page) / (max + page))) : track;
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
      tabIndex={max > 0 ? (props.tabIndex ?? 0) : -1}
      hidden={track <= 0}
      style={{
        position: 'absolute',
        pointerEvents: 'auto',
        ...(vertical ? { top: offset, height: size } : { left: offset, width: size }),
      }}
      {...dragHandlers}
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

function OverlayTrack({ trackRef, isVisible, onFocusChange, marks, ...thumb }: TrackProps) {
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
      <OverlayThumb {...thumb} onFocusChange={onFocusChange} />
      {marks}
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
  verticalMarks,
  tabIndex,
}: OverlayScrollbarsProps) {
  const { metrics, schedule, verticalTrackRef, horizontalTrackRef } = measurement;
  const [isFocused, setFocused] = useState(false);
  const shared = {
    viewport,
    viewportId,
    tabIndex,
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
          marks={verticalMarks}
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
