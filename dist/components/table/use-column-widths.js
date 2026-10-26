import { useState } from 'react';
import { usePersistentState } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { pickColumnWidths, } from './column-sizing.js';
function restoreColumnKeys(widths) {
    return new Map([...widths].map(([key, value]) => [fromCollectionKey(key), value]));
}
/**
 * Column widths for a resizable table: previewed live while a column is being resized, then kept
 * (and persisted under `persistKey`) and reported once when the gesture ends.
 */
export function useColumnWidths(options) {
    const { columns, persistKey, onColumnWidthsChange } = options;
    const [stored, setStored] = usePersistentState(persistKey, {});
    const [live, setLive] = useState(null);
    const onResizeEnd = (widths) => {
        const next = pickColumnWidths(restoreColumnKeys(widths), columns);
        setStored(next);
        setLive(null);
        onColumnWidthsChange?.(next);
    };
    return {
        widths: live ?? pickColumnWidths(stored, columns),
        onResize: (widths) => setLive(pickColumnWidths(restoreColumnKeys(widths), columns)),
        onResizeEnd,
    };
}
//# sourceMappingURL=use-column-widths.js.map