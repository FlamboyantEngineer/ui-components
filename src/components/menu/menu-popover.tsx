'use client';

import {
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Popover as AriaPopover,
  OverlayTriggerStateContext,
  PopoverContext,
  RootMenuTriggerStateContext,
  useInteractOutside,
  useSlottedContext,
} from '../../primitives/index.js';
import type { OverlayPositionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useFollowAnchor } from '../../utils/use-follow-anchor.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { PopoverPresence } from '../popover/popover.js';
import { useLayerZIndex, type PortalProps } from '../portal/portal.js';
import {
  DEFAULT_DROPDOWN_OFFSET,
  DEFAULT_OVERLAY_GUTTER,
  SUBMENU_CROSS_OFFSET,
  SUBMENU_OFFSET,
} from '../../utils/overlay-defaults.js';
import { isElement } from '../../utils/is-element.js';
import { getOwnerWindow } from '../../utils/owner-window.js';

export interface MenuPopoverProps extends BaseProps, OverlayPositionProps, RefProps<HTMLElement> {
  /**
   * The overlay layer, which sets the z-index and `data-layer`. Defaults to the enclosing menu
   * popover's layer, or `dropdown`.
   */
  layer?: PortalProps['layer'];
  children?: ReactNode;
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

const hooks = createHooks('menu-popover');

const noTrigger: RefObject<Element | null> = { current: null };

const MenuLayerContext = createContext<PortalProps['layer']>(undefined);
const MenuNonModalContext = createContext(true);
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
      if (!isElement(target)) return;
      if ([...group].some((element) => element.contains(target))) return;
      if (shouldCloseOnInteractOutside?.(target) !== false) state?.close();
    },
  });
  return { group, ref: setRef };
}

/**
 * Keeps a root menu on its trigger, or its point, as the page moves under it or the point changes.
 * A nonmodal one also stays open while the page scrolls: React Aria closes it on any scroll of the
 * trigger's scroll containers, the page included; only a scroll of an element holding the trigger
 * still closes it, since the popover cannot follow that.
 */
function useMenuFollow(isSubmenu: boolean, isNonModal: boolean, props: MenuOverlayProps) {
  const state = useContext(OverlayTriggerStateContext);
  const popover = useSlottedContext(PopoverContext);
  const isOpen = props.isOpen ?? state?.isOpen ?? false;
  const setOpen = props.onOpenChange ?? state?.setOpen;
  const triggerRef = props.triggerRef ?? popover?.triggerRef ?? noTrigger;
  const isActive = isNonModal && !isSubmenu;
  const isPageScrolling = useRef(false);
  const shouldUpdatePosition = useFollowAnchor({
    anchorRef: triggerRef,
    isOpen: isOpen && !isSubmenu,
    target: props.getTargetRect,
  });
  useLayoutEffect(() => {
    if (!isActive || !isOpen) return;
    // A layout effect, so this capture listener sees each scroll before React Aria's.
    const view = getOwnerWindow(triggerRef.current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = (event: Event) => {
      isPageScrolling.current = !(event.target instanceof view.Element);
      if (!isPageScrolling.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        isPageScrolling.current = false;
      });
    };
    const options = { capture: true, passive: true };
    view.addEventListener('scroll', onScroll, options);
    return () => {
      clearTimeout(timer);
      isPageScrolling.current = false;
      view.removeEventListener('scroll', onScroll, options);
    };
  }, [isActive, isOpen, triggerRef]);
  if (isSubmenu) return {};
  if (!isActive) return { shouldUpdatePosition };
  return {
    isOpen,
    onOpenChange: (open: boolean) => {
      if (open || !isPageScrolling.current) setOpen?.(open);
    },
    shouldUpdatePosition,
  };
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
  containerPadding = DEFAULT_OVERLAY_GUTTER,
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
  const open = useMenuFollow(isSubmenu, nonModal, rest);
  return (
    <>
      <PopoverPresence />
      <AriaPopover
        {...rest}
        {...open}
        ref={surface.ref}
        isNonModal={nonModal}
        {...hooks.root({ className, props: rest, data: { layer: resolved } })}
        offset={offset ?? (isSubmenu ? SUBMENU_OFFSET : DEFAULT_DROPDOWN_OFFSET)}
        crossOffset={crossOffset ?? (isSubmenu ? SUBMENU_CROSS_OFFSET : 0)}
        containerPadding={containerPadding}
        style={{ zIndex }}
      >
        <MenuSurfaceContext value={surface.group}>
          <MenuNonModalContext value={nonModal}>
            <MenuLayerContext value={resolved}>{children}</MenuLayerContext>
          </MenuNonModalContext>
        </MenuSurfaceContext>
      </AriaPopover>
    </>
  );
}

/**
 * The floating surface of a menu or submenu, placed against the `MenuTrigger` or `SubmenuTrigger`
 * that holds it and stacked on an overlay layer.
 */
export function MenuPopover(props: MenuPopoverProps) {
  return <MenuOverlay {...props} />;
}
