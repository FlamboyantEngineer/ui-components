'use client';

import { useEffect } from 'react';
import {
  type CanvasPoint,
  type CanvasViewportState,
  panCanvasViewport,
} from './canvas-transform.js';
import { toLocalPoint } from './element-scale.js';
import { useLatest } from './use-latest.js';
import { findWheelScroller, toWheelPixels } from './wheel-scroll.js';

interface CanvasWheelOptions {
  viewport: CanvasViewportState;
  setViewport: (viewport: CanvasViewportState) => void;
  zoomTo: (zoom: number, at: CanvasPoint) => void;
  zoomsOnWheel?: boolean | undefined;
  getSize: () => { width: number; height: number };
}

const wheelZoomRate = 1 / 300;

/**
 * The wheel pans the view, or zooms it around the pointer with Ctrl or Command, in pixels whatever
 * unit it comes in. A wheel a control inside already handled (its default prevented) is left alone,
 * and so is a pan that a scrollable element under the pointer, such as a text area in a node, can
 * still take; once that element reaches its end, the view pans.
 */
export function useCanvasWheel(element: HTMLElement | null, state: CanvasWheelOptions): void {
  const latest = useLatest(state);
  useEffect(() => {
    if (!element) return undefined;
    // React registers wheel listeners as passive, so only a native listener can keep the page from
    // scrolling or zooming.
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented) return;
      const { viewport, setViewport, zoomTo, getSize, zoomsOnWheel } = latest.current;
      const step = toWheelPixels(event, getSize());
      const isModified = event.ctrlKey || event.metaKey;
      if (!isModified && findWheelScroller(event.target, element, step)) return;
      const isZoom = isModified || zoomsOnWheel;
      if (isZoom && step.y === 0 && !isModified) return;
      event.preventDefault();
      if (isZoom) {
        const at = toLocalPoint(element, { x: event.clientX, y: event.clientY });
        zoomTo(viewport.zoom * 2 ** (-step.y * wheelZoomRate), at);
        return;
      }
      setViewport(panCanvasViewport(viewport, { x: -step.x, y: -step.y }));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [element, latest]);
}
