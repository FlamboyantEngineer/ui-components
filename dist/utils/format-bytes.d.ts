/**
 * A byte count in the largest binary unit that keeps it at 1 or more: `512 B`, `1.5 KB`, `20.0 MB`.
 * Bytes are whole; larger units show one decimal, separated as `locale` writes decimals. A value
 * that is not a finite, positive number reads as `0 B`.
 */
export declare function formatBytes(bytes: number, locale?: string): string;
//# sourceMappingURL=format-bytes.d.ts.map