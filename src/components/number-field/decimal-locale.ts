// Reading and writing decimal texts in a locale, digit by digit, so no value passes through a number.

import { bidiMarks } from '../../utils/bidi-marks.js';
import { getNumberFormat, normalizeIntlSpaces } from '../../utils/intl-format.js';
import { toCanonicalDecimal } from './decimal.js';

/** How a decimal field writes its value. */
export interface DecimalFormatOptions {
  /** Whether the whole part is grouped in thousands (`12,345`). Defaults to `true`. */
  useGrouping?: boolean | undefined;
  /** The fraction digits written at least, padding with zeros (`1.50` with 2). Defaults to 0. */
  minimumFractionDigits?: number | undefined;
}

interface DecimalSymbols {
  decimal: string;
  group: string;
  /** The locale's digits, zero to nine. */
  digits: readonly string[];
}

const symbolCache = new Map<string, DecimalSymbols>();

function getSymbols(locale: string): DecimalSymbols {
  const cached = symbolCache.get(locale);
  if (cached) return cached;
  const parts = getNumberFormat(locale, {}).formatToParts(11111.5);
  const digitText = getNumberFormat(locale, { useGrouping: false }).format(1234567890);
  const symbols = {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    digits: [...'0123456789'].map(
      (_, digit) => [...digitText].at(digit === 0 ? -1 : digit - 1) ?? '',
    ),
  };
  symbolCache.set(locale, symbols);
  return symbols;
}

// Spaces, and the bidi marks right-to-left locales write before a minus sign.
const space = new RegExp(`^[\\s\u00a0\u202f${bidiMarks}]$`);
const minusSigns = /[\u2212\u2012\u2013\ufe63\uff0d]/g;

/**
 * The canonical decimal a locale text spells: `{ value: null }` for empty text, `{ value }` for a
 * decimal, `null` for text that spells none. Group separators, spaces and bidi marks are skipped, the locale's
 * digits and minus signs read as their ASCII forms, and the decimal separator is the locale's (a
 * `.` reads as one too where the locale groups with something else).
 */
export function parseLocaleDecimal(text: string, locale: string): { value: string | null } | null {
  const { decimal, group, digits } = getSymbols(locale);
  let plain = '';
  for (const character of text.replace(minusSigns, '-')) {
    const digit = digits.indexOf(character);
    if (digit >= 0) plain += String(digit);
    else if (character === decimal) plain += '.';
    else if (character !== group && !space.test(character)) plain += character;
  }
  if (plain === '') return { value: null };
  const value = toCanonicalDecimal(plain);
  return value === null ? null : { value };
}

/**
 * A canonical decimal in the locale: the whole part as `Intl.NumberFormat` writes that exact
 * integer text (its sign and grouping), then the locale's decimal separator and every fraction
 * digit, padded to `minimumFractionDigits`. Nothing is rounded.
 */
export function formatLocaleDecimal(
  value: string,
  locale: string,
  { useGrouping = true, minimumFractionDigits = 0 }: DecimalFormatOptions = {},
): string {
  const [whole = '0', fraction = ''] = value.split('.');
  const padded = fraction.padEnd(minimumFractionDigits, '0');
  const { decimal, digits } = getSymbols(locale);
  // The exact integer text, so `-0` (the whole part of `-0.5`) keeps its sign.
  const integer = getNumberFormat(locale, { useGrouping }).format(whole as `${number}`);
  const fractionText = [...padded].map((digit) => digits[Number(digit)] ?? digit).join('');
  return normalizeIntlSpaces(`${integer}${padded ? `${decimal}${fractionText}` : ''}`);
}
