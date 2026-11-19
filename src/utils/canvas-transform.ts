import { clamp } from './clamp.js';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasBounds extends CanvasPoint {
  width: number;
  height: number;
}

export interface CanvasViewportState extends CanvasPoint {
  /** 100 draws one world unit per layout pixel. */
  zoom: number;
}

export const defaultCanvasViewport: CanvasViewportState = { x: 0, y: 0, zoom: 100 };

export function panCanvasViewport(
  viewport: CanvasViewportState,
  delta: CanvasPoint,
): CanvasViewportState {
  return { ...viewport, x: viewport.x + delta.x, y: viewport.y + delta.y };
}

/**
 * The viewport that shows all of `bounds` centred in a view of `size`, zoomed as far as fits
 * between `minZoom` and `maxZoom`.
 */
export function fitCanvasViewport(options: {
  bounds: CanvasBounds;
  size: { width: number; height: number };
  zoomRange: readonly [number, number];
  padding?: number | undefined;
}): CanvasViewportState {
  const { bounds, size, zoomRange, padding = 0 } = options;
  const scale = Math.min(
    (size.width - 2 * padding) / Math.max(1, bounds.width),
    (size.height - 2 * padding) / Math.max(1, bounds.height),
  );
  const zoom = clamp(scale * 100, zoomRange[0], zoomRange[1]);
  const factor = zoom / 100;
  return {
    x: (size.width - bounds.width * factor) / 2 - bounds.x * factor,
    y: (size.height - bounds.height * factor) / 2 - bounds.y * factor,
    zoom,
  };
}

/** The viewport at `zoom` that keeps the diagram point under the screen point `at` in place. */
export function zoomCanvasViewport(
  viewport: CanvasViewportState,
  { zoom, at }: { zoom: number; at: CanvasPoint },
): CanvasViewportState {
  const ratio = zoom / viewport.zoom;
  return { x: at.x - (at.x - viewport.x) * ratio, y: at.y - (at.y - viewport.y) * ratio, zoom };
}

/** The diagram point under a screen point of the viewport element. */
export function toCanvasWorldPoint(viewport: CanvasViewportState, point: CanvasPoint): CanvasPoint {
  const factor = viewport.zoom / 100;
  return { x: (point.x - viewport.x) / factor, y: (point.y - viewport.y) / factor };
}

export function toCanvasLocalPoint(viewport: CanvasViewportState, point: CanvasPoint): CanvasPoint {
  const factor = viewport.zoom / 100;
  return { x: viewport.x + point.x * factor, y: viewport.y + point.y * factor };
}

const revealMargin = 16;

/** The pan offset along one axis that brings `[start, end]` inside `[0, size]`. */
export function revealCanvasAxis(
  offset: number,
  [start, end]: [number, number],
  size: number,
): number {
  if (start < revealMargin) return offset + revealMargin - start;
  if (end > size - revealMargin)
    return offset - Math.min(end - size + revealMargin, start - revealMargin);
  return offset;
}
