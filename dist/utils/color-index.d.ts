/**
 * A stable colour slot for a key (a name or an id): an integer from 0 to `count - 1` that is the
 * same on every render, page and device. Leading and trailing whitespace in the key is ignored. A
 * `count` below one yields 0.
 */
export declare function getColorIndex(key: string, count: number): number;
//# sourceMappingURL=color-index.d.ts.map