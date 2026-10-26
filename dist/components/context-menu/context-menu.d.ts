import { type ReactNode, type RefObject } from 'react';
import type { BaseProps, Placement } from '../../core/props.js';
import { type MenuPopoverProps } from '../menu/menu.js';
import { type MenuController } from './menu-controller.js';
export { useContextMenuTarget } from './context-menu-target.js';
export { createMenuController, useMenuController } from './menu-controller.js';
export type { MenuController } from './menu-controller.js';
export interface ContextMenuProps extends BaseProps {
    /** Holds the open state and anchor; open, move and close the menu through it. */
    controller: MenuController;
    /** The `Menu` to show. Defaults to a `Menu` of the controller's entries. */
    children?: ReactNode;
    /** The overlay layer. Defaults to `context-menu`. */
    layer?: MenuPopoverProps['layer'];
    /** Placement against an element anchor. Defaults to `bottom start`. */
    placement?: Placement | undefined;
    /**
     * The element a point menu belongs to: scrolling one of its scroll parents closes the menu.
     * Defaults to an empty element where the `ContextMenu` renders.
     */
    triggerRef?: RefObject<Element | null> | undefined;
    /** Names the popover and, unless its `Menu` has its own, the menu. Defaults to `contextMenu`. */
    'aria-label'?: string | undefined;
}
export interface ContextMenuTriggerProps extends Omit<ContextMenuProps, 'controller' | 'children' | 'layer' | 'triggerRef'> {
    /** The target element (it must take event handlers and a ref), then the `Menu` it opens. */
    children: ReactNode;
    /** Leaves the target's own context menu alone. */
    isDisabled?: boolean | undefined;
}
/**
 * A menu opened, moved and closed through a `MenuController`, at a viewport point or against an
 * element. Focus enters the first item on open and returns where it was on close.
 */
export declare function ContextMenu({ controller, children, layer, placement, triggerRef, 'aria-label': ariaLabel, ...rest }: ContextMenuProps): import("react").JSX.Element;
/**
 * Opens a `ContextMenu` from any element: at the pointer on a secondary click or a long touch, and
 * below the element on the Context Menu key or Shift+F10.
 */
export declare function ContextMenuTrigger({ children, isDisabled, ...rest }: ContextMenuTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=context-menu.d.ts.map