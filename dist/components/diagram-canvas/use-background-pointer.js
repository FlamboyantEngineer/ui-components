import { useState } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { isRectOverlap, resolveNodeRect, toDiagramPoint, } from './diagram-model.js';
const dragThreshold = 3;
function spanRect(a, b) {
    return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.abs(a.x - b.x),
        height: Math.abs(a.y - b.y),
    };
}
/**
 * Pointer drags on the canvas background: a drag pans the view, a Shift drag draws a marquee that
 * selects the nodes it touches, and a press that does not move clears the selection and gives up a
 * connection in progress.
 */
export function useBackgroundPointer(controller, selectionMode) {
    const [marquee, setMarquee] = useState(null);
    const { view, selection, connect } = controller;
    const selectWithin = (rect) => {
        const from = toDiagramPoint(view.viewport, rect);
        const to = toDiagramPoint(view.viewport, { x: rect.x + rect.width, y: rect.y + rect.height });
        const area = spanRect(from, to);
        selection.replace(controller.nodes
            .filter((node) => isRectOverlap(resolveNodeRect(node), area))
            .map((node) => node.id));
    };
    const pointerProps = usePointerDrag({
        onStart: (event) => {
            const box = event.currentTarget.getBoundingClientRect();
            return {
                x: event.clientX,
                y: event.clientY,
                left: box.left,
                top: box.top,
                origin: view.viewport,
                mode: event.shiftKey && selectionMode === 'multiple' ? 'marquee' : 'pan',
                isMoved: false,
            };
        },
        onMove: (event, active) => {
            const delta = { x: event.clientX - active.x, y: event.clientY - active.y };
            if (!active.isMoved && Math.hypot(delta.x, delta.y) < dragThreshold)
                return;
            active.isMoved = true;
            if (active.mode === 'pan') {
                view.setViewport({
                    ...active.origin,
                    x: active.origin.x + delta.x,
                    y: active.origin.y + delta.y,
                });
                return;
            }
            const from = { x: active.x - active.left, y: active.y - active.top };
            setMarquee(spanRect(from, { x: event.clientX - active.left, y: event.clientY - active.top }));
        },
        onEnd: (_event, active, isCancelled) => {
            if (!isCancelled) {
                if (!active.isMoved) {
                    connect.cancel();
                    selection.replace([]);
                }
                else if (marquee)
                    selectWithin(marquee);
            }
            setMarquee(null);
        },
    });
    return {
        marquee,
        pointerProps,
    };
}
//# sourceMappingURL=use-background-pointer.js.map