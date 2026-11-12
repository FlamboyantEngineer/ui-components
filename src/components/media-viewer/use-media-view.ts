'use client';

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';

interface MediaViewOptions {
  /** The shown item's id: another item starts a fresh view. */
  itemKey: Key;
  /** The zoom, controlled. */
  zoom: number | undefined;
  /** The zoom each item starts at. */
  defaultZoom: number;
  onZoomChange: ((zoom: number) => void) | undefined;
}

/** How the shown image is zoomed and turned; moving to another item starts afresh. */
interface MediaView {
  key: Key;
  zoom: number;
  rotation: number;
}

/**
 * The shown image's zoom and turn. An uncontrolled zoom starts each item at `defaultZoom`, as the
 * turn starts unturned; `zoom` holds it instead while the caller controls it. Every zoom requested
 * reaches `onZoomChange`.
 */
export function useMediaView({ itemKey, zoom, defaultZoom, onZoomChange }: MediaViewOptions) {
  const fresh = { key: itemKey, zoom: defaultZoom, rotation: 0 };
  const [ownView, setView] = useState<MediaView>(fresh);
  const view = ownView.key === itemKey ? ownView : fresh;
  // Moving to another item shows it afresh, so coming back to one shows it at the start again.
  if (view !== ownView) setView(view);
  const shownZoom = zoom ?? view.zoom;
  const setZoom = (next: number) => {
    setView({ ...view, zoom: next });
    onZoomChange?.(next);
  };
  return {
    zoom: shownZoom,
    rotation: view.rotation,
    setZoom,
    /** Asks for the next zoom level in (`1`) or out (`-1`) and returns it, if there is one. */
    step(direction: 1 | -1): number | undefined {
      const next = findNextZoomLevel(defaultZoomLevels, shownZoom, direction);
      if (next !== undefined) setZoom(next);
      return next;
    },
    rotate() {
      setView({ ...view, rotation: (view.rotation + 90) % 360 });
    },
    /** Before the reader moves to another item: asks for the zoom it starts at. */
    leave() {
      if (shownZoom !== defaultZoom) onZoomChange?.(defaultZoom);
    },
  };
}
