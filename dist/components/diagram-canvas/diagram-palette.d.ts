import { type HTMLAttributes, type RefObject } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import type { DiagramPoint } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';
export interface DiagramPaletteItemProps extends BaseProps {
    /** What the item adds, handed to the canvas's `onNodeAdd`. */
    type: string;
    /** The item's text and accessible name. */
    label: string;
    /** A decorative icon before the label. */
    icon?: IconSource | undefined;
}
export interface DiagramPalette {
    /** Asks for a node of `type` at a point of the viewport element, by default its centre. */
    add: (type: string, at?: DiagramPoint) => void;
    isEnabled: boolean;
}
export declare const DiagramPaletteContext: import("react").Context<DiagramPalette | null>;
/** The palette of a canvas: adding asks the caller for a node at a grid point of the view. */
export declare function useCanvasPalette({ controller, gridSize, onNodeAdd, }: {
    controller: DiagramController;
    gridSize: number;
    onNodeAdd: ((request: {
        type: string;
        x: number;
        y: number;
    }) => void) | undefined;
}): DiagramPalette;
/** Makes the viewport element accept palette items dropped on it. */
export declare function usePaletteDrop({ ref, palette, }: {
    ref: RefObject<HTMLElement | null>;
    palette: DiagramPalette;
}): {
    dropProps: HTMLAttributes<HTMLElement>;
    isDropTarget: boolean;
};
/**
 * An entry of a diagram canvas's palette. Pressing it adds a node of its type in the middle of the
 * view; dragging it onto the canvas adds one where it is dropped. Outside an editing canvas that
 * takes new nodes it is disabled.
 */
export declare function DiagramPaletteItem({ type, label, icon, className, ...rest }: DiagramPaletteItemProps): import("react").JSX.Element;
//# sourceMappingURL=diagram-palette.d.ts.map