/** The largest projected value, preserving Math.max semantics for empty and non-finite inputs. */
export function findMaximum(values, getValue, initial = -Infinity) {
    let largest = initial;
    for (const value of values)
        largest = Math.max(largest, getValue(value));
    return largest;
}
//# sourceMappingURL=find-maximum.js.map