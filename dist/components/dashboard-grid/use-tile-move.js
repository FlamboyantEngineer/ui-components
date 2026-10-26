import { useRef } from 'react';
import { useLocale, useMove } from '../../primitives/index.js';
/**
 * The tile an accumulated move of `cells` makes from `origin`. A resize keeps the tile's start, so
 * it never spans past the last column.
 */
function resolveMovedItem({ origin, cells }, { kind, columns, minColumnSpan, minRowSpan, }) {
    if (kind === 'move')
        return { ...origin, x: origin.x + cells.x, y: origin.y + cells.y };
    return {
        ...origin,
        w: Math.min(columns - origin.x, Math.max(minColumnSpan, origin.w + cells.x)),
        h: Math.max(minRowSpan, origin.h + cells.y),
    };
}
/**
 * Pointer drags and arrow keys that move or resize a tile by whole cells. A pointer move snaps to
 * the nearest cell, and previews again only when it reaches another cell; each arrow key press
 * moves one cell, toward the inline end for the right arrow in left-to-right text and the left
 * arrow in right-to-left text.
 */
export function useTileMove(options) {
    const { direction } = useLocale();
    const start = useRef(null);
    const sign = direction === 'rtl' ? -1 : 1;
    const { moveProps } = useMove({
        onMoveStart: () => {
            start.current = {
                origin: options.item,
                step: options.measureStep(),
                deltaX: 0,
                deltaY: 0,
                cells: null,
            };
        },
        onMove: (event) => {
            const active = start.current;
            if (!active)
                return;
            active.deltaX += sign * event.deltaX;
            active.deltaY += event.deltaY;
            const isKeyboard = event.pointerType === 'keyboard';
            const cells = {
                x: isKeyboard ? active.deltaX : Math.round(active.deltaX / active.step.column),
                y: isKeyboard ? active.deltaY : Math.round(active.deltaY / active.step.row),
            };
            if (active.cells?.x === cells.x && active.cells.y === cells.y)
                return;
            active.cells = cells;
            options.onPreview(resolveMovedItem({ origin: active.origin, cells }, options));
        },
        onMoveEnd: (event) => {
            start.current = null;
            options.onCommit(event.pointerType === 'keyboard');
        },
    });
    return moveProps;
}
//# sourceMappingURL=use-tile-move.js.map