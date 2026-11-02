// The text codecs of the number fields that type into a text input: nondecimal bases and quantities
// with units.

import type { UiStrings } from '../../core/strings.js';
import type { NumberTextCodec } from './text-number-control.js';
import { formatRadixNumber, parseRadixNumber, type NumberFieldRadix } from './radix-number.js';
import { listUnits, parseQuantity, type NumberFieldUnits } from './unit-number.js';

/** A nondecimal base: prefixed integers (`0x1f`), and text that is none put back. */
export function createRadixCodec(radix: NumberFieldRadix): NumberTextCodec {
  return {
    parse: (text) => parseRadixNumber(text, radix),
    format: (value) => formatRadixNumber(value, radix),
    describe: (value) => formatRadixNumber(value, radix),
    inputMode: radix === 16 ? 'text' : 'numeric',
  };
}

interface QuantityCodecOptions {
  units: NumberFieldUnits;
  locale: string;
  /** The field's format options, which the input reads numbers back with. */
  formatOptions: Intl.NumberFormatOptions | undefined;
  /** Formats a number in the field's unit, as its format options say. */
  format: (value: number) => string;
  strings: UiStrings;
}

/**
 * Quantities with units: the input reads a number with or without a unit (`5cm`, `50`) and shows
 * the number in the field's unit, which the end adornment names. Text that is no quantity in a
 * known unit stays and reports which units the field reads.
 */
export function createQuantityCodec({
  units,
  locale,
  formatOptions,
  format,
  strings,
}: QuantityCodecOptions): NumberTextCodec {
  const names = listUnits(units).map(([unit]) => unit);
  const list = new Intl.ListFormat(locale, { type: 'disjunction' }).format(names);
  return {
    parse: (text) => parseQuantity(text, units, { locale, options: formatOptions }),
    format: (value) => (value === null ? '' : format(value)),
    describe: (value) => `${format(value)} ${units.unit}`,
    inputMode: 'text',
    unreadable: { severity: 'error', message: strings.quantityUnreadable(list) },
  };
}
