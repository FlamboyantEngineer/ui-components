'use client';

import { useEditorEffect } from '@handlewithcare/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import type { RefObject } from 'react';
import { isHTMLElement } from '../../utils/is-element.js';
import {
  EditorScrollbars,
  measureScrollTrackMark,
  type ScrollTrackMark,
  useEditorScrollbars,
} from '../scroll-region/scroll-region.js';
import type { PlacedMarker } from './block-markers.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';

interface SurfaceScrollbarsProps {
  /** The surface, which scrolls natively once the host bounds its height. */
  surfaceRef: RefObject<HTMLDivElement | null>;
  surfaceId: string;
  markers: readonly PlacedMarker[];
}

/**
 * Where each marker's blocks lie in the surface's whole scrolled height, measured in the
 * surface's own pixels so the marks stay put under an ancestor `transform: scale()`. None while
 * the surface does not scroll.
 */
function measureMarks(
  view: EditorView,
  surface: HTMLElement,
  markers: readonly PlacedMarker[],
): ScrollTrackMark[] {
  const height = surface.scrollHeight;
  if (height <= surface.clientHeight) return [];
  return markers.flatMap((marker) => {
    const first = view.nodeDOM(marker.from);
    const last = view.nodeDOM(marker.last);
    if (!isHTMLElement(first) || !isHTMLElement(last)) return [];
    return [measureScrollTrackMark({ first, last, severity: marker.severity }, surface, height)];
  });
}

/**
 * The shared overlay scrollbars over the editor's surface, with the host's block markers painted
 * in the vertical track. They draw only while the surface overflows the height its host gives it;
 * the document's own keys, the caret and the wheel keep scrolling it natively.
 */
export function SurfaceScrollbars({ surfaceRef, surfaceId, markers }: SurfaceScrollbarsProps) {
  const scrollbars = useEditorScrollbars(surfaceRef);
  const {
    updateMarks,
    measurement: { schedule },
  } = scrollbars;
  useEditorEffect(
    (view) => {
      const surface = surfaceRef.current;
      if (!surface) return undefined;
      schedule();
      if (markers.length === 0) {
        updateMarks([]);
        return undefined;
      }
      const update = () => updateMarks(measureMarks(view, surface, markers));
      update();
      // A new height of the document (an edit, rewrapping) or of the surface moves the marks.
      const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      resize?.observe(surface);
      resize?.observe(view.dom);
      return () => resize?.disconnect();
    },
    [surfaceRef, markers, schedule, updateMarks],
  );
  return <EditorScrollbars viewportId={surfaceId} hooks={hooks} scrollbars={scrollbars} />;
}
