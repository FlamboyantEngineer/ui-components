// Byte sizes as readers see them, for file pickers and size limits (specs/FORMAT-BYTES.md).

import { getNumberFormat } from './intl-format.js';

const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

const bytesPerUnit = 1024;

/** Bytes are whole; larger units show one decimal. */
function toDigits(exponent: number): number {
  return exponent === 0 ? 0 : 1;
}

/** `value` rounded as the unit at `exponent` shows it. */
function roundTo(value: number, exponent: number): number {
  const scale = 10 ** toDigits(exponent);
  return Math.round(value * scale) / scale;
}

/**
 * A byte count in the largest binary unit that keeps it at 1 or more: `512 B`, `1.5 KB`, `20.0 MB`.
 * Bytes are whole; larger units show one decimal, separated as `locale` writes decimals. A value
 * that is not a finite, positive number reads as `0 B`. A size that would round to 1024 of a unit
 * shows in the next unit instead (`1.0 MB`, never `1,024.0 KB`).
 */
export function formatBytes(bytes: number, locale?: string): string {
  const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let exponent = 0;
  while (size >= bytesPerUnit ** (exponent + 1) && exponent < byteUnits.length - 1) exponent += 1;
  // A size just under the next unit rounds up to 1024 of this one: show it as 1 of the next.
  if (
    exponent < byteUnits.length - 1 &&
    roundTo(size / bytesPerUnit ** exponent, exponent) >= bytesPerUnit
  ) {
    exponent += 1;
  }
  const digits = toDigits(exponent);
  const number = getNumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(size / bytesPerUnit ** exponent);
  return `${number} ${byteUnits[exponent]}`;
}
