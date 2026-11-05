// Quantities typed with a unit (`5cm`, `0,5 m`) read as numbers in a number field's own unit.

/** The units a number field reads typed quantities in, and the unit its value is in. */
export interface NumberFieldUnits {
  /** The unit of the value, shown after the number (`mm`). A number typed alone is in it. */
  unit: string;
  /**
   * The units a reader may type after a number, each with how many of `unit` one of it makes:
   * `{ mm: 1, cm: 10, m: 1000 }`. Only proportional conversions: no offsets, as temperatures need.
   */
  conversions: Readonly<Record<string, number>>;
}

/** The units a field reads, with `unit` itself at a factor of one unless listed. */
export function listUnits(units: NumberFieldUnits): [string, number][] {
  return Object.entries({ [units.unit]: 1, ...units.conversions });
}

/**
 * The format options a field with units writes and reads numbers with. Compact notation (`12K`)
 * cannot be read back, as only its magnitude's letters would be left out, so it becomes standard.
 */
export function toQuantityFormatOptions(
  options: Intl.NumberFormatOptions | undefined,
): Intl.NumberFormatOptions | undefined {
  if (options?.notation !== 'compact') return options;
  const { notation: _notation, compactDisplay: _compactDisplay, ...standard } = options;
  return standard;
}

// `\s` covers the no-break spaces some locales group digits with; the marks are the bidi controls
// right-to-left locales write around signs.
const spaces = /[\s\u061c\u200e\u200f]/g;

/** How a locale and format options write numbers, as a reader may type them back. */
interface NumberNotation {
  group: string;
  decimal: string;
  minus: string;
  /** The locale's digits, zero to nine, when they are not ASCII digits. */
  digits: readonly string[];
  /** Signs around the number the format adds, as a percent or currency sign. */
  affixes: readonly string[];
  /**
   * The exponent separators of scientific or engineering notation (`E`, `أس`, `×10^`), as written
   * and with ASCII digits, and the exponent's minus sign; empty without an exponent.
   */
  exponents: readonly string[];
  exponentMinus: string;
  /** Whether the format encloses negative magnitudes in accounting parentheses. */
  accounting: boolean;
  /** Percent scaling: the number written is a hundred times the value. */
  scale: number;
}

const notationCache = new Map<string, NumberNotation>();
const numberParts = new Set(['integer', 'group', 'decimal', 'fraction', 'minusSign', 'plusSign']);
const exponentParts = /^exponent/;

/** The separators, digits and signs a locale writes numbers with, under the field's format options. */
function readNotation(locale: string, options: Intl.NumberFormatOptions = {}): NumberNotation {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  const known = notationCache.get(cacheKey);
  if (known) return known;
  const formatter = new Intl.NumberFormat(locale, options);
  // A small number's negative exponent shows the exponent's minus sign too.
  const parts = [...formatter.formatToParts(-12345.6), ...formatter.formatToParts(-0.000123)];
  const find = (type: string, fallback: string) =>
    parts.find((part) => part.type === type)?.value ?? fallback;
  const { numberingSystem } = formatter.resolvedOptions();
  const digitFormat = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false });
  const decimal =
    digitFormat.formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
  const literals = parts
    .filter((part) => part.type === 'literal')
    .map((part) => part.value)
    .join('');
  const digits =
    numberingSystem === 'latn' ? [] : [...'0123456789'].map((d) => digitFormat.format(+d));
  const exponent = find('exponentSeparator', '').replace(spaces, '');
  const notation: NumberNotation = {
    group: find('group', ''),
    decimal: find('decimal', decimal),
    minus: find('minusSign', '-'),
    digits,
    exponents: exponent ? [...new Set([exponent, toAsciiDigits(exponent, digits)])] : [],
    exponentMinus: find('exponentMinusSign', '-'),
    affixes: parts
      .filter((part) => !numberParts.has(part.type) && !exponentParts.test(part.type))
      .map((part) => part.value.replace(spaces, '').replace(/[()]/g, ''))
      .filter((value) => value !== ''),
    accounting: literals.includes('(') && literals.includes(')'),
    scale: options.style === 'percent' ? 100 : 1,
  };
  notationCache.set(cacheKey, notation);
  return notation;
}

/** Text with a locale's digits written as ASCII digits. */
function toAsciiDigits(text: string, digits: readonly string[]): string {
  let ascii = text;
  digits.forEach((digit, value) => {
    ascii = ascii.replaceAll(digit, String(value));
  });
  return ascii;
}

const plainNumber = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * A number written as a locale and the field's format options write it (`1,234.5`, `1.234,5`,
 * `1 234,5`, `١٢٫٥`, `25%`, `١٫٢أس٤`), as a number; `NaN` when it is none. The locale's grouping is
 * ignored, its decimal sign, minus sign, digits and exponent signs read alongside ASCII ones, and the signs the format adds
 * (a percent or currency sign) dropped; a percent format reads the number as hundredths. The minus
 * sign (U+2212) counts as a hyphen. Accounting parentheses enclose a negative magnitude when the
 * format uses them; unmatched parentheses or a second leading sign are unreadable.
 */
export function parseLocaleNumber(
  text: string,
  locale: string,
  options?: Intl.NumberFormatOptions,
): number {
  const notation = readNotation(locale, options);
  const { group, decimal, minus, digits, affixes, accounting, scale } = notation;
  let plain = text.replace(spaces, '');
  for (const affix of affixes) plain = plain.replaceAll(affix, '');
  // The exponent separator may hold the locale's digits (`×۱۰^`), so it goes before they do.
  for (const exponent of notation.exponents) plain = plain.replaceAll(exponent, 'e');
  plain = toAsciiDigits(plain, digits);
  plain = plain.replaceAll(notation.exponentMinus, '-');
  const groupSign = group.replace(spaces, '');
  if (groupSign && groupSign !== decimal) plain = plain.replaceAll(groupSign, '');
  plain = plain.replaceAll(minus, '-').replaceAll('\u2212', '-').replace(decimal, '.');
  let sign = 1;
  if (/[()]/.test(plain)) {
    if (!accounting || !/^\([^()]*\)$/.test(plain)) return Number.NaN;
    plain = plain.slice(1, -1);
    if (/^[+-]/.test(plain)) return Number.NaN;
    sign = -1;
  }
  if (!plainNumber.test(plain)) return Number.NaN;
  const value = sign * Number(plain);
  return scale === 1 ? value : Number((value / scale).toPrecision(15));
}

/** The unit a text ends with, the longest first, matched exactly or else in any case. */
function findUnit(text: string, units: NumberFieldUnits): [string, number] | undefined {
  const known = listUnits(units).sort(([a], [b]) => b.length - a.length);
  const exact = known.find(([unit]) => text.endsWith(unit));
  if (exact) return exact;
  const folded = text.toLocaleLowerCase();
  return known.find(([unit]) => folded.endsWith(unit.toLocaleLowerCase()));
}

/**
 * A typed quantity (`5cm`, `5 cm`, `0,5 m`, `50`, written as `parseLocaleNumber` reads) in the field's unit: the number times its unit's
 * conversion, rounded to 15 significant digits so `0.1 m` reads `100`, not `100.00000000000001`. A
 * number alone is in the field's unit. `null` for empty text; `NaN` for text that is no number, or
 * that ends in a unit the field does not read.
 */
export function parseQuantity(
  text: string,
  units: NumberFieldUnits,
  { locale, options }: { locale: string; options?: Intl.NumberFormatOptions | undefined },
): number | null {
  const source = text.trim();
  if (!source) return null;
  const found = findUnit(source, units);
  const number = found ? source.slice(0, source.length - found[0].length) : source;
  const value = parseLocaleNumber(number, locale, options) * (found?.[1] ?? 1);
  return Number.isFinite(value) ? Number(value.toPrecision(15)) : Number.NaN;
}
