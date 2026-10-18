// Band scales: categories to evenly spaced bands of a range (specs/SCALES.md).

import type { ScaleInterval, ScaleTick } from './linear-scale.js';

export interface BandScaleOptions {
  /** The categories, in the order their bands follow each other. */
  domain: readonly string[];
  /** The positions the bands fill, such as pixels; reversed ends lay the bands out backwards. */
  range: ScaleInterval;
  /** The share of each step left empty between bands, from 0 to 1. Defaults to 0.2. */
  padding?: number | undefined;
}

export interface BandScale {
  readonly domain: readonly string[];
  readonly range: ScaleInterval;
  /** The distance between the starts of two neighbouring bands. */
  readonly step: number;
  /** The length of each band. */
  readonly bandwidth: number;
  /** Where a category's band starts, at its lower position; `NaN` for a category not in the domain. */
  map(category: string): number;
  /** One tick per category, at the middle of its band, labelled with the category. */
  ticks(): Array<ScaleTick<string>>;
}

const defaultPadding = 0.2;

function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * A band scale that splits a range into one equal step per category, each holding a band with
 * `padding` of the step left empty around it (half on each outer edge), as the bars of a bar
 * chart are laid out. Repeated categories keep their first band.
 */
export function createBandScale(options: BandScaleOptions): BandScale {
  const padding = Math.min(1, Math.max(0, toFinite(options.padding, defaultPadding)));
  const range: ScaleInterval = [toFinite(options.range[0], 0), toFinite(options.range[1], 0)];
  const domain = [...new Set(options.domain)];
  const low = Math.min(...range);
  const length = Math.abs(range[1] - range[0]);
  const step = domain.length > 0 ? length / domain.length : 0;
  const bandwidth = step * (1 - padding);
  const isReversed = range[1] < range[0];
  const indexes = new Map(domain.map((category, index) => [category, index]));
  const map = (category: string) => {
    const index = indexes.get(category);
    if (index === undefined) return Number.NaN;
    const slot = isReversed ? domain.length - 1 - index : index;
    return low + slot * step + (step - bandwidth) / 2;
  };
  return {
    domain,
    range,
    step,
    bandwidth,
    map,
    ticks: () =>
      domain.map((category) => ({
        value: category,
        position: map(category) + bandwidth / 2,
        label: category,
      })),
  };
}
