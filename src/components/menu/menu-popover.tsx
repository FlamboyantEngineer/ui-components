import {
  createContext,
  useContext,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  Popover as AriaPopover,
  PopoverContext,
  useSlottedContext,
} from '../../primitives/index.js';
import type { OverlayPositionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useLayerZIndex, type PortalProps } from '../portal/portal.js';

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
  /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
  isNonModal?: boolean | undefined;
  /** Asked with the element pressed before an outside press closes it; false keeps it open. */
  shouldCloseOnInteractOutside?: ((element: Element) => boolean) | undefined;
  onContextMenu?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  'aria-label'?: string | undefined;
}

const hooks = createHooks('menu-popover');

const MenuLayerContext = createContext<PortalProps['layer']>(undefined);

/**
 * The floating surface of a menu with the options the family's composites need (React Aria
 * `Popover`), stacked on an overlay layer. A submenu popover sits beside its trigger item,
 * overlapping the parent menu, on its layer.
 */
export function MenuOverlay({
  layer,
  offset,
  crossOffset,
  containerPadding = 8,
  className,
  children,
  ...rest
}: MenuOverlayProps) {
  const inherited = useContext(MenuLayerContext);
  const resolved = layer ?? inherited ?? 'dropdown';
  const zIndex = useLayerZIndex(resolved);
  const isSubmenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
  return (
    <AriaPopover
      {...rest}
      {...hooks.root({ className, props: rest, data: { layer: resolved } })}
      offset={offset ?? (isSubmenu ? -2 : 4)}
      crossOffset={crossOffset ?? (isSubmenu ? -4 : 0)}
      containerPadding={containerPadding}
      style={{ zIndex }}
    >
      <MenuLayerContext.Provider value={resolved}>{children}</MenuLayerContext.Provider>
    </AriaPopover>
  );
}

/**
 * The floating surface of a menu or submenu, placed against the `MenuTrigger` or `SubmenuTrigger`
 * that holds it and stacked on an overlay layer.
 */
export function MenuPopover(props: MenuPopoverProps) {
  return <MenuOverlay {...props} />;
}
