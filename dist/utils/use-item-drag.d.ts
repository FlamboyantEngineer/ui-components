import { type HTMLAttributes, type RefObject } from 'react';
import type { PressEvent } from '../core/events.js';
import type { Key } from '../core/props.js';
interface ItemMove {
    position: 'before' | 'after' | 'on';
}
export interface ItemDragOptions<K extends Key, Move extends ItemMove> {
    ref: RefObject<HTMLElement | null>;
    key: K;
    textValue: string;
    dragType: string;
    dragging: RefObject<K | null> | null;
    isDisabled: boolean;
    /** A disabled tab may still be a landing target for another tab. */
    isDropDisabled?: boolean | undefined;
    resolveMove: (point: {
        x: number;
        y: number;
    }) => Move | null;
    onMove: (move: Move) => void;
}
export interface ItemDragState<Move extends ItemMove> {
    dragProps: HTMLAttributes<HTMLElement>;
    startDrag: (event: PressEvent) => void;
    /** The id of the building block's description of the drag button, for its `aria-describedby`. */
    describedBy: string | undefined;
    isDragging: boolean;
    dropPosition: Move['position'] | null;
}
/** One item's native move drag and drop, including shared validation and the landing indicator. */
export declare function useItemDrag<K extends Key, Move extends ItemMove>(options: ItemDragOptions<K, Move>): ItemDragState<Move>;
export {};
//# sourceMappingURL=use-item-drag.d.ts.map