import { createElement, useLayoutEffect, useMemo, useRef, useState, } from 'react';
/** Whether a keydown holds Alt and no other modifier, as a collection's keyboard moves do. */
export function isMoveChord(event) {
    return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
/**
 * Drag and drop options that reorder a collection: one move operation, and a drop target wherever
 * `resolveMove` lets the dragged keys land. Every check reads the latest options, so a drop is
 * validated against the items shown when it happens, not those shown when the drag started. The
 * collection passes the result to `useDragAndDrop` from the primitives.
 */
export function useReorderDragAndDrop(options) {
    const latest = useRef(options);
    useLayoutEffect(() => {
        latest.current = options;
    });
    const dragging = useRef(new Set());
    const { renderDropIndicator } = options;
    // React Aria reads whether a preview exists once, so only its content follows later renders.
    const [hasPreview] = useState(options.renderDragPreview !== undefined);
    return useMemo(() => ({
        getItems: (keys) => [...keys].map((key) => ({ 'text/plain': latest.current.getTextValue(key) })),
        getAllowedDropOperations: () => ['move'],
        onDragStart: ({ keys }) => {
            dragging.current = keys;
        },
        onDragEnd: () => {
            dragging.current = new Set();
        },
        getDropOperation: (target) => latest.current.resolveMove(target, dragging.current) ? 'move' : 'cancel',
        onMove: ({ target, keys }) => {
            const move = latest.current.resolveMove(target, keys);
            if (move)
                latest.current.onMove(move);
        },
        renderDropIndicator,
        ...(hasPreview
            ? {
                // React Aria starts the drag, which records its keys, before it draws the preview.
                renderDragPreview: () => latest.current.renderDragPreview?.(dragging.current) ?? createElement('span'),
            }
            : {}),
    }), [renderDropIndicator, hasPreview]);
}
//# sourceMappingURL=use-reorder-drag-and-drop.js.map