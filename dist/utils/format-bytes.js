// Byte sizes as readers see them, for file pickers and size limits (specs/FORMAT-BYTES.md).
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const STEP = 1024;
/**
 * A byte count in the largest binary unit that keeps it at 1 or more: `512 B`, `1.5 KB`, `20.0 MB`.
 * Bytes are whole; larger units show one decimal, separated as `locale` writes decimals. A value
 * that is not a finite, positive number reads as `0 B`.
 */
export function formatBytes(bytes, locale) {
    const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
    let exponent = 0;
    while (size >= STEP ** (exponent + 1) && exponent < UNITS.length - 1)
        exponent += 1;
    const digits = exponent === 0 ? 0 : 1;
    const number = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(size / STEP ** exponent);
    return `${number} ${UNITS[exponent]}`;
}
//# sourceMappingURL=format-bytes.js.map