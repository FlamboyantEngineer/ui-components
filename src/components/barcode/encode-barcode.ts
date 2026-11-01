// The linear barcode encoder: input checks, check digits and the modules of each format.

import { code128MaxLength, code128Modules, code128Values } from './code-128.js';
import { eanCheckDigit, eanModules } from './ean.js';

/** The symbologies `encodeBarcode` draws. */
export type BarcodeFormat = 'code128' | 'ean13' | 'upca' | 'ean8';

/**
 * Why a value has no symbol: a character the format cannot hold, a length it does not take, or a
 * check digit that does not match the others.
 */
export type BarcodeInvalidReason = 'characters' | 'length' | 'checksum';

export interface BarcodeSymbol {
  format: BarcodeFormat;
  /** The human-readable value: the text, or the digits with their check digit. */
  text: string;
  /** The modules from the first bar to the last, `true` for a bar, without the quiet zones. */
  modules: boolean[];
  /** The light modules the format requires before and after the bars. */
  quietZone: readonly [start: number, end: number];
}

export type BarcodeResult =
  | { symbol: BarcodeSymbol; invalid?: undefined }
  | { symbol?: undefined; invalid: BarcodeInvalidReason };

/** The digits each EAN or UPC format holds, check digit included, and its quiet zones. */
const digitFormats = {
  ean13: { length: 13, quietZone: [11, 7] },
  upca: { length: 12, quietZone: [9, 9] },
  ean8: { length: 8, quietZone: [7, 7] },
} as const;

const code128QuietZone = [10, 10] as const;

function encodeCode128(value: string): BarcodeResult {
  if (value.length === 0 || value.length > code128MaxLength) return { invalid: 'length' };
  // Code sets A and B hold ASCII; Latin-1 through FNC4 is left out, as readers vary in reading it.
  if ([...value].some((character) => (character.codePointAt(0) ?? 0) > 127)) {
    return { invalid: 'characters' };
  }
  const modules = code128Modules(code128Values(value));
  return { symbol: { format: 'code128', text: value, modules, quietZone: code128QuietZone } };
}

function encodeDigits(value: string, format: keyof typeof digitFormats): BarcodeResult {
  const { length, quietZone } = digitFormats[format];
  if (!/^\d*$/.test(value)) return { invalid: 'characters' };
  if (value.length !== length && value.length !== length - 1) return { invalid: 'length' };
  const data = value.slice(0, length - 1);
  const text = `${data}${eanCheckDigit(data)}`;
  if (value.length === length && value !== text) return { invalid: 'checksum' };
  // A UPC-A symbol is the EAN-13 symbol of its digits after a leading 0.
  const modules = eanModules(format === 'upca' ? `0${text}` : text);
  return { symbol: { format, text, modules, quietZone } };
}

/**
 * Encodes `value` as a linear barcode. `code128` takes 1 to 80 ASCII characters. `ean13`, `upca`
 * and `ean8` take 12, 11 and 7 digits and add the check digit, or 13, 12 and 8 digits whose last is
 * a check digit that must match.
 */
export function encodeBarcode(value: string, format: BarcodeFormat): BarcodeResult {
  return format === 'code128' ? encodeCode128(value) : encodeDigits(value, format);
}
