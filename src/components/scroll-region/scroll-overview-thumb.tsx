'use client';

import { type RefObject, useEffect, useState } from 'react';
import { clamp } from '../../utils/clamp.js';
import { measureScale } from '../../utils/element-scale.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { MIN_THUMB_SIZE } from './scroll-region-defaults.js';

/** The thumb's place on the track: its offset and length, in track pixels. */
export interface ThumbGeometry {
  offset: number;
  size: number;
  /** How far the container scrolls, in content pixels. */
  max: number;
  /** Content pixels per track pixel of thumb travel. */
  ratio: number;
}

interface ThumbDrag {
  start: number;
  top: number;
  /** Track pixels per client pixel, under any ancestor scaling. */
  scale: number;
}

/**
 * The container's scroll position, read again at most once a frame as it scrolls, and whenever
 * the measurements change.
 */
export function useScrollTop(scrollRef: RefObject<HTMLElement | null>, measured: unknown): number {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const container = scrollRef.current;
    const view = container?.ownerDocument.defaultView;
    if (!container || !view) return undefined;
    let frame = 0;
    const read = () => {
      frame = 0;
      setTop(container.scrollTop);
    };
    const onScroll = () => {
      if (frame === 0) frame = view.requestAnimationFrame(read);
    };
    read();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (frame !== 0) view.cancelAnimationFrame(frame);
    };
  }, [scrollRef, measured]);
  return top;
}

/**
 * Where the thumb sits on a track as tall as the visible height: as long as the visible share of
 * the content, at least `MIN_THUMB_SIZE`, and as far along as the container is scrolled. `null`
 * while the content fits.
 */
export function resolveThumb(height: number, scrollHeight: number, top: number) {
  const max = scrollHeight - height;
  if (height <= 0 || max <= 0) return null;
  const size = Math.min(height, Math.max(MIN_THUMB_SIZE, (height * height) / scrollHeight));
  const travel = height - size;
  return {
    offset: (clamp(top, 0, max) / max) * travel,
    size,
    max,
    ratio: travel > 0 ? max / travel : 0,
  } satisfies ThumbGeometry;
}

/** Dragging the thumb scrolls the container in proportion to its travel along the track. */
export function useThumbDrag(
  scrollRef: RefObject<HTMLElement | null>,
  thumb: ThumbGeometry | null,
) {
  return usePointerDrag<HTMLDivElement, ThumbDrag>({
    isDisabled: thumb === null,
    onStart: (event) => {
      const container = scrollRef.current;
      if (event.button !== 0 || !container) return null;
      event.preventDefault();
      event.stopPropagation();
      const track = event.currentTarget.parentElement ?? event.currentTarget;
      return { start: event.clientY, top: container.scrollTop, scale: measureScale(track).y };
    },
    onMove: (event, drag) => {
      const container = scrollRef.current;
      if (!container || !thumb) return;
      const moved = (event.clientY - drag.start) / drag.scale;
      container.scrollTop = clamp(drag.top + moved * thumb.ratio, 0, thumb.max);
    },
  });
}

/**
 * A press on the track beside the thumb scrolls the container one visible height toward the
 * pointer, as a native scrollbar's track does.
 */
export function pageToward(container: HTMLElement, thumb: ThumbGeometry, y: number): void {
  const page = container.clientHeight;
  const direction = y < thumb.offset ? -1 : 1;
  container.scrollTo({ top: clamp(container.scrollTop + direction * page, 0, thumb.max) });
}
