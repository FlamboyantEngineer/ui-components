import { type MouseEvent, type ReactNode, type Ref, type RefObject } from 'react';
import type { OverlayPositionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type PortalProps } from '../portal/portal.js';
export interface MenuPopoverProps extends BaseProps, OverlayPositionProps {
    /**
     * The overlay layer, which sets the z-index and `data-layer`. Defaults to the enclosing menu
     * popover's layer, or `dropdown`.
     */
    layer?: PortalProps['layer'];
    children?: ReactNode;
    ref?: Ref<HTMLElement> | undefined;
}
/**
 * What the family's own composites (context menu, menubar) also set on a menu popover: an open
 * state and anchor held outside a `MenuTrigger`, and a popover that leaves the page usable.
 */
export interface MenuOverlayProps extends MenuPopoverProps {
    isOpen?: boolean | undefined;
    onOpenChange?: ((isOpen: boolean) => void) | undefined;
    /** The element it is placed against, or that owns a point anchor. */
    triggerRef?: RefObject<Element | null> | undefined;
    /** Places it against this viewport rectangle instead of the trigger's. */
    getTargetRect?: (() => DOMRect) | undefined;
    /**
     * Leaves the page outside reachable, visible to assistive technology and scrollable. Defaults to
     * true; false blocks the page while the menu is open.
     */
    isNonModal?: boolean | undefined;
    /** Asked with the element pressed before an outside press closes it; false keeps it open. */
    shouldCloseOnInteractOutside?: ((element: Element) => boolean) | undefined;
    onContextMenu?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
    'aria-label'?: string | undefined;
}
/**
 * The floating surface of a menu with the options the family's composites need (React Aria
 * `Popover`), stacked on an overlay layer. A submenu popover sits beside its trigger item,
 * overlapping the parent menu, on its layer.
 */
export declare function MenuOverlay({ layer, offset, crossOffset, containerPadding, className, children, ref, isNonModal, ...rest }: MenuOverlayProps): import("react").JSX.Element;
/**
 * The floating surface of a menu or submenu, placed against the `MenuTrigger` or `SubmenuTrigger`
 * that holds it and stacked on an overlay layer.
 */
export declare function MenuPopover(props: MenuPopoverProps): import("react").JSX.Element;
//# sourceMappingURL=menu-popover.d.ts.map