// Linear scales: numbers to positions, round tick values and their labels (specs/SCALES.md).

import { clamp } from './clamp.js';

/** A labelled mark on a scale. */
export interface ScaleTick<Value> {
  /** The value the tick marks. */
  value: Value;
  /** Where the value falls in the range. */
  position: number;
  /** The value as text for the scale's locale. */
  label: string;
}

/** The two ends of an interval; the first end of a domain maps to the first end of its range. */
export type ScaleInterval = readonly [number, number];

export interface LinearScaleOptions {
  /** The values mapped, from the first end to the second. */
  domain: ScaleInterval;
  /** The positions they map to, such as pixels; reversed ends flip the scale. */
  range: ScaleInterval;
  /** About how many ticks to make, clamped to 1–1000. Defaults to 5. */
  tickCount?: number | undefined;
  /** Extends the domain outward to whole tick steps. */
  nice?: boolean | undefined;
  /** Keeps positions inside the range, and values inside the domain, for points beyond them. */
  clamp?: boolean | undefined;
  /** BCP 47 locale of the labels. Defaults to the runtime's. */
  locale?: string | undefined;
  /** Replaces the label format, which by default writes as many decimals as the tick step has. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
}

export interface LinearScale {
  /** The domain, extended to whole tick steps when `nice`. */
  readonly domain: ScaleInterval;
  readonly range: ScaleInterval;
  /** The position of a value; `NaN` for a value that is not a finite number. */
  map(value: number): number;
  /** The value at a position; `NaN` for a position that is not a finite number. */
  invert(position: number): number;
  /** Round values a nice step apart inside the domain, in increasing order. */
  ticks(): Array<ScaleTick<number>>;
  /** A value as a tick label. */
  format(value: number): string;
}

const defaultTickCount = 5;
const maxTickCount = 1000;

// Step factors switch where the rounded step is closest to the raw one on a log scale.
const tenfold = Math.sqrt(50);
const fivefold = Math.sqrt(10);
const twofold = Math.sqrt(2);

function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The round step (1, 2 or 5 times a power of ten) that splits `span` into about `count` parts. */
function findTickStep(span: number, count: number): number | undefined {
  if (!(span > 0) || !Number.isFinite(span)) return undefined;
  const raw = span / count || span;
  if (!Number.isFinite(raw)) return undefined;
  const power = 10 ** Math.floor(Math.log10(raw)) || raw;
  const error = raw / power;
  const factor = error >= tenfold ? 10 : error >= fivefold ? 5 : error >= twofold ? 2 : 1;
  const step = power * factor;
  return Number.isFinite(step) ? step : undefined;
}

/** How many decimals the multiples of `step` need. */
function countDecimals(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}

/** `count` multiples of `step`, written without floating-point noise. */
function toMultiple(count: number, step: number): number {
  const value = count * step;
  const decimals = countDecimals(step);
  return Number(decimals > 100 ? value.toPrecision(15) : value.toFixed(decimals));
}

function findDomainStep([first, last]: ScaleInterval, count: number): number | undefined {
  const span = Math.abs(last - first);
  return Number.isFinite(span)
    ? findTickStep(span, count)
    : findTickStep(Math.abs(last / 2 - first / 2), count / 2);
}

/** The domain widened to whole steps; the step is found again once, as widening can change it. */
function niceDomain([first, last]: ScaleInterval, count: number): ScaleInterval {
  let low = Math.min(first, last);
  let high = Math.max(first, last);
  for (let pass = 0; pass < 2; pass += 1) {
    const step = findDomainStep([low, high], count);
    if (step === undefined) break;
    const nextLow = toMultiple(Math.floor(low / step), step);
    const nextHigh = toMultiple(Math.ceil(high / step), step);
    if (Number.isFinite(nextLow)) low = nextLow;
    if (Number.isFinite(nextHigh)) high = nextHigh;
  }
  return first <= last ? [low, high] : [high, low];
}

/** Proportional interpolation from one interval to another, for both directions of a scale. */
function interpolate(from: ScaleInterval, to: ScaleInterval, isClamped: boolean) {
  return (point: number): number => {
    if (!Number.isFinite(point)) return Number.NaN;
    const span = from[1] - from[0];
    if (span === 0) {
      const sum = to[0] + to[1];
      return Number.isFinite(sum) ? sum / 2 : to[0] / 2 + to[1] / 2;
    }
    const difference = point - from[0];
    const ratio = Number.isFinite(span)
      ? Number.isFinite(difference)
        ? difference / span
        : point / span - from[0] / span
      : (point / 2 - from[0] / 2) / (from[1] / 2 - from[0] / 2);
    const position = isClamped ? clamp(ratio, 0, 1) : ratio;
    const extent = to[1] - to[0];
    return Number.isFinite(extent)
      ? to[0] + position * extent
      : (1 - position) * to[0] + position * to[1];
  };
}

function createLabelFormat(
  options: Pick<LinearScaleOptions, 'locale' | 'formatOptions'>,
  step: number | undefined,
): Intl.NumberFormat {
  if (options.formatOptions || step === undefined) {
    return new Intl.NumberFormat(options.locale, options.formatOptions);
  }
  const decimals = countDecimals(step);
  if (decimals > 100) {
    return new Intl.NumberFormat(options.locale, {
      notation: 'scientific',
      maximumSignificantDigits: 15,
    });
  }
  return new Intl.NumberFormat(options.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * A linear scale from a domain of values to a range of positions, with round ticks. Non-finite
 * ends read as 0; a domain whose ends are equal maps every value to the middle of the range.
 */
export function createLinearScale(options: LinearScaleOptions): LinearScale {
  const count = clamp(Math.round(toFinite(options.tickCount, defaultTickCount)), 1, maxTickCount);
  const given: ScaleInterval = [toFinite(options.domain[0], 0), toFinite(options.domain[1], 0)];
  const domain = options.nice ? niceDomain(given, count) : given;
  const range: ScaleInterval = [toFinite(options.range[0], 0), toFinite(options.range[1], 0)];
  const low = Math.min(...domain);
  const high = Math.max(...domain);
  const step = findDomainStep(domain, count);
  const labels = createLabelFormat(options, step);
  const map = interpolate(domain, range, options.clamp === true);
  const format = (value: number) => labels.format(value);
  const ticks = () => {
    if (step === undefined) return [{ value: low, position: map(low), label: format(low) }];
    const values: number[] = [];
    const first = Math.ceil(low / step - 1e-9);
    const last = Math.floor(high / step + 1e-9);
    // An absolute tick index can exceed the safe integer range, where adding one never advances.
    for (let offset = 0; offset <= last - first; offset += 1) {
      const value = toMultiple(first + offset, step);
      if (value >= low && value <= high && value !== values.at(-1)) values.push(value);
    }
    return values.map((value) => ({ value, position: map(value), label: format(value) }));
  };
  return {
    domain,
    range,
    map,
    invert: interpolate(range, domain, options.clamp === true),
    ticks,
    format,
  };
}
