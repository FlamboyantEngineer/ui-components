import { type JSX, type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { type TabMenuItems } from './tab-menu.js';
import { type TabNameValidate } from './tab-rename.js';
import { type TabMove } from './tab-reorder.js';
export type { TabMenuItems } from './tab-menu.js';
export type { TabNameValidate } from './tab-rename.js';
export type { TabMove } from './tab-reorder.js';
/** `scroll` lets an overflowing list scroll; `menu` collapses the tabs that do not fit into a menu. */
export type TabListOverflow = 'scroll' | 'menu';
/** The state a `TabList` passes to `render` with its element's props. */
export interface TabListRenderState {
    orientation: Orientation;
}
export interface TabListProps extends BaseProps, AriaLabellingProps {
    /** The list element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** The `Tab`s. */
    children?: ReactNode;
    /** Replaces the list's `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', TabListRenderState> | undefined;
    /**
     * What a horizontal list does with tabs that do not fit: `scroll` (the default) or `menu`, which
     * keeps the selected tab and as many others as fit and lists the rest in a "more" menu.
     */
    overflow?: TabListOverflow | undefined;
    /** Draws previous and next buttons beside a horizontal list that scrolls, at an edge hiding tabs. */
    scrollButtons?: boolean | undefined;
    /** Makes the tabs removable: a close mark on each and Delete or Backspace on the focused one. */
    onRemove?: ((keys: Set<Key>) => void) | undefined;
    /** Draws an add button after the tabs. */
    onAdd?: (() => void) | undefined;
    /** Renames a tab from the name field that a double click, F2 or its menu opens in it. */
    onRename?: ((key: Key, name: string) => void) | undefined;
    /** Checks a new tab name as it is typed; a returned message refuses it. */
    validateName?: TabNameValidate | undefined;
    /** Makes the tabs reorderable by dragging and with Alt+Arrow keys; reports each move to apply. */
    onReorder?: ((move: TabMove) => void) | undefined;
    /** Offers Duplicate in each tab's menu. */
    onDuplicate?: ((key: Key) => void) | undefined;
    /**
     * Gives each tab a menu of its actions, opened like a context menu: the entries of the tab `key`,
     * given the standard entries for the actions the list takes (rename, duplicate, moves, delete).
     */
    getMenuItems?: TabMenuItems | undefined;
}
/**
 * The row (or column) of tabs. An overflowing list scrolls the selected tab toward its middle, or
 * collapses the tabs that do not fit into a "more" menu; it can draw scroll buttons, removable tabs
 * and an add button, rename and reorder its tabs, and give each tab a menu of its actions.
 */
export declare function TabList({ overflow, scrollButtons, onRemove, onAdd, onRename, validateName, onReorder, onDuplicate, getMenuItems, className, ref, ...rest }: TabListProps): JSX.Element;
//# sourceMappingURL=tab-list.d.ts.map