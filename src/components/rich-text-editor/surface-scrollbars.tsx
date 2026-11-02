'use client';

import { useEditorEffect } from '@handlewithcare/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import { useEffect, useState, type RefObject } from 'react';
import {
  OverlayScrollbars,
  getThumbSpan,
  type OverlayMetrics,
  useOverlayMetrics,
  useSharedViewportObserver,
} from '../scroll-region/scroll-region.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import type { FieldSeverity } from '../field/field.js';
import type { PlacedMarker } from './block-markers.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';

interface SurfaceScrollbarsProps {
  /** The surface, which scrolls natively once the host bounds its height. */
  surfaceRef: RefObject<HTMLDivElement | null>;
  surfaceId: string;
  markers: readonly PlacedMarker[];
}

/** A marker's blocks' span in the surface's scrolled content, in the surface's own pixels. */
interface TrackMark {
  top: number;
  bottom: number;
  severity: FieldSeverity;
}

function isSameMarks(previous: readonly TrackMark[], next: readonly TrackMark[]): boolean {
  return (
    previous.length === next.length &&
    previous.every(
      (mark, index) =>
        mark.top === next[index]?.top &&
        mark.bottom === next[index]?.bottom &&
        mark.severity === next[index]?.severity,
    )
  );
}

/**
 * Where each marker's blocks lie in the surface's scrolled content, measured in the surface's own
 * pixels so the marks stay put under an ancestor `transform: scale()`. None while the surface does
 * not scroll.
 */
function measureMarks(
  view: EditorView,
  surface: HTMLElement,
  markers: readonly PlacedMarker[],
): TrackMark[] {
  if (surface.scrollHeight <= surface.clientHeight) return [];
  return markers.flatMap((marker) => {
    const first = view.nodeDOM(marker.from);
    const last = view.nodeDOM(marker.last);
    if (!isHTMLElement(first) || !isHTMLElement(last)) return [];
    const end = measureInScroller(last, surface);
    const top = measureInScroller(first, surface).top;
    return [{ top, bottom: end.top + end.height, severity: marker.severity }];
  });
}

/**
 * The marks drawn inside the thumb: the view's top, middle and bottom fall at the thumb's top,
 * middle and bottom, so a block's mark sits in the thumb as far down as the block sits in view.
 * Blocks out of view draw none; one partly in view draws its visible part.
 */
function placeInThumb(marks: readonly TrackMark[], metrics: OverlayMetrics) {
  const page = Math.max(0, metrics.height - metrics.header);
  const max = Math.max(0, metrics.contentHeight - metrics.height);
  const thumb = getThumbSpan({ track: metrics.trackY, page, max, value: metrics.top });
  if (metrics.height <= 0) return [];
  const toThumb = (y: number) =>
    thumb.offset +
    (Math.min(Math.max(y - metrics.top, 0), metrics.height) / metrics.height) * thumb.size;
  return marks.flatMap((mark) => {
    if (mark.bottom <= metrics.top || mark.top >= metrics.top + metrics.height) return [];
    const top = toThumb(mark.top);
    return [{ top, height: toThumb(mark.bottom) - top, severity: mark.severity }];
  });
}

/**
 * The shared overlay scrollbars over the editor's surface, with the host's block markers painted
 * in the vertical thumb, where the blocks in view lie. They draw only while the surface overflows the height its host gives it;
 * the document's own keys, the caret and the wheel keep scrolling it natively.
 */
export function SurfaceScrollbars({ surfaceRef, surfaceId, markers }: SurfaceScrollbarsProps) {
  const observer = useSharedViewportObserver(surfaceRef);
  const measurement = useOverlayMetrics({
    viewport: surfaceRef,
    observer,
    enabled: true,
    headerInset: false,
  });
  const [marks, setMarks] = useState<TrackMark[]>([]);
  const { schedule, metrics } = measurement;
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return undefined;
    surface.addEventListener('scroll', schedule);
    schedule();
    return () => surface.removeEventListener('scroll', schedule);
  }, [surfaceRef, schedule]);
  useEditorEffect(
    (view) => {
      const surface = surfaceRef.current;
      if (!surface) return undefined;
      const update = () => {
        const next = measureMarks(view, surface, markers);
        setMarks((previous) => (isSameMarks(previous, next) ? previous : next));
      };
      update();
      schedule();
      // A new height of the document (an edit, rewrapping) or of the surface moves the marks.
      const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      resize?.observe(surface);
      resize?.observe(view.dom);
      return () => resize?.disconnect();
    },
    [surfaceRef, markers, schedule],
  );
  return (
    <div {...hooks.slot('scrollbars')}>
      <OverlayScrollbars
        tabIndex={-1}
        viewport={surfaceRef}
        viewportId={surfaceId}
        measurement={measurement}
        drawX={false}
        drawY={metrics.contentHeight > metrics.height + 1}
        isVisible
        verticalMarks={placeInThumb(marks, metrics).map((mark, index) => (
          <span
            key={index}
            {...hooks.slot('scroll-marker', { severity: mark.severity })}
            aria-hidden="true"
            style={{ top: mark.top, height: mark.height }}
          />
        ))}
      />
    </div>
  );
}
