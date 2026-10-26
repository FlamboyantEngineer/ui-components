import { type ReactNode, type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { type ScrollStripState } from '../../utils/use-scroll-strip-overflow.js';
import { type TabListModel } from './tab-actions.js';
/** Which tabs a menu list keeps, and the elements that measure them. */
export type TabOverflow = ReturnType<typeof useTabOverflow>;
export interface TabBarProps {
    state: TabListModel;
    orientation: Orientation;
    isMenu: boolean;
    hasButtons: boolean;
    menu: TabOverflow;
    strip: ScrollStripState & {
        stripRef: RefObject<HTMLDivElement | null>;
    };
    onAdd: (() => void) | undefined;
    children: ReactNode;
}
/** Which tabs a menu list keeps: the selected and focused tabs first, then from the start. */
export declare function useTabOverflow(state: TabListModel | null, isMenu: boolean): {
    visibleKeys: Set<Key> | null;
    containerRef: import("react").RefCallback<HTMLElement>;
    itemContainerRef: import("react").RefCallback<HTMLElement>;
    indicatorRef: import("react").RefCallback<HTMLElement>;
    visibleItems: readonly Key[];
    hiddenItems: readonly Key[];
};
/** The parts around a list: scroll buttons, the "more" menu of hidden tabs and the add button. */
export declare function TabBar({ state, orientation, isMenu, hasButtons, menu, strip, onAdd, children, }: TabBarProps): import("react").JSX.Element;
//# sourceMappingURL=tab-bar.d.ts.map