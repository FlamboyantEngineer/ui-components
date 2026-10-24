import {
  createContext,
  useCallback,
  useRef,
  useContext,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  Popover as AriaPopover,
  PopoverContext,
  RootMenuTriggerStateContext,
  useInteractOutside,
  useSlottedContext,
} from '../../primitives/index.js';
import type { OverlayPositionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
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
const MenuNonModalContext = createContext(false);
const MenuSurfaceContext = createContext<Set<HTMLElement> | null>(null);

/** Portalled submenus belong to the same outside-press boundary as their parent menu. */
function useMenuSurface({ ref, isNonModal, shouldCloseOnInteractOutside }: MenuOverlayProps) {
  const state = useContext(RootMenuTriggerStateContext);
  const inherited = useContext(MenuSurfaceContext);
  const own = useRef(new Set<HTMLElement>());
  const group = inherited ?? own.current;
  const [surface, forwardRef] = useForwardedRef(ref);
  const setRef = useCallback(
    (element: HTMLElement | null) => {
      if (surface.current) group.delete(surface.current);
      if (element) group.add(element);
      forwardRef(element);
    },
    [surface, group, forwardRef],
  );
  useInteractOutside({
    ref: surface,
    isDisabled: !isNonModal || inherited !== null || !state?.isOpen,
    onInteractOutside: (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if ([...group].some((element) => element.contains(target))) return;
      if (shouldCloseOnInteractOutside?.(target) !== false) state?.close();
    },
  });
  return { group, ref: setRef };
}

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
  ref,
  isNonModal,
  ...rest
}: MenuOverlayProps) {
  const inheritedNonModal = useContext(MenuNonModalContext);
  const nonModal = isNonModal ?? inheritedNonModal;
  const surface = useMenuSurface({ ...rest, ref, isNonModal: nonModal });
  const inherited = useContext(MenuLayerContext);
  const resolved = layer ?? inherited ?? 'dropdown';
  const zIndex = useLayerZIndex(resolved);
  const isSubmenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
  return (
    <AriaPopover
      {...rest}
      ref={surface.ref}
      isNonModal={nonModal}
      {...hooks.root({ className, props: rest, data: { layer: resolved } })}
      offset={offset ?? (isSubmenu ? -2 : 4)}
      crossOffset={crossOffset ?? (isSubmenu ? -4 : 0)}
      containerPadding={containerPadding}
      style={{ zIndex }}
    >
      <MenuSurfaceContext.Provider value={surface.group}>
        <MenuNonModalContext.Provider value={nonModal}>
          <MenuLayerContext.Provider value={resolved}>{children}</MenuLayerContext.Provider>
        </MenuNonModalContext.Provider>
      </MenuSurfaceContext.Provider>
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
