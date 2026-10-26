import { useState } from 'react';
import { useDrag, useDrop } from '../primitives/index.js';
import { mergeProps } from './merge-props.js';
/** One item's native move drag and drop, including shared validation and the landing indicator. */
export function useItemDrag(options) {
    const { ref, key, textValue, dragType, dragging, isDisabled, resolveMove, onMove } = options;
    const [dropPosition, setDropPosition] = useState(null);
    const { dragProps, dragButtonProps, isDragging } = useDrag({
        hasDragButton: true,
        isDisabled,
        getItems: () => [{ [dragType]: String(key), 'text/plain': textValue }],
        getAllowedDropOperations: () => ['move'],
        onDragStart: () => {
            if (dragging)
                dragging.current = key;
        },
        onDragEnd: () => {
            if (dragging)
                dragging.current = null;
        },
    });
    const showDrop = (point) => setDropPosition(resolveMove(point)?.position ?? null);
    const operationAt = (types, allowed, point) => types.has(dragType) && allowed.includes('move') && resolveMove(point) ? 'move' : 'cancel';
    const { dropProps } = useDrop({
        ref,
        isDisabled: options.isDropDisabled ?? isDisabled,
        // Keyboard targets are registered separately from pointer hit testing by the building block.
        getDropOperation: (types, allowed) => {
            const box = ref.current?.getBoundingClientRect();
            return operationAt(types, allowed, { x: (box?.width ?? 0) / 2, y: (box?.height ?? 0) / 2 });
        },
        getDropOperationForPoint: (...[types, allowed, x, y]) => operationAt(types, allowed, { x, y }),
        onDropEnter: showDrop,
        onDropMove: showDrop,
        onDropExit: () => setDropPosition(null),
        onDrop: (point) => {
            setDropPosition(null);
            const move = resolveMove(point);
            if (move)
                onMove(move);
        },
    });
    return {
        dragProps: mergeProps(dragProps, dropProps),
        startDrag: (event) => dragButtonProps.onPress?.(event),
        describedBy: dragButtonProps['aria-describedby'],
        isDragging,
        dropPosition,
    };
}
//# sourceMappingURL=use-item-drag.js.map