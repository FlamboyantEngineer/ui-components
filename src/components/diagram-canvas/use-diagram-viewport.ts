'use client';

import { useLayoutEffect, useRef } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useLatest } from '../../utils/use-latest.js';
import { useCanvasCamera } from '../canvas-viewport/canvas-viewport.js';
import { defaultZoomLevels } from '../zoom-control/zoom-control.js';
import type { DiagramViewport } from './diagram-model.js';
import type { DiagramRect } from './edge-route.js';

interface DiagramViewportOptions {
  viewport: DiagramViewport | undefined;
  defaultViewport: DiagramViewport | undefined;
  onViewportChange: ((viewport: DiagramViewport) => void) | undefined;
  element: HTMLElement | null;
  bounds: DiagramRect | null;
}

export type DiagramViewportState = ReturnType<typeof useDiagramViewport>;

const fitPadding = 24;
const minZoom = requireDefined(defaultZoomLevels[0]);

/** Applies the diagram's initial fit, world padding and zoom limits to the shared camera. */
export function useDiagramViewport({ element, bounds, ...options }: DiagramViewportOptions) {
  const isGiven = options.viewport !== undefined || options.defaultViewport !== undefined;
  const {
    camera,
    viewport,
    setViewport,
    stepZoom,
    fit: fitBounds,
    revealBounds,
  } = useCanvasCamera(element, { ...options, minZoom });
  const size = useElementSize(element, { box: 'client' });
  const fit = () => {
    if (!size || !bounds) return;
    fitBounds({
      bounds: {
        x: bounds.x - fitPadding,
        y: bounds.y - fitPadding,
        width: bounds.width + fitPadding * 2,
        height: bounds.height + fitPadding * 2,
      },
      maxZoom: 100,
    });
  };
  const fitted = useRef(isGiven);
  const latestFit = useLatest(fit);
  useLayoutEffect(() => {
    // The viewport may measure empty before the host stylesheet loads.
    if (fitted.current || !size || size.width === 0 || size.height === 0 || !bounds) return;
    fitted.current = true;
    latestFit.current();
  }, [size, bounds, latestFit]);
  return {
    camera,
    viewport,
    setViewport,
    zoomTo: camera.zoomTo,
    stepZoom,
    fit,
    reveal: revealBounds,
    size,
  };
}
