import { useLayoutEffect, useMemo, useRef } from 'react';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { useDragType } from '../../utils/use-drag-type.js';
import { armElementDrag } from '../../utils/pointer-drag.js';
import { resolveStepDrop } from './step-list.js';
/** The editor's step drag and drop, each drop checked against the steps last rendered. */
export function useStepDrag(source) {
    const latest = useRef(source);
    useLayoutEffect(() => {
        latest.current = source;
    });
    const dragType = useDragType('step');
    const dragging = useRef(null);
    return useMemo(() => ({
        dragType,
        dragging,
        resolveDrop: (targetKey) => {
            const key = dragging.current;
            return key === null ? null : resolveStepDrop(latest.current.steps, { key, targetKey });
        },
        onMove: (move) => latest.current.onMove(move),
    }), [dragType]);
}
/**
 * Lets only the handle start the step's pointer drag: a primary press on it makes the step
 * draggable until the press or the drag ends, so text selection in its fields never drags it.
 */
function armStep(event) {
    const step = event.target.closest('[data-key]');
    if (event.pointerType === 'keyboard' || event.pointerType === 'virtual' || !step)
        return;
    armElementDrag(step);
}
/**
 * One step's drag and drop: it drags from its handle, by pointer or by keyboard and screen reader
 * from the handle's press, and takes drops of the editor's other steps.
 */
export function useStepRowDrag({ id, label, drag, }) {
    const ref = useRef(null);
    const { dragProps, startDrag, isDragging, dropPosition } = useItemDrag({
        ref,
        key: id,
        textValue: label,
        dragType: drag?.dragType ?? '',
        dragging: drag?.dragging ?? null,
        isDisabled: !drag,
        resolveMove: () => drag?.resolveDrop(id) ?? null,
        onMove: (move) => drag?.onMove(move),
    });
    // The step turns draggable only while its handle is pressed (`armStep`).
    const { draggable: _draggable, ...stepDragProps } = dragProps;
    return {
        ref,
        props: drag ? stepDragProps : {},
        handleProps: {
            onPressStart: armStep,
            onPress: startDrag,
        },
        isDragging,
        dropPosition,
    };
}
//# sourceMappingURL=use-step-drag.js.map