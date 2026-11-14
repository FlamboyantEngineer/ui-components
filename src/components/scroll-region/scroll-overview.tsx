'use client';

import { type MouseEvent, type RefObject, useEffect, useMemo, useState } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { measureScale } from '../../utils/element-scale.js';
import { observeViewport } from '../../utils/observe-viewport.js';
import { isSameOverviewLayers } from '../../utils/same-overview-layers.js';
import {
  buildScrollOverviewImage,
  resolveLayeredScrollOverviewSegments,
} from '../../utils/scroll-overview.js';
import { useEqualValue } from '../../utils/use-equal-value.js';
import {
  isSameMetrics,
  markerAt,
  markerElements,
  measureMarkerLayers,
  type OverviewMetrics,
  type ScrollOverviewSource,
  type ScrollOverviewSourceLayer,
} from './scroll-overview-markers.js';
import { pageToward, resolveThumb, useScrollTop, useThumbDrag } from './scroll-overview-thumb.js';

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
   * Makes the markers pressable: a press on a marker scrolls the container to it and calls this
   * with the marker as given. Without it a press on the track pages the container toward it.
   */
  onMarkerActivate?: ((marker: ScrollOverviewSource) => void) | undefined;
}

const hooks = createHooks('scroll-overview', ['thumb']);

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
    if (!container || !view) {
      setMetrics(noMetrics);
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
 * A custom vertical scrollbar for a scroll container whose native scrollbar the host hides: a
 * track as tall as the container's visible height, painted with where markers sit in its content,
 * and a thumb over them that follows the scroll position and scrolls the container when dragged.
 * A press on the track pages toward it, or with `onMarkerActivate` jumps to the marker pressed.
 * Markers are given by content range or by element; an element marker follows its element as the
 * content changes.
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
  // Markers written inline are new objects each render: equal ones keep the measured sources, so
  // the observers are not rebuilt and every marker measured again on each parent render.
  const sources = useEqualValue(
    useMemo(() => layers ?? (markers ? [{ name: 'markers', markers }] : []), [layers, markers]),
    isSameOverviewLayers,
  );
  const metrics = useOverviewMetrics(scrollRef, sources);
  const image = buildScrollOverviewImage(
    resolveLayeredScrollOverviewSegments(metrics.layers, metrics.height, metrics.scrollHeight),
    metrics.height,
  );
  const isInteractive = onMarkerActivate !== undefined;
  const top = useScrollTop(scrollRef, metrics);
  const thumb = resolveThumb(metrics.height, metrics.scrollHeight, top);
  const drag = useThumbDrag(scrollRef, thumb);
  // A press on the track: onto the marker there, if markers are pressable, else a page that way.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    const y = (event.clientY - box.top) / measureScale(event.currentTarget).y;
    const marker = onMarkerActivate ? markerAt(metrics, y) : null;
    if (marker) {
      container.scrollTo({ top: marker.top });
      onMarkerActivate?.(marker.source);
    } else if (thumb) pageToward(container, thumb, y);
  };
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        data: { empty: image === 'none', interactive: isInteractive, scrollable: thumb !== null },
      })}
      ref={ref}
      aria-hidden="true"
      style={{
        ...measuredProperty('scroll-overview-image', image),
        position: 'relative',
        height: metrics.height,
      }}
      onClick={onClick}
    >
      <div
        {...hooks.slot('thumb')}
        hidden={thumb === null}
        style={{ position: 'absolute', top: thumb?.offset ?? 0, height: thumb?.size ?? 0 }}
        {...drag}
      />
    </div>
  );
}
