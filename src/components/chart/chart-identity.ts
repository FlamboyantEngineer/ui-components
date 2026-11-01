// Stable identities of a chart's drawn values, apart from their colour-slot positions (specs/CHART.md).

import type { Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';

/**
 * Identities for values along a series, from where each sits: the first value at a place keeps the
 * place's identity and a repeated one counts on, so a value keeps its identity when values are
 * added or removed elsewhere in the series.
 */
export function createPlaceIdentities(): (place: string | number) => string {
  const seen = new Map<string | number, number>();
  return (place) => {
    const count = seen.get(place) ?? 0;
    seen.set(place, count + 1);
    return JSON.stringify([place, count]);
  };
}

/** A drawn value's identity: its series' typed id, then its place along the series. */
export function toValueIdentity(seriesId: Key, place?: string): string {
  const series = toKeyIdentity(seriesId);
  return place === undefined ? series : `${series}|${place}`;
}
