'use client';

import { isSameArray } from './use-stable-array.js';

/** A named list of overview markers, as `ScrollOverview` and `ScrollRegion` take them. */
interface NamedMarkerLayer {
  name: string;
  markers: readonly unknown[];
}

/**
 * Whether two layer lists name the same markers, compared field by field, so markers written inline
 * keep the measured or painted overview instead of rebuilding it on each parent render.
 */
export function isSameOverviewLayers<L extends NamedMarkerLayer>(
  kept: readonly L[],
  next: readonly L[],
): boolean {
  return (
    kept.length === next.length &&
    kept.every((layer, index) => {
      const other = next[index];
      return (
        other !== undefined &&
        layer.name === other.name &&
        isSameArray(layer.markers, other.markers)
      );
    })
  );
}
