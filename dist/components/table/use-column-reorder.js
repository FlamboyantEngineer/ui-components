import { useLayoutEffect, useRef, useState, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { resolveDropPosition } from '../../utils/pointer-drag.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { stepColumnMove } from './table-columns.js';
const dragType = 'application/x-ui-table-column';
const stepKeys = { ArrowLeft: -1, ArrowRight: 1 };
/** The data column headers of the table whose root is `root`. */
function listHeaders(root) {
    return [...root.querySelectorAll('[role="columnheader"][data-column]')].filter((header) => header.closest('.ui-table') === root);
}
/** The id of the data column whose header, in the table whose root is `root`, holds `target`. */
function findColumnId(target, root) {
    const header = target instanceof Element ? target.closest('[role="columnheader"]') : null;
    return listHeaders(root).find((candidate) => candidate === header)?.dataset['column'];
}
/** Where the drag over `event.target` would land: before or after the header, in reading order. */
function findDropTarget(event, context) {
    const id = findColumnId(event.target, event.currentTarget);
    const header = listHeaders(event.currentTarget).find((item) => item.dataset['column'] === id);
    if (!header || id === undefined || id === context.dragging.current)
        return null;
    const box = header.getBoundingClientRect();
    const position = resolveDropPosition({
        width: box.width,
        height: box.height,
        x: event.clientX - box.left,
        y: event.clientY - box.top,
        orientation: 'horizontal',
        isRtl: context.isRtl,
    });
    return { id, position };
}
/**
 * Header drag handlers. While a column drags, they claim every drag event in the capture phase, so
 * the grid's row drag and drop never sees a column drag.
 */
function createDragHandlers(context) {
    const { dragging, setDropTarget } = context;
    const claim = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return {
        onDragStartCapture: (event) => {
            const id = findColumnId(event.target, event.currentTarget);
            if (id === undefined || !context.isReorderable(id))
                return;
            dragging.current = id;
            event.dataTransfer.setData(dragType, id);
            event.dataTransfer.effectAllowed = 'move';
        },
        onDragEnterCapture: (event) => {
            if (dragging.current !== null)
                claim(event);
        },
        onDragOverCapture: (event) => {
            if (dragging.current === null)
                return;
            const target = findDropTarget(event, context);
            setDropTarget(target);
            claim(event);
            event.dataTransfer.dropEffect = target ? 'move' : 'none';
        },
        onDropCapture: (event) => {
            const id = dragging.current;
            if (id === null)
                return;
            const target = findDropTarget(event, context);
            if (target)
                context.moveColumn({ id, targetId: target.id, position: target.position });
            claim(event);
            dragging.current = null;
            setDropTarget(null);
        },
        onDragEndCapture: () => {
            dragging.current = null;
            setDropTarget(null);
        },
    };
}
/**
 * Column reordering: a reorderable column's header label drags onto another header, landing
 * before or after it, and Alt+ArrowLeft or Alt+ArrowRight on a focused header moves it one step.
 * Moves stay among the columns pinned to the same edge, and the moved header keeps focus.
 */
export function useColumnReorder({ columns, moveColumn, }) {
    const { direction } = useLocale();
    const isRtl = direction === 'rtl';
    const dragging = useRef(null);
    const refocus = useRef(null);
    const [dropTarget, setDropTarget] = useState(null);
    const isReorderable = (id) => columns.some((column) => column.id === id && column.allowsReordering);
    // Moving a header moves its element, which drops focus; give it back once the move renders.
    useLayoutEffect(() => {
        const pending = refocus.current;
        refocus.current = null;
        if (!pending)
            return;
        const header = listHeaders(pending.root).find((item) => item.dataset['column'] === pending.id);
        if (header && header !== document.activeElement)
            header.focus();
    });
    const onKeyDownCapture = (event) => {
        const step = stepKeys[event.key];
        const id = findColumnId(event.target, event.currentTarget);
        if (!step || !isMoveChord(event) || id === undefined || !isReorderable(id))
            return;
        const move = stepColumnMove(columns, id, isRtl ? -step : step);
        if (move) {
            refocus.current = { id, root: event.currentTarget };
            moveColumn(move);
        }
        event.preventDefault();
        event.stopPropagation();
    };
    const updateDropTarget = (target) => setDropTarget((current) => current?.id === target?.id && current?.position === target?.position ? current : target);
    const context = { dragging, isRtl, isReorderable, moveColumn, setDropTarget: updateDropTarget };
    return { dropTarget, rootProps: { onKeyDownCapture, ...createDragHandlers(context) } };
}
//# sourceMappingURL=use-column-reorder.js.map