/**
 * Pairs each value with a React key built from its identity and how many equal identities came
 * before it (`apple:0`, `apple:1`). Keys follow content rather than position, so inserting or
 * removing an entry keeps the other entries' state; swapping two equal entries is harmless because
 * they render the same content.
 */
export function assignOccurrenceKeys(values, identity) {
    const occurrences = new Map();
    return values.map((value) => {
        const base = identity(value);
        const occurrence = occurrences.get(base) ?? 0;
        occurrences.set(base, occurrence + 1);
        return { key: `${base}:${occurrence}`, value };
    });
}
//# sourceMappingURL=stable-keys.js.map