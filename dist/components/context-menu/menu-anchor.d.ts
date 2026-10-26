import { type RefObject } from 'react';
import type { Placement } from '../../core/props.js';
import type { MenuOverlayProps } from '../menu/menu.js';
import { type MenuAnchor } from './menu-controller.js';
export interface MenuAnchorOptions {
    anchor: MenuAnchor | null;
    /** Placement against an element anchor. */
    placement: Placement;
    /** The element a point menu belongs to (React Aria closes the menu when its scroll parent scrolls). */
    owner: RefObject<Element | null>;
}
export type MenuAnchorProps = Pick<MenuOverlayProps, 'triggerRef' | 'getTargetRect' | 'placement' | 'offset'>;
/**
 * The popover props that place a menu at its anchor: against an element with `placement`, or below
 * and after a viewport point. React Aria repositions an open popover when its placement changes, so
 * a moved point alternates between the logical and physical spelling of the same placement, which
 * moves the menu without reopening it.
 */
export declare function useMenuAnchor({ anchor, placement, owner }: MenuAnchorOptions): MenuAnchorProps;
//# sourceMappingURL=menu-anchor.d.ts.map