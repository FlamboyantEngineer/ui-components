import { useMemo, useRef } from 'react';
import { useDragType } from '../../utils/use-drag-type.js';
import { useLatest } from '../../utils/use-latest.js';
import { resolveBoardDrop, resolveColumnDrop, } from './board-moves.js';
/**
 * The board's card drag and drop, shared by its cells: one move operation on a media type of its
 * own, each drop checked against the cards the board last rendered. `null` without `onMove`.
 */
export function useBoardCardDrag(source) {
    const latest = useLatest(source);
    const dragType = useDragType('board-card');
    const dragging = useRef(null);
    const drag = useMemo(() => {
        const resolveDrop = (address, target) => {
            const key = dragging.current;
            return key === null
                ? null
                : resolveBoardDrop(latest.current.layout, { key, address, target });
        };
        return {
            dragType,
            resolveDrop,
            setDragging: (key) => {
                dragging.current = key;
            },
            drop: (address, target) => {
                const move = resolveDrop(address, target);
                if (move)
                    latest.current.onMove?.(move);
            },
            getTextValue: (key) => latest.current.getTextValue(key),
        };
    }, [dragType, latest]);
    return source.onMove ? drag : null;
}
/** The board's column drag and drop, shared by its column headers. `null` without `onMove`. */
export function useBoardColumnDrag(source) {
    const latest = useLatest(source);
    const dragType = useDragType('board-column');
    const dragging = useRef(null);
    const drag = useMemo(() => ({
        dragType,
        dragging,
        resolveDrop: (targetKey) => {
            const key = dragging.current;
            return key === null ? null : resolveColumnDrop(latest.current.columns, { key, targetKey });
        },
        onMove: (move) => latest.current.onMove?.(move),
    }), [dragType, latest]);
    return source.onMove ? drag : null;
}
//# sourceMappingURL=use-board-drag.js.map