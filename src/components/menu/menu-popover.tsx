import { createContext, useContext, type ReactNode, type Ref } from 'react';
import {
  Popover as AriaPopover,
  PopoverContext,
  useSlottedContext,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useLayerZIndex, type PortalProps } from '../portal/portal.js';

export interface MenuPopoverProps
  extends Omit<AriaPopoverProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  /**
   * The overlay layer, which sets the z-index and `data-layer`. Defaults to the enclosing menu
   * popover's layer, or `dropdown`.
   */
  layer?: PortalProps['layer'];
  children?: ReactNode;
  ref?: Ref<HTMLElement> | undefined;
}

const hooks = createHooks('menu-popover');

const MenuLayerContext = createContext<PortalProps['layer']>(undefined);

/**
 * The floating surface of a menu or submenu (React Aria `Popover`), stacked on an overlay layer.
 * A submenu popover sits beside its trigger item, overlapping the parent menu, on its layer.
 */
export function MenuPopover({
  layer,
  offset,
  crossOffset,
  containerPadding = 8,
  className,
  children,
  ...rest
}: MenuPopoverProps) {
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
