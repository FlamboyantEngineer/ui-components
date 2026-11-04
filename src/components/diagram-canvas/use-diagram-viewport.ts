'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { clamp } from '../../utils/clamp.js';
import { toLocalPoint } from '../../utils/element-scale.js';
import { requireDefined } from '../../utils/require-defined.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useLatest } from '../../utils/use-latest.js';
import { findWheelScroller, toWheelPixels } from '../../utils/wheel-scroll.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { type DiagramViewport, fitDiagramViewport, zoomDiagramViewport } from './diagram-model.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';

interface DiagramViewportOptions {
  viewport: DiagramViewport | undefined;
  defaultViewport: DiagramViewport | undefined;
  onViewportChange: ((viewport: DiagramViewport) => void) | undefined;
  /** The viewport element, once mounted. */
  element: HTMLElement | null;
  /** The box around every node, or null without nodes. */
  bounds: DiagramRect | null;
}

export interface DiagramViewportState {
  viewport: DiagramViewport;
  setViewport: (viewport: DiagramViewport) => void;
  /** Zooms to `zoom` percent around a point of the viewport element, by default its centre. */
  zoomTo: (zoom: number, at?: DiagramPoint) => void;
  /** Zooms to the next zoom level up (`1`) or down (`-1`). */
  stepZoom: (direction: 1 | -1) => void;
  /** Shows every node. */
  fit: () => void;
  /** Pans the least that brings a box, in diagram coordinates, into view. */
  reveal: (rect: DiagramRect) => void;
  /** The size of the viewport element, or null before it is measured. */
  size: { width: number; height: number } | null;
}

const diagramZoomRange = [
  requireDefined(defaultZoomLevels[0]),
  requireDefined(defaultZoomLevels[defaultZoomLevels.length - 1]),
] as const;

const fitPadding = 24;
const revealMargin = 16;
const wheelZoomRate = 1 / 300;
const startViewport: DiagramViewport = { x: 0, y: 0, zoom: 100 };

/** The pan offset along one axis that brings `[start, end]` inside `[0, size]`. */
function revealAxis(offset: number, [start, end]: [number, number], size: number): number {
  if (start < revealMargin) return offset + revealMargin - start;
  if (end > size - revealMargin)
    return offset - Math.min(end - size + revealMargin, start - revealMargin);
  return offset;
}

/**
 * The wheel pans the view, or zooms it around the pointer with Ctrl or Command, in pixels whatever
 * unit it comes in. A wheel a control inside already handled (its default prevented) is left alone,
 * and so is a pan that a scrollable element under the pointer, such as a text area in a node, can
 * still take; once that element reaches its end, the view pans.
 */
function useWheel(element: HTMLElement | null, state: DiagramViewportState): void {
  const latest = useLatest(state);
  useEffect(() => {
    if (!element) return undefined;
    // React registers wheel listeners as passive, so only a native listener can keep the page from
    // scrolling or zooming.
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented) return;
      const { viewport, setViewport, zoomTo, size } = latest.current;
      const step = toWheelPixels(event, size ?? { width: 0, height: 0 });
      const isZoom = event.ctrlKey || event.metaKey;
      if (!isZoom && findWheelScroller(event.target, element, step)) return;
      event.preventDefault();
      if (isZoom) {
        const at = toLocalPoint(element, { x: event.clientX, y: event.clientY });
        zoomTo(viewport.zoom * 2 ** (-step.y * wheelZoomRate), at);
        return;
      }
      setViewport({ ...viewport, x: viewport.x - step.x, y: viewport.y - step.y });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [element, latest]);
}

/**
 * The canvas's pan and zoom, controlled or not. Without a viewport from the caller, the view fits
 * every node once the viewport element is first measured.
 */
export function useDiagramViewport(options: DiagramViewportOptions): DiagramViewportState {
  const { element, bounds } = options;
  const isGiven = options.viewport !== undefined || options.defaultViewport !== undefined;
  const [viewport, setViewport] = useControllableState(
    options.viewport,
    options.defaultViewport ?? startViewport,
    options.onViewportChange,
  );
  const size = useElementSize(element, { box: 'client' });
  const zoomTo = (zoom: number, at?: DiagramPoint) => {
    const point = at ?? { x: (size?.width ?? 0) / 2, y: (size?.height ?? 0) / 2 };
    const next = clamp(zoom, diagramZoomRange[0], diagramZoomRange[1]);
    setViewport(zoomDiagramViewport(viewport, { zoom: next, at: point }));
  };
  const fit = () => {
    if (!size || !bounds) return;
    const padded = {
      x: bounds.x - fitPadding,
      y: bounds.y - fitPadding,
      width: bounds.width + fitPadding * 2,
      height: bounds.height + fitPadding * 2,
    };
    setViewport(
      fitDiagramViewport({ bounds: padded, size, zoomRange: [diagramZoomRange[0], 100] }),
    );
  };
  const reveal = (rect: DiagramRect) => {
    if (!size) return;
    const factor = viewport.zoom / 100;
    const x = revealAxis(
      viewport.x,
      [viewport.x + rect.x * factor, viewport.x + (rect.x + rect.width) * factor],
      size.width,
    );
    const y = revealAxis(
      viewport.y,
      [viewport.y + rect.y * factor, viewport.y + (rect.y + rect.height) * factor],
      size.height,
    );
    if (x !== viewport.x || y !== viewport.y) setViewport({ ...viewport, x, y });
  };
  const stepZoom = (direction: 1 | -1) => {
    const level = findNextZoomLevel(defaultZoomLevels, viewport.zoom, direction);
    if (level !== undefined) zoomTo(level);
  };
  const state = { viewport, setViewport, zoomTo, stepZoom, fit, reveal, size };
  useWheel(element, state);
  const fitted = useRef(isGiven);
  const latestFit = useLatest(fit);
  useLayoutEffect(() => {
    // An unstyled viewport may measure empty before the host stylesheet loads; fit once it has room.
    if (fitted.current || !size || size.width === 0 || size.height === 0 || !bounds) return;
    fitted.current = true;
    latestFit.current();
  }, [size, bounds, latestFit]);
  return state;
}
