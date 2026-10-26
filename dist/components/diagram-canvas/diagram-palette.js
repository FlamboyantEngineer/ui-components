import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { useDrag, useDrop } from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { snapToGrid, toDiagramPoint } from './diagram-model.js';
export const DiagramPaletteContext = createContext(null);
// The drag type a palette item carries, so the canvas only accepts palette items.
const paletteDragType = 'application/x-ui-diagram-node';
/** The palette of a canvas: adding asks the caller for a node at a grid point of the view. */
export function useCanvasPalette({ controller, gridSize, onNodeAdd, }) {
    const { viewport, size } = controller.view;
    const { isEditing } = controller;
    return useMemo(() => ({
        isEnabled: isEditing && onNodeAdd !== undefined,
        add: (type, at) => {
            const centre = { x: (size?.width ?? 0) / 2, y: (size?.height ?? 0) / 2 };
            const point = toDiagramPoint(viewport, at ?? centre);
            onNodeAdd?.({ type, x: snapToGrid(point.x, gridSize), y: snapToGrid(point.y, gridSize) });
        },
    }), [isEditing, onNodeAdd, viewport, size, gridSize]);
}
/** Makes the viewport element accept palette items dropped on it. */
export function usePaletteDrop({ ref, palette, }) {
    const { dropProps, isDropTarget } = useDrop({
        ref,
        isDisabled: !palette.isEnabled,
        getDropOperation: (types) => (types.has(paletteDragType) ? 'copy' : 'cancel'),
        onDrop: async (event) => {
            for (const item of event.items) {
                if (item.kind === 'text' && item.types.has(paletteDragType)) {
                    palette.add(await item.getText(paletteDragType), { x: event.x, y: event.y });
                    return;
                }
            }
        },
    });
    return { dropProps, isDropTarget };
}
/**
 * An entry of a diagram canvas's palette. Pressing it adds a node of its type in the middle of the
 * view; dragging it onto the canvas adds one where it is dropped. Outside an editing canvas that
 * takes new nodes it is disabled.
 */
export function DiagramPaletteItem({ type, label, icon, className, ...rest }) {
    const palette = useContext(DiagramPaletteContext);
    const isDisabled = !palette?.isEnabled;
    const { dragProps } = useDrag({
        getItems: () => [{ [paletteDragType]: type, 'text/plain': label }],
        getAllowedDropOperations: () => ['copy'],
        hasDragButton: true,
        isDisabled,
    });
    return (_jsxs("button", { ...mergeProps(rest, dragProps), ...hooks.slot('palette-item', { disabled: isDisabled }, className), type: "button", disabled: isDisabled, onClick: () => palette?.add(type), children: [icon ? _jsx(Icon, { ...toIconProps(icon) }) : null, label] }));
}
//# sourceMappingURL=diagram-palette.js.map