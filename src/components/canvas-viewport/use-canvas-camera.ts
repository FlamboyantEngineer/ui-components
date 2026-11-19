'use client';

import { type RefObject, useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import {
  type CanvasBounds,
  type CanvasPoint,
  type CanvasViewportState,
  defaultCanvasViewport,
  fitCanvasViewport,
  panCanvasViewport,
  revealCanvasAxis,
  toCanvasLocalPoint,
  toCanvasWorldPoint,
  zoomCanvasViewport,
} from '../../utils/canvas-transform.js';
import { clamp } from '../../utils/clamp.js';
import { measureScale, toLocalPoint } from '../../utils/element-scale.js';
import { requireDefined } from '../../utils/require-defined.js';
import { useCanvasWheel } from '../../utils/use-canvas-wheel.js';
import { useLatest } from '../../utils/use-latest.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import type { CanvasViewportController, CanvasViewportProps } from './canvas-viewport-types.js';

interface CanvasCameraOptions extends Pick<
  CanvasViewportProps,
  'viewport' | 'defaultViewport' | 'onViewportChange'
> {
  minZoom?: number | undefined;
  zoomsOnWheel?: boolean | undefined;
}

type CanvasCamera = Omit<CanvasViewportController, 'claimGesture'>;

interface FitOptions {
  bounds: CanvasBounds;
  padding?: number | undefined;
  maxZoom?: number | undefined;
}

const maxZoom = requireDefined(defaultZoomLevels[defaultZoomLevels.length - 1]);

function readSize(element: HTMLElement | null) {
  return { width: element?.clientWidth ?? 0, height: element?.clientHeight ?? 0 };
}

function toClientPoint(element: HTMLElement | null, local: CanvasPoint): CanvasPoint {
  if (!element) return local;
  const scale = measureScale(element);
  const rect = element.getBoundingClientRect();
  return { x: rect.left + local.x * scale.x, y: rect.top + local.y * scale.y };
}

interface CameraSnapshot {
  element: HTMLElement | null;
  viewport: CanvasViewportState;
  fit: (options: FitOptions) => void;
  zoomAt: (zoom: number, at: CanvasPoint) => void;
}

function getCanvasCommands(latest: RefObject<CameraSnapshot>): CanvasCamera {
  return {
    getViewport: () => latest.current.viewport,
    clientToWorld: (point) => {
      const { viewport, element } = latest.current;
      return toCanvasWorldPoint(viewport, toLocalPoint(element, point));
    },
    worldToClient: (point) => {
      const { viewport, element } = latest.current;
      return toClientPoint(element, toCanvasLocalPoint(viewport, point));
    },
    getVisibleWorldBounds: () => {
      const { viewport, element } = latest.current;
      const { width, height } = readSize(element);
      if (!width || !height) return null;
      return {
        ...toCanvasWorldPoint(viewport, { x: 0, y: 0 }),
        width: (width * 100) / viewport.zoom,
        height: (height * 100) / viewport.zoom,
      };
    },
    fitToBounds: (bounds, padding = 24) => latest.current.fit({ bounds, padding }),
    zoomTo: (zoom, client) => {
      const { element, zoomAt } = latest.current;
      const size = readSize(element);
      zoomAt(
        zoom,
        client ? toLocalPoint(element, client) : { x: size.width / 2, y: size.height / 2 },
      );
    },
  };
}

export function useCanvasCamera(element: HTMLElement | null, options: CanvasCameraOptions) {
  const { minZoom = 0, zoomsOnWheel } = options;
  const [viewport, setViewport] = useControllableState(
    options.viewport,
    options.defaultViewport ?? defaultCanvasViewport,
    options.onViewportChange,
  );
  const zoomAt = (zoom: number, at: CanvasPoint) => {
    const next = clamp(zoom, minZoom, maxZoom);
    if (next > 0) setViewport(zoomCanvasViewport(viewport, { zoom: next, at }));
  };
  const fit = ({ bounds, padding = 0, maxZoom: limit = maxZoom }: FitOptions) => {
    const size = readSize(element);
    if (!size.width || !size.height) return;
    const inset = clamp(padding, 0, (Math.min(size.width, size.height) - 1) / 2);
    setViewport(fitCanvasViewport({ bounds, size, zoomRange: [minZoom, limit], padding: inset }));
  };
  useCanvasWheel(element, {
    viewport,
    setViewport,
    zoomTo: zoomAt,
    zoomsOnWheel,
    getSize: () => readSize(element),
  });

  const latest = useLatest({ element, viewport, fit, zoomAt });
  // The scene reads the camera from its handlers without subscribing to camera renders.
  const camera = useMemo(() => getCanvasCommands(latest), [latest]);
  const stepZoom = (direction: 1 | -1) => {
    const zoom = findNextZoomLevel(defaultZoomLevels, viewport.zoom, direction);
    if (zoom !== undefined) camera.zoomTo(zoom);
  };
  const reveal = (start: CanvasPoint, end: CanvasPoint) => {
    const { width, height } = readSize(element);
    if (!width || !height) return;
    const delta = {
      x: revealCanvasAxis(0, [start.x, end.x], width),
      y: revealCanvasAxis(0, [start.y, end.y], height),
    };
    if (delta.x || delta.y) setViewport(panCanvasViewport(viewport, delta));
  };
  const revealElement = (target: Element) => {
    const box = target.getBoundingClientRect();
    reveal(
      toLocalPoint(element, { x: box.left, y: box.top }),
      toLocalPoint(element, { x: box.right, y: box.bottom }),
    );
  };
  const revealBounds = (bounds: CanvasBounds) =>
    reveal(
      toCanvasLocalPoint(viewport, bounds),
      toCanvasLocalPoint(viewport, { x: bounds.x + bounds.width, y: bounds.y + bounds.height }),
    );
  return { camera, viewport, setViewport, stepZoom, fit, revealElement, revealBounds };
}
