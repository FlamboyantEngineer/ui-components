import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  buildScrollOverviewImage,
  resolveLayeredScrollOverviewSegments,
  type ScrollOverviewLayer,
  type ScrollOverviewMarker,
} from '../../utils/scroll-overview.js';

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
  markers: readonly ScrollOverviewMarker[] | undefined,
  layers: readonly ScrollOverviewLayer[] | undefined,
): ScrollOverviewPaint {
  const activeLayers = useMemo<readonly ScrollOverviewLayer[]>(
    () => layers ?? (markers ? [{ name: 'markers', markers }] : []),
    [layers, markers],
  );
  const hasMarkers = activeLayers.some((layer) => layer.markers.length > 0);
  const [metrics, setMetrics] = useState({ height: 0, scrollHeight: 0 });

  useEffect(() => {
    const element = viewport.current;
    const owner = element?.ownerDocument.defaultView;
    if (!element || !owner || !hasMarkers) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const next = { height: element.clientHeight, scrollHeight: element.scrollHeight };
      setMetrics((previous) =>
        previous.height === next.height && previous.scrollHeight === next.scrollHeight
          ? previous
          : next,
      );
    };
    const schedule = () => {
      if (!frame) frame = owner.requestAnimationFrame(measure);
    };
    const resize =
      typeof owner.ResizeObserver === 'function' ? new owner.ResizeObserver(schedule) : null;
    const observeAll = () => {
      if (resize) {
        resize.disconnect();
        resize.observe(element);
        for (const child of element.children) resize.observe(child);
      }
      schedule();
    };
    const mutations = new owner.MutationObserver(observeAll);
    mutations.observe(element, { childList: true });
    observeAll();
    return () => {
      resize?.disconnect();
      mutations.disconnect();
      owner.cancelAnimationFrame(frame);
    };
  }, [activeLayers, hasMarkers, viewport]);

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
