import { useState } from 'react';
import { useElementSize } from '../../utils/use-element-size.js';
import { listMatrixIndices, resolveMatrixColumnTracks, resolveMatrixSpan, } from './matrix-window.js';
/** Items rendered beyond each edge of the view. */
const overscan = 2;
/** The view assumed before the first measurement (and where nothing measures, as in tests). */
const fallbackView = { width: 960, height: 480 };
function listAll(count) {
    return Array.from({ length: count }, (_, index) => index);
}
/**
 * Which rows and columns of a matrix to render: all of them, or with `virtualized` only those in
 * view of the scroll container (plus a small overscan and the focused cell), from its scroll
 * position, its size and the fixed row height and column width.
 */
export function useMatrixWindow(options) {
    const { root, header, corner, virtualized, rowCount, columnCount, rowHeight, columnWidth } = options;
    const [scroll, setScroll] = useState({ top: 0, left: 0 });
    const view = useElementSize(root, { box: 'client' }) ?? fallbackView;
    const headerHeight = useElementSize(header, { box: 'border-box' })?.height ?? 0;
    const cornerWidth = useElementSize(corner, { box: 'border-box' })?.width ?? 0;
    const bodyHeight = Math.max(view.height - headerHeight, rowHeight);
    const rowSpan = virtualized
        ? resolveMatrixSpan({
            ...{ offset: scroll.top, extent: bodyHeight },
            ...{ size: rowHeight, count: rowCount, overscan },
        })
        : { start: 0, end: rowCount };
    const columnSpan = virtualized
        ? resolveMatrixSpan({
            ...{ offset: scroll.left, extent: view.width - cornerWidth },
            ...{ size: columnWidth, count: columnCount, overscan },
        })
        : { start: 0, end: columnCount };
    const rows = virtualized ? listMatrixIndices(rowSpan, options.focus.row) : listAll(rowCount);
    const columns = virtualized
        ? listMatrixIndices(columnSpan, options.focus.column)
        : listAll(columnCount);
    return {
        rows,
        columns,
        tracks: resolveMatrixColumnTracks({ indices: columns, count: columnCount, width: columnWidth }),
        onScroll: (event) => {
            const target = event.currentTarget;
            // Right-to-left containers scroll to negative offsets.
            const next = { top: target.scrollTop, left: Math.abs(target.scrollLeft) };
            if (virtualized && (next.top !== scroll.top || next.left !== scroll.left))
                setScroll(next);
        },
    };
}
//# sourceMappingURL=use-matrix-window.js.map