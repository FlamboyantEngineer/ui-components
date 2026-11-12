// Turns the markers a ScrollOverview is given, by range or by element, into content ranges of its
// scroll container, and finds the marker an overview pixel belongs to.

import {
  SCROLL_OVERVIEW_MIN_MARKER,
  type ScrollOverviewMarker,
} from '../../utils/scroll-overview.js';

/** A marker placed on an element in the scroll container's content, measured by the overview. */
export interface ScrollOverviewElementMarker {
  element: Element;
  /** Any CSS colour the caller chooses. */
  color: string;
  /** Where markers share an overview pixel, the lowest priority wins. */
  priority: number;
}

/** A marker given by its content range or by an element. */
export type ScrollOverviewSource = ScrollOverviewMarker | ScrollOverviewElementMarker;

/** A named set of markers; each layer resolves its own overlaps before layers are combined. */
export interface ScrollOverviewSourceLayer {
  name: string;
  markers: readonly ScrollOverviewSource[];
}

/** A marker as measured now, beside the source it came from. */
export interface MeasuredMarker extends ScrollOverviewMarker {
  source: ScrollOverviewSource;
}

export interface MeasuredLayer {
  name: string;
  markers: readonly MeasuredMarker[];
}

function isElementMarker(marker: ScrollOverviewSource): marker is ScrollOverviewElementMarker {
  return 'element' in marker;
}

/** The elements the markers name, observed for resizes. */
export function markerElements(layers: readonly ScrollOverviewSourceLayer[]): Element[] {
  return layers.flatMap((layer) =>
    layer.markers.filter(isElementMarker).map((marker) => marker.element),
  );
}

/**
 * Each marker's range in `container`'s content, from the top of its scrolled content. An element
 * outside the container, or not in the document, marks nothing.
 */
export function measureMarkerLayers(
  container: HTMLElement,
  layers: readonly ScrollOverviewSourceLayer[],
): MeasuredLayer[] {
  const frame = container.getBoundingClientRect();
  const origin = frame.top + container.clientTop - container.scrollTop;
  const measure = (source: ScrollOverviewSource): MeasuredMarker | null => {
    if (!isElementMarker(source)) return { ...source, source };
    const { element } = source;
    if (!element.isConnected || !container.contains(element)) return null;
    const box = element.getBoundingClientRect();
    return {
      top: box.top - origin,
      height: box.height,
      color: source.color,
      priority: source.priority,
      source,
    };
  };
  return layers.map((layer) => ({
    name: layer.name,
    markers: layer.markers.map(measure).filter((marker) => marker !== null),
  }));
}

/** The overview's measurements: visible and content heights and the markers' ranges. */
export interface OverviewMetrics {
  height: number;
  scrollHeight: number;
  layers: readonly MeasuredLayer[];
}

/**
 * The marker drawn at overview pixel `y`: among those covering it, the lowest priority. `null`
 * where none is.
 */
export function markerAt(
  { layers, height, scrollHeight }: OverviewMetrics,
  y: number,
): MeasuredMarker | null {
  if (height <= 0 || scrollHeight <= height) return null;
  const scale = height / scrollHeight;
  let found: MeasuredMarker | null = null;
  for (const marker of layers.flatMap((layer) => layer.markers)) {
    const start = Math.floor(marker.top * scale);
    const end = Math.max(
      start + SCROLL_OVERVIEW_MIN_MARKER,
      Math.ceil((marker.top + marker.height) * scale),
    );
    if (y < start || y >= end) continue;
    if (!found || marker.priority < found.priority) found = marker;
  }
  return found;
}

function isSameLayer(a: MeasuredLayer, b: MeasuredLayer | undefined): boolean {
  if (!b || a.name !== b.name || a.markers.length !== b.markers.length) return false;
  return a.markers.every((marker, index) => {
    const other = b.markers[index];
    return (
      other !== undefined &&
      marker.source === other.source &&
      marker.top === other.top &&
      marker.height === other.height &&
      marker.color === other.color &&
      marker.priority === other.priority
    );
  });
}

/** Whether two measurements paint and hit alike, so a new one can be dropped. */
export function isSameMetrics(a: OverviewMetrics, b: OverviewMetrics): boolean {
  return (
    a.height === b.height &&
    a.scrollHeight === b.scrollHeight &&
    a.layers.length === b.layers.length &&
    a.layers.every((layer, index) => isSameLayer(layer, b.layers[index]))
  );
}
