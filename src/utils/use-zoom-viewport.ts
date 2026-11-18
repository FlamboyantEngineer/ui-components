'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { useLatest } from './use-latest.js';
import { createWheelStepCounter, isZoomWheel } from './use-wheel-steps.js';
import { toWheelPixels } from './wheel-scroll.js';

interface ZoomViewportOptions {
  /** The scrolling viewport, which takes the wheel. */
  viewportRef: RefObject<HTMLElement | null>;
  /** The zoomed canvas, whose point under the pointer, or at the viewport's centre, stays put. */
  canvasRef: RefObject<HTMLElement | null>;
  zoom: number;
  /**
   * Steps the zoom one level in (`1`) or out (`-1`) from the wheel and returns the zoom requested,
   * or `undefined` when there is no level that way. Left out, the wheel is the browser's.
   */
  onStep: ((direction: 1 | -1) => number | undefined) | undefined;
  /** The content is ready: until then the wheel is kept from the page but steps nothing. */
  isReady: boolean;
}

/** Where the pointer was when the wheel asked for `zoom`: in the viewport and in the canvas. */
interface WheelAnchor {
  zoom: number;
  clientX: number;
  clientY: number;
  /** The pointer's place across the canvas, from 0 at its start to 1 at its end. */
  x: number;
  y: number;
}

function anchorAt(canvas: HTMLElement, event: WheelEvent, zoom: number): WheelAnchor {
  const box = canvas.getBoundingClientRect();
  const across = (offset: number, size: number) => (size > 0 ? offset / size : 0.5);
  return {
    zoom,
    clientX: event.clientX,
    clientY: event.clientY,
    x: across(event.clientX - box.left, box.width),
    y: across(event.clientY - box.top, box.height),
  };
}

/** Scrolls the viewport so the anchored point of the canvas is under the pointer again. */
function restoreAnchor(viewport: HTMLElement, canvas: HTMLElement, anchor: WheelAnchor) {
  const box = canvas.getBoundingClientRect();
  viewport.scrollLeft += box.left + anchor.x * box.width - anchor.clientX;
  viewport.scrollTop += box.top + anchor.y * box.height - anchor.clientY;
}

/** Where the canvas was last drawn, in the viewport's scrolled content, and at which zoom. */
interface CanvasPlace {
  canvas: HTMLElement;
  zoom: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

function placeOf(viewport: HTMLElement, canvas: HTMLElement, zoom: number): CanvasPlace {
  const view = viewport.getBoundingClientRect();
  const box = canvas.getBoundingClientRect();
  return {
    canvas,
    zoom,
    left: box.left - view.left + viewport.scrollLeft,
    top: box.top - view.top + viewport.scrollTop,
    width: box.width,
    height: box.height,
  };
}

/** The point at the viewport's centre on the canvas as it was drawn at `place`, for `zoom`. */
function centreAnchor(viewport: HTMLElement, place: CanvasPlace, zoom: number): WheelAnchor {
  const view = viewport.getBoundingClientRect();
  const across = (offset: number, size: number) => (size > 0 ? offset / size : 0.5);
  const centreX = viewport.scrollLeft + viewport.clientWidth / 2;
  const centreY = viewport.scrollTop + viewport.clientHeight / 2;
  return {
    zoom,
    clientX: view.left + viewport.clientWidth / 2,
    clientY: view.top + viewport.clientHeight / 2,
    x: across(centreX - place.left, place.width),
    y: across(centreY - place.top, place.height),
  };
}

/**
 * A zoomable viewport around a canvas, shared by the library's zoomable images. Each new zoom keeps
 * the point at the viewport's centre in place, and a zoom the wheel asked for keeps the point under
 * the pointer instead. With `onStep`, the wheel over the viewport, and a touchpad pinch (which
 * arrives as the wheel with Ctrl), steps the zoom: one mouse notch is one level, and smaller
 * touchpad deltas add up to one. Neither the viewport nor the page scrolls or zooms meanwhile; a
 * mostly sideways wheel without Ctrl still pans.
 */
export function useZoomViewport({
  viewportRef,
  canvasRef,
  zoom,
  onStep,
  isReady,
}: ZoomViewportOptions) {
  const anchor = useRef<WheelAnchor | null>(null);
  const measured = useRef<CanvasPlace | null>(null);
  const latest = useLatest({ zoom, onStep, isReady });
  const isEnabled = onStep !== undefined;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isEnabled) return undefined;
    const count = createWheelStepCounter();
    // React registers wheel listeners as passive, so only a native listener can prevent the
    // browser's own scrolling and page zoom.
    const onWheel = (event: WheelEvent) => {
      const pixels = toWheelPixels(event, { width: viewport.clientWidth, height: 400 });
      const isPinch = isZoomWheel(event);
      if (!isPinch && Math.abs(pixels.y) <= Math.abs(pixels.x)) return;
      event.preventDefault();
      const { isReady: ready, onStep: step, zoom: current } = latest.current;
      if (!ready || !step || pixels.y === 0) return;
      // A wheel that counts in lines or pages, as some mice do, steps once per event.
      const direction = event.deltaMode === 0 ? count(pixels.y) : pixels.y < 0 ? 1 : -1;
      if (direction === null) return;
      const canvas = canvasRef.current;
      const target = step(direction);
      anchor.current =
        canvas && target !== undefined && target !== current
          ? anchorAt(canvas, event, target)
          : null;
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [viewportRef, canvasRef, isEnabled, latest]);
  // Runs after every render, so a zoom starts from where the canvas was last drawn.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const previous = measured.current;
    const isSameCanvas = previous?.canvas === canvas;
    if (isSameCanvas && previous.zoom !== zoom) {
      const pending = anchor.current;
      if (pending?.zoom === zoom) restoreAnchor(viewport, canvas, pending);
      else if (previous.width > 0) {
        restoreAnchor(viewport, canvas, centreAnchor(viewport, previous, zoom));
      }
    }
    // A new canvas, such as another item's, starts where the viewport is.
    if (!isSameCanvas || previous.zoom !== zoom) anchor.current = null;
    measured.current = placeOf(viewport, canvas, zoom);
  });
}
