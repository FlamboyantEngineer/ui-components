import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
/** `scroll` lets the strip scroll; `menu` moves the tools that do not fit into a "more" menu. */
export type ToolbarScrollerOverflow = 'scroll' | 'menu';
/** One tool described as data, for a scroller that collapses tools into a menu. */
export interface ToolbarScrollerItem {
    id: Key;
    /** The tool's name, and its text in the overflow menu. */
    label: string;
    /** The tool's icon in the overflow menu. */
    icon?: IconSource;
    /** Disables the tool's menu entry. */
    isDisabled?: boolean | undefined;
    /** Runs when the tool is chosen from the overflow menu. */
    onAction?: (() => void) | undefined;
    /** Tools with a higher priority stay in the strip longer. Defaults to 0. */
    priority?: number | undefined;
}
export interface ToolbarScrollerProps<T extends ToolbarScrollerItem = ToolbarScrollerItem> extends Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>, BaseProps {
    /** The tools. They stay direct children of the scrolling strip, at their natural size and order. */
    children?: ReactNode;
    /** Show a scroll button at each edge that hides tools. Defaults to `true`; edge fades always render. */
    scrollButtons?: boolean | undefined;
    /** The tools as data, drawn by `renderItem`, in place of `children`. */
    items?: readonly T[] | undefined;
    /** Draws one tool of `items`. */
    renderItem?: ((item: T) => ReactNode) | undefined;
    /**
     * What happens to tools that do not fit: `scroll` (the default) scrolls the strip; `menu` keeps
     * the tools that fit, highest `priority` first, and lists the others in a "more" menu. `menu`
     * needs `items`.
     */
    overflow?: ToolbarScrollerOverflow | undefined;
}
/**
 * One horizontal row of tools that scrolls instead of squeezing them. A toolbar gives the tools
 * arrow-key focus; scroll buttons and decorative fades appear only at an edge that hides tools.
 */
export declare function ToolbarScroller<T extends ToolbarScrollerItem = ToolbarScrollerItem>({ children, scrollButtons, items, renderItem, overflow, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }: ToolbarScrollerProps<T>): import("react").JSX.Element;
//# sourceMappingURL=toolbar-scroller.d.ts.map