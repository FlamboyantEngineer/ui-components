import { type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
interface ListScrollOptions {
    orientation: Orientation;
    selectedKey: Key | null;
}
/** Whether the list's tabs do not fit, measured after every commit and when the list resizes. */
export declare function useListOverflow(listRef: RefObject<HTMLElement | null>, orientation: Orientation): boolean;
/** Scrolls the selected tab toward the middle of an overflowing list, once per selection. */
export declare function useCenterSelectedTab(listRef: RefObject<HTMLElement | null>, { orientation, selectedKey }: ListScrollOptions): void;
export {};
//# sourceMappingURL=tab-list-overflow.d.ts.map