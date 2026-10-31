'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  buildScrollOverviewImage,
  resolveLayeredScrollOverviewSegments,
  type ScrollOverviewLayer,
  type ScrollOverviewMarker,
} from '../../utils/scroll-overview.js';
import type { SharedViewportObserver } from './use-shared-viewport-observer.js';

interface ScrollOverviewOptions {
  markers: readonly ScrollOverviewMarker[] | undefined;
  /** Named marker layers; they replace `markers`. */
  layers: readonly ScrollOverviewLayer[] | undefined;
  /** Paint at all; the overview belongs to native scrollbars. */
  enabled: boolean;
}

export interface ScrollOverviewPaint {
  visible: boolean;
  /** The overview image for the viewport's visible height, or `none`. */
  image: string;
  /** The viewport's visible height in pixels. */
  height: number;
}

/**
 * Measures the viewport's visible and content heights and turns the markers into an overview image.
 * It paints only: scrolling, the native scrollbar and its hit testing are untouched. Observers and the
 * pending frame are released when the markers go away or the region unmounts.
 */
export function useScrollOverview(
  viewport: RefObject<HTMLDivElement | null>,
  observer: SharedViewportObserver,
  { markers, layers, enabled }: ScrollOverviewOptions,
): ScrollOverviewPaint {
  const activeLayers = useMemo<readonly ScrollOverviewLayer[]>(() => {
    if (!enabled) return [];
    return layers ?? (markers ? [{ name: 'markers', markers }] : []);
  }, [enabled, layers, markers]);
  const hasMarkers = activeLayers.some((layer) => layer.markers.length > 0);
  const [metrics, setMetrics] = useState({ height: 0, scrollHeight: 0 });

  useEffect(() => {
    const element = viewport.current;
    if (!element || !hasMarkers) return undefined;
    const measure = () => {
      const next = { height: element.clientHeight, scrollHeight: element.scrollHeight };
      setMetrics((previous) =>
        previous.height === next.height && previous.scrollHeight === next.scrollHeight
          ? previous
          : next,
      );
    };
    return observer.subscribe(measure);
  }, [activeLayers, hasMarkers, observer, viewport]);

  const image = useMemo(
    () =>
      hasMarkers
        ? buildScrollOverviewImage(
            resolveLayeredScrollOverviewSegments(
              activeLayers,
              metrics.height,
              metrics.scrollHeight,
            ),
            metrics.height,
          )
        : 'none',
    [activeLayers, hasMarkers, metrics.height, metrics.scrollHeight],
  );
  return { visible: hasMarkers && image !== 'none', image, height: metrics.height };
}
