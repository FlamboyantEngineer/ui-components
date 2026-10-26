export type NumberFieldRadix = 2 | 8 | 10 | 16;
/** Nondecimal values keep a conventional prefix, including after a minus sign. */
export declare function formatRadixNumber(value: number | null, radix: NumberFieldRadix): string;
/** Parses a complete integer in the configured base, with an optional matching prefix. */
export declare function parseRadixNumber(text: string, radix: NumberFieldRadix): number | null;
//# sourceMappingURL=radix-number.d.ts.map