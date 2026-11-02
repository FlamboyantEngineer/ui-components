'use client';

import { useEditorEffect } from '@handlewithcare/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  OverlayScrollbars,
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

/** A marker's span along the track, in the track's pixels from its top. */
interface TrackMark {
  top: number;
  height: number;
  severity: FieldSeverity;
}

function isSameMarks(previous: readonly TrackMark[], next: readonly TrackMark[]): boolean {
  return (
    previous.length === next.length &&
    previous.every(
      (mark, index) =>
        mark.top === next[index]?.top &&
        mark.height === next[index]?.height &&
        mark.severity === next[index]?.severity,
    )
  );
}

/**
 * Where each marker's blocks lie beside the track: the part of them in the surface's view, in the
 * track's pixels from its top, so a mark sits level with its blocks. Measured in the surface's own
 * pixels, so the marks stay put under an ancestor `transform: scale()`. Blocks out of view draw
 * none, and none draw while the surface does not scroll.
 */
function measureMarks(
  view: EditorView,
  { surface, track }: { surface: HTMLElement; track: HTMLElement | null },
  markers: readonly PlacedMarker[],
): TrackMark[] {
  if (!track || surface.scrollHeight <= surface.clientHeight) return [];
  const trackBox = measureInScroller(track, surface);
  const trackTop = trackBox.top - surface.scrollTop;
  return markers.flatMap((marker) => {
    const first = view.nodeDOM(marker.from);
    const last = view.nodeDOM(marker.last);
    if (!isHTMLElement(first) || !isHTMLElement(last)) return [];
    const end = measureInScroller(last, surface);
    const top = measureInScroller(first, surface).top - surface.scrollTop - trackTop;
    const bottom = end.top + end.height - surface.scrollTop - trackTop;
    const clippedTop = Math.max(0, top);
    const clippedBottom = Math.min(trackBox.height, bottom);
    if (clippedBottom <= clippedTop) return [];
    return [{ top: clippedTop, height: clippedBottom - clippedTop, severity: marker.severity }];
  });
}

/**
 * The shared overlay scrollbars over the editor's surface, with the host's block markers painted
 * in the vertical track beside the blocks in view. They draw only while the surface overflows the height its host gives it;
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
  const [track, setTrack] = useState<HTMLElement | null>(null);
  const { schedule, metrics, verticalTrackRef } = measurement;
  const trackRef = useCallback(
    (element: HTMLElement | null) => {
      setTrack(element);
      verticalTrackRef(element);
    },
    [verticalTrackRef],
  );
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
        const next = measureMarks(view, { surface, track }, markers);
        setMarks((previous) => (isSameMarks(previous, next) ? previous : next));
      };
      update();
      schedule();
      // Scrolling, a new height of the document (an edit, rewrapping), of the surface or of the
      // track moves the marks.
      surface.addEventListener('scroll', update);
      const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      resize?.observe(surface);
      resize?.observe(view.dom);
      if (track) resize?.observe(track);
      return () => {
        surface.removeEventListener('scroll', update);
        resize?.disconnect();
      };
    },
    [surfaceRef, track, markers, schedule],
  );
  return (
    <div {...hooks.slot('scrollbars')}>
      <OverlayScrollbars
        tabIndex={-1}
        viewport={surfaceRef}
        viewportId={surfaceId}
        measurement={{ ...measurement, verticalTrackRef: trackRef }}
        drawX={false}
        drawY={metrics.contentHeight > metrics.height + 1}
        isVisible
        verticalMarks={marks.map((mark, index) => (
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
