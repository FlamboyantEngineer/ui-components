'use client';

import { type MouseEvent, type RefObject, useEffect, useMemo, useState } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { observeViewport } from '../../utils/observe-viewport.js';
import {
  buildScrollOverviewImage,
  resolveLayeredScrollOverviewSegments,
} from '../../utils/scroll-overview.js';
import {
  isSameMetrics,
  markerAt,
  markerElements,
  measureMarkerLayers,
  type OverviewMetrics,
  type ScrollOverviewSource,
  type ScrollOverviewSourceLayer,
} from './scroll-overview-markers.js';

export type {
  ScrollOverviewElementMarker,
  ScrollOverviewSource,
  ScrollOverviewSourceLayer,
} from './scroll-overview-markers.js';

export interface ScrollOverviewProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The element that scrolls, whose content the markers mark. */
  scrollRef: RefObject<HTMLElement | null>;
  /** Markers by content range or by element. */
  markers?: readonly ScrollOverviewSource[] | undefined;
  /** Named marker layers, combined with equal weight where they meet. Replaces `markers`. */
  layers?: readonly ScrollOverviewSourceLayer[] | undefined;
  /**
   * Makes the strip pressable: a press on a marker scrolls the container to it and calls this with
   * the marker as given. Without it the strip is decorative and lets presses through.
   */
  onMarkerActivate?: ((marker: ScrollOverviewSource) => void) | undefined;
}

const hooks = createHooks('scroll-overview', []);

const noMetrics: OverviewMetrics = { height: 0, scrollHeight: 0, layers: [] };

/**
 * Measures the container's visible and content heights and each marker's range, again when the
 * container, its content or a marked element resizes or the content changes.
 */
function useOverviewMetrics(
  scrollRef: RefObject<HTMLElement | null>,
  layers: readonly ScrollOverviewSourceLayer[],
): OverviewMetrics {
  const [metrics, setMetrics] = useState(noMetrics);
  useEffect(() => {
    const container = scrollRef.current;
    const view = container?.ownerDocument.defaultView;
    if (!container || !view || layers.length === 0) {
      setMetrics((current) => (current.layers.length === 0 ? current : noMetrics));
      return undefined;
    }
    const measure = () => {
      const next = {
        height: container.clientHeight,
        scrollHeight: container.scrollHeight,
        layers: measureMarkerLayers(container, layers),
      };
      setMetrics((current) => (isSameMetrics(current, next) ? current : next));
    };
    const observer = observeViewport(container, view, {
      measure,
      getExtraTargets: () => markerElements(layers),
      subtree: true,
      fonts: true,
    });
    measure();
    return () => observer.disconnect();
  }, [scrollRef, layers]);
  return metrics;
}

/**
 * A strip that paints where markers sit in a scroll container's content, scaled to the container's
 * visible height, for a stylesheet to place beside or over its scrollbar. Markers are given by
 * content range or by element; an element marker follows its element as the content changes.
 */
export function ScrollOverview({
  scrollRef,
  markers,
  layers,
  onMarkerActivate,
  className,
  ref,
  ...rest
}: ScrollOverviewProps) {
  const sources = useMemo(
    () => layers ?? (markers ? [{ name: 'markers', markers }] : []),
    [layers, markers],
  );
  const metrics = useOverviewMetrics(scrollRef, sources);
  const image = buildScrollOverviewImage(
    resolveLayeredScrollOverviewSegments(metrics.layers, metrics.height, metrics.scrollHeight),
    metrics.height,
  );
  const isInteractive = onMarkerActivate !== undefined;
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!onMarkerActivate || !container) return;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const marker = markerAt(metrics, y);
    if (!marker) return;
    container.scrollTo({ top: marker.top });
    onMarkerActivate(marker.source);
  };
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        data: { empty: image === 'none', interactive: isInteractive },
      })}
      ref={ref}
      aria-hidden="true"
      style={{
        ...measuredProperty('scroll-overview-image', image),
        height: metrics.height,
        pointerEvents: isInteractive ? undefined : 'none',
      }}
      onClick={isInteractive ? onClick : undefined}
    />
  );
}
