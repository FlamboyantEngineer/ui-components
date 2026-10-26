import { useCallback, useState } from 'react';
const noOffsets = {};
function sumWidths(columns, pin) {
    const offsets = {};
    let offset = 0;
    for (const column of columns) {
        if (column.pin !== pin)
            continue;
        offsets[column.key] = offset;
        offset += column.width;
    }
    return offsets;
}
function isSameOffsets(left, right) {
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}
/**
 * Each pinned column's distance from its edge: the summed widths of the columns pinned to the
 * same edge between it and that edge.
 */
export function computePinOffsets(columns) {
    return { ...sumWidths(columns, 'start'), ...sumWidths([...columns].reverse(), 'end') };
}
/** The offsets of a table's pinned columns, as the header last reported them. */
export function usePinnedOffsets(isActive) {
    const [offsets, setOffsets] = useState(noOffsets);
    const report = useCallback((next) => {
        setOffsets((current) => (isSameOffsets(current, next) ? current : next));
    }, []);
    return { offsets: isActive ? offsets : noOffsets, report };
}
//# sourceMappingURL=use-pinned-offsets.js.map