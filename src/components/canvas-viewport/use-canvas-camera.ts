'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import {
  type CanvasPoint,
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

type CameraOptions = Pick<CanvasViewportProps, 'viewport' | 'defaultViewport' | 'onViewportChange'>;
type CanvasCamera = Omit<CanvasViewportController, 'claimGesture'>;

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

export function useCanvasCamera(element: HTMLElement | null, options: CameraOptions) {
  const [viewport, setViewport] = useControllableState(
    options.viewport,
    options.defaultViewport ?? defaultCanvasViewport,
    options.onViewportChange,
  );
  const zoomAt = (zoom: number, at: CanvasPoint) => {
    if (zoom > 0) setViewport(zoomCanvasViewport(viewport, { zoom: Math.min(zoom, maxZoom), at }));
  };
  useCanvasWheel(element, {
    viewport,
    setViewport,
    zoomTo: zoomAt,
    getSize: () => readSize(element),
  });

  const latest = useLatest({ element, viewport, setViewport, zoomAt });
  // The scene reads the camera from its handlers without subscribing to camera renders.
  const camera = useMemo<CanvasCamera>(
    () => ({
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
      fitToBounds: (bounds, padding = 24) => {
        const { element, setViewport } = latest.current;
        const size = readSize(element);
        if (!size.width || !size.height) return;
        const inset = clamp(padding, 0, (Math.min(size.width, size.height) - 1) / 2);
        setViewport(fitCanvasViewport({ bounds, size, zoomRange: [0, maxZoom], padding: inset }));
      },
      zoomTo: (zoom, client) => {
        const { element, zoomAt } = latest.current;
        const size = readSize(element);
        zoomAt(
          zoom,
          client ? toLocalPoint(element, client) : { x: size.width / 2, y: size.height / 2 },
        );
      },
    }),
    [latest],
  );
  const stepZoom = (direction: 1 | -1) => {
    const zoom = findNextZoomLevel(defaultZoomLevels, viewport.zoom, direction);
    if (zoom !== undefined) camera.zoomTo(zoom);
  };
  const reveal = (target: Element) => {
    if (!element) return;
    const size = readSize(element);
    if (!size.width || !size.height) return;
    const box = target.getBoundingClientRect();
    const start = toLocalPoint(element, { x: box.left, y: box.top });
    const end = toLocalPoint(element, { x: box.right, y: box.bottom });
    const delta = {
      x: revealCanvasAxis(0, [start.x, end.x], size.width),
      y: revealCanvasAxis(0, [start.y, end.y], size.height),
    };
    if (delta.x || delta.y) setViewport(panCanvasViewport(viewport, delta));
  };
  return { camera, viewport, setViewport, stepZoom, reveal };
}
