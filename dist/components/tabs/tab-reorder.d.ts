import { type HTMLAttributes, type KeyboardEvent, type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { type TabsShared, type TabListModel } from './tab-actions.js';
/** A reorder request: move the tab `key` to the slot before or after the tab `targetKey`. */
export interface TabMove {
    key: Key;
    targetKey: Key;
    position: 'before' | 'after';
}
/** Which side of a tab a dragged tab would land on. */
export type TabDropPosition = TabMove['position'];
/** A list's reordering, shared with its tabs. */
export interface TabReorder {
    orientation: Orientation;
    isRtl: boolean;
    /** The tab being dragged, while a drag that started in this list is under way. */
    draggingKey: RefObject<Key | null>;
    /** The keys of the list's tabs, in order. */
    listKeys: () => Key[];
    /** The move a drop of the dragged tab beside `targetKey` makes, or `null` when it changes nothing. */
    resolveDrop: (targetKey: Key, position: TabDropPosition) => TabMove | null;
    onReorder: (move: TabMove) => void;
}
interface TabReorderOptions {
    shared: TabsShared;
    isRtl: boolean;
    onReorder: ((move: TabMove) => void) | undefined;
}
interface TabReorderKeyOptions {
    state: TabListModel | null;
    listRef: RefObject<HTMLElement | null>;
    reorder: TabReorder | null;
}
interface TabDragOptions {
    tabKey: Key;
    /** The text a dragged tab carries to other drop targets. */
    textValue: string;
    /** Refuses dragging the tab; it still takes drops. */
    isDisabled: boolean;
    ref: RefObject<HTMLElement | null>;
    reorder: TabReorder;
}
/** A tab's drag and drop: the props for its element, and where a dragged tab would land beside it. */
interface TabDragState {
    dragProps: HTMLAttributes<HTMLElement>;
    isDragging: boolean;
    dropPosition: TabDropPosition | null;
}
/** The move that places `key` beside `targetKey`, or `null` when the tab would stay where it is. */
export declare function resolveTabMove(keys: readonly Key[], move: TabMove): TabMove | null;
/** The move one tab toward the start (-1) or the end (1), or `null` at that end. */
export declare function stepTabMove(keys: readonly Key[], key: Key, step: -1 | 1): TabMove | null;
/** A list's reordering while the owner takes moves. A disabled tab never moves. */
export declare function createTabReorder({ shared, isRtl, onReorder }: TabReorderOptions): TabReorder | null;
/**
 * The drawn list's reordering keys: Alt+Arrow keys along the list's orientation (mirrored right to
 * left) move the focused tab one place, keeping focus on it. At either end the keys do nothing.
 */
export declare function useTabReorderKeys({ state, listRef, reorder }: TabReorderKeyOptions): ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
/**
 * One tab's drag and drop: the tab drags, carrying its text, and takes drops of another tab of the
 * same list on the half of it the pointer is over, reporting where the dragged tab would land.
 */
export declare function useTabDrag({ tabKey, textValue, isDisabled, ref, reorder, }: TabDragOptions): TabDragState;
export {};
//# sourceMappingURL=tab-reorder.d.ts.map