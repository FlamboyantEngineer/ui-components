// Byte sizes as readers see them, for file pickers and size limits (specs/FORMAT-BYTES.md).

import { getNumberFormat } from './intl-format.js';

const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

const bytesPerUnit = 1024;

/**
 * A byte count in the largest binary unit that keeps it at 1 or more: `512 B`, `1.5 KB`, `20.0 MB`.
 * Bytes are whole; larger units show one decimal, separated as `locale` writes decimals. A value
 * that is not a finite, positive number reads as `0 B`.
 */
export function formatBytes(bytes: number, locale?: string): string {
  const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let exponent = 0;
  while (size >= bytesPerUnit ** (exponent + 1) && exponent < byteUnits.length - 1) exponent += 1;
  const digits = exponent === 0 ? 0 : 1;
  const number = getNumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(size / bytesPerUnit ** exponent);
  return `${number} ${byteUnits[exponent]}`;
}
