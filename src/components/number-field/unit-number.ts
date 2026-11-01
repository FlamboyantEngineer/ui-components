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

const separatorCache = new Map<string, { group: string; decimal: string }>();

/** The grouping and decimal separators of a locale's numbers. */
function readSeparators(locale: string) {
  const known = separatorCache.get(locale);
  if (known) return known;
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const separators = {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
  separatorCache.set(locale, separators);
  return separators;
}

// `\s` covers the no-break spaces some locales group digits with.
const spaces = /\s/g;
const plainNumber = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * A number written in a locale's digits and separators (`1,234.5`, `1.234,5`, `1 234,5`), as a
 * number; `NaN` when it is none. The locale's grouping is ignored and its decimal sign read, and the
 * minus sign (U+2212) counts as a hyphen.
 */
export function parseLocaleNumber(text: string, locale: string): number {
  const { group, decimal } = readSeparators(locale);
  const plain = text
    .replace(spaces, '')
    .replaceAll('\u2212', '-')
    .replaceAll(group.replace(spaces, ''), '')
    .replace(decimal, '.');
  return plainNumber.test(plain) ? Number(plain) : Number.NaN;
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
 * A typed quantity (`5cm`, `5 cm`, `0,5 m`, `50`) in the field's unit: the number times its unit's
 * conversion, rounded to 15 significant digits so `0.1 m` reads `100`, not `100.00000000000001`. A
 * number alone is in the field's unit. `null` for empty text; `NaN` for text that is no number, or
 * that ends in a unit the field does not read.
 */
export function parseQuantity(
  text: string,
  units: NumberFieldUnits,
  locale: string,
): number | null {
  const source = text.trim();
  if (!source) return null;
  const found = findUnit(source, units);
  const number = found ? source.slice(0, source.length - found[0].length) : source;
  const value = parseLocaleNumber(number, locale) * (found?.[1] ?? 1);
  return Number.isFinite(value) ? Number(value.toPrecision(15)) : Number.NaN;
}
