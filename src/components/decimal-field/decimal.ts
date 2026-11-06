// Exact decimal arithmetic on canonical decimal strings, through integers of any size: a decimal
// is `units / 10^scale`, so no value ever passes through a JavaScript number.

/** How a value with more fraction digits than a field keeps is rounded. */
export type DecimalRoundingMode = 'halfExpand' | 'halfEven' | 'trunc';

/** An exact decimal: `units / 10 ** scale`. */
interface Decimal {
  units: bigint;
  scale: number;
}

const zero: Decimal = { units: 0n, scale: 0 };

const decimalPattern = /^([+-]?)(\d*)(?:\.(\d*))?$/;

/** The decimal a plain decimal text spells (`-12.50`, `.5`, `7.`), or `null` for any other text. */
function parseDecimal(text: string): Decimal | null {
  const match = decimalPattern.exec(text.trim());
  if (!match) return null;
  const [, sign = '', whole = '', fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  const units = BigInt(`${whole}${fraction}` || '0');
  return { units: sign === '-' ? -units : units, scale: fraction.length };
}

/** The canonical text of a decimal: no exponent, no leading or trailing zeros, no `-0`. */
function formatDecimal({ units, scale }: Decimal): string {
  const negative = units < 0n;
  const digits = (negative ? -units : units).toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, digits.length - scale);
  const fraction = digits.slice(digits.length - scale).replace(/0+$/, '');
  const text = fraction ? `${whole}.${fraction}` : whole;
  return negative && text !== '0' ? `-${text}` : text;
}

function toScale(value: Decimal, scale: number): bigint {
  return value.units * 10n ** BigInt(scale - value.scale);
}

/** The same decimals written with one scale, the larger of theirs. */
function align(a: Decimal, b: Decimal): [bigint, bigint, number] {
  const scale = Math.max(a.scale, b.scale);
  return [toScale(a, scale), toScale(b, scale), scale];
}

/** `numerator / divisor` rounded to an integer by the mode; the divisor is positive. */
function divideRounded(numerator: bigint, divisor: bigint, mode: DecimalRoundingMode): bigint {
  const quotient = numerator / divisor;
  const remainder = numerator % divisor;
  if (remainder === 0n || mode === 'trunc') return quotient;
  const away = numerator < 0n ? -1n : 1n;
  const twice = (remainder < 0n ? -remainder : remainder) * 2n;
  if (twice > divisor) return quotient + away;
  if (twice < divisor) return quotient;
  if (mode === 'halfEven') return quotient % 2n === 0n ? quotient : quotient + away;
  return quotient + away;
}

/**
 * The canonical form of a decimal text, or `null` when the text is no plain decimal: `+1.50`
 * reads `1.5`, `-0` reads `0`, `007` reads `7`. Exponents, separators and other text are not
 * decimals here; a field reads those with its locale.
 */
export function toCanonicalDecimal(text: string): string | null {
  const value = parseDecimal(text);
  return value ? formatDecimal(value) : null;
}

/** The number of fraction digits of a decimal text, as written. */
export function countFractionDigits(text: string): number {
  return parseDecimal(text)?.scale ?? 0;
}

/** Whether `a` is below (-1), equal to (0) or above (1) `b`. Both are decimal texts. */
export function compareDecimals(a: string, b: string): -1 | 0 | 1 {
  const [x, y] = align(parseDecimal(a) ?? zero, parseDecimal(b) ?? zero);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** `a + b`, exactly. */
export function addDecimals(a: string, b: string): string {
  const [x, y, scale] = align(parseDecimal(a) ?? zero, parseDecimal(b) ?? zero);
  return formatDecimal({ units: x + y, scale });
}

/** A decimal with at most `scale` fraction digits, rounded by the mode. */
export function roundDecimal(text: string, scale: number, mode: DecimalRoundingMode): string {
  const value = parseDecimal(text) ?? zero;
  if (value.scale <= scale) return formatDecimal(value);
  const divisor = 10n ** BigInt(value.scale - scale);
  return formatDecimal({ units: divideRounded(value.units, divisor, mode), scale });
}

/** The step grid of a field: steps of `step` counted from `origin`. */
export interface DecimalGrid {
  step: string;
  origin: string;
}

/** How many steps `value` lies from the origin: a whole number, rounded by the mode. */
function countSteps(
  value: string,
  grid: DecimalGrid,
  mode: DecimalRoundingMode | 'floor' | 'ceil',
) {
  const offset = parseDecimal(addDecimals(value, negate(grid.origin))) ?? zero;
  const [units, step] = align(offset, parseDecimal(grid.step) ?? zero);
  if (step <= 0n) return null;
  if (mode === 'floor' || mode === 'ceil') {
    const quotient = units / step;
    const remainder = units % step;
    if (remainder === 0n) return quotient;
    const down = units < 0n ? quotient - 1n : quotient;
    return mode === 'floor' ? down : down + 1n;
  }
  return divideRounded(units, step, mode);
}

function negate(text: string): string {
  const value = parseDecimal(text) ?? zero;
  return formatDecimal({ units: -value.units, scale: value.scale });
}

/** The grid value `count` steps from the origin. */
function gridValue(count: bigint, grid: DecimalGrid): string {
  const step = parseDecimal(grid.step) ?? zero;
  return addDecimals(grid.origin, formatDecimal({ units: step.units * count, scale: step.scale }));
}

/** Whether a decimal lies on the grid. A step that is not above zero puts every value on it. */
export function isOnDecimalStep(value: string, grid: DecimalGrid): boolean {
  const count = countSteps(value, grid, 'trunc');
  return count === null || compareDecimals(gridValue(count, grid), value) === 0;
}

/** The bounds of a field, either of which may be open. */
export interface DecimalBounds {
  minValue?: string | undefined;
  maxValue?: string | undefined;
}

/** The value within the bounds. */
export function clampDecimal(value: string, { minValue, maxValue }: DecimalBounds): string {
  if (minValue !== undefined && compareDecimals(value, minValue) < 0) return minValue;
  if (maxValue !== undefined && compareDecimals(value, maxValue) > 0) return maxValue;
  return value;
}

/** A step grid within bounds. */
export type DecimalRange = DecimalGrid & DecimalBounds;

/**
 * The nearest grid value within the bounds (half a step rounds away from the origin): a value
 * past an end that is off the grid stops at the last grid value inside it.
 */
export function snapDecimal(value: string, range: DecimalRange): string {
  const count = countSteps(clampDecimal(value, range), range, 'halfExpand');
  if (count === null) return clampDecimal(value, range);
  return insideBounds(gridValue(count, range), range, range);
}

/** A grid value moved back inside the bounds by whole steps. */
function insideBounds(value: string, grid: DecimalGrid, { minValue, maxValue }: DecimalBounds) {
  if (maxValue !== undefined && compareDecimals(value, maxValue) > 0) {
    return gridValue(countSteps(maxValue, grid, 'floor') ?? 0n, grid);
  }
  if (minValue !== undefined && compareDecimals(value, minValue) < 0) {
    return gridValue(countSteps(minValue, grid, 'ceil') ?? 0n, grid);
  }
  return value;
}

/**
 * The value one step up (`direction` 1) or down (-1) on the grid, within the bounds: a value off
 * the grid moves to the next grid value that way.
 */
export function stepDecimal(value: string, direction: 1 | -1, range: DecimalRange): string {
  const count = countSteps(value, range, direction > 0 ? 'floor' : 'ceil');
  if (count === null) return clampDecimal(value, range);
  const next = gridValue(count + BigInt(direction), range);
  const inside = insideBounds(next, range, range);
  // A value at or past the last grid value inside an end stays where it is.
  return compareDecimals(inside, value) === direction ? inside : value;
}
