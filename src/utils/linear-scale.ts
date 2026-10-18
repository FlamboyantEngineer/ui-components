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
  /** About how many ticks to make. Defaults to 5. */
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
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const error = raw / power;
  if (error >= tenfold) return power * 10;
  if (error >= fivefold) return power * 5;
  return error >= twofold ? power * 2 : power;
}

/** How many decimals the multiples of `step` need. */
function countDecimals(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}

/** `count` multiples of `step`, written without floating-point noise. */
function toMultiple(count: number, step: number): number {
  return Number((count * step).toFixed(countDecimals(step)));
}

/** The domain widened to whole steps; the step is found again once, as widening can change it. */
function niceDomain([first, last]: ScaleInterval, count: number): ScaleInterval {
  let low = Math.min(first, last);
  let high = Math.max(first, last);
  for (let pass = 0; pass < 2; pass += 1) {
    const step = findTickStep(high - low, count);
    if (step === undefined) break;
    low = toMultiple(Math.floor(low / step), step);
    high = toMultiple(Math.ceil(high / step), step);
  }
  return first <= last ? [low, high] : [high, low];
}

/** Proportional interpolation from one interval to another, for both directions of a scale. */
function interpolate(from: ScaleInterval, to: ScaleInterval, isClamped: boolean) {
  return (point: number): number => {
    if (!Number.isFinite(point)) return Number.NaN;
    const span = from[1] - from[0];
    if (span === 0) return (to[0] + to[1]) / 2;
    const ratio = (point - from[0]) / span;
    return to[0] + (isClamped ? clamp(ratio, 0, 1) : ratio) * (to[1] - to[0]);
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
  const count = Math.max(1, Math.round(toFinite(options.tickCount, defaultTickCount)));
  const given: ScaleInterval = [toFinite(options.domain[0], 0), toFinite(options.domain[1], 0)];
  const domain = options.nice ? niceDomain(given, count) : given;
  const range: ScaleInterval = [toFinite(options.range[0], 0), toFinite(options.range[1], 0)];
  const low = Math.min(...domain);
  const high = Math.max(...domain);
  const step = findTickStep(high - low, count);
  const labels = createLabelFormat(options, step);
  const map = interpolate(domain, range, options.clamp === true);
  const format = (value: number) => labels.format(value);
  const ticks = () => {
    if (step === undefined) return [{ value: low, position: map(low), label: format(low) }];
    const values: number[] = [];
    const last = Math.floor(high / step + 1e-9);
    for (let index = Math.ceil(low / step - 1e-9); index <= last; index += 1) {
      values.push(toMultiple(index, step));
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
