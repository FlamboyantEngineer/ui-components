import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useLayoutEffect, useRef, useState, useContext, } from 'react';
import { Popover as AriaPopover, OverlayTriggerStateContext, PopoverContext, RootMenuTriggerStateContext, useInteractOutside, useSlottedContext, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useLayerZIndex } from '../portal/portal.js';
const hooks = createHooks('menu-popover');
const MenuLayerContext = createContext(undefined);
const MenuNonModalContext = createContext(true);
const MenuSurfaceContext = createContext(null);
/** Portalled submenus belong to the same outside-press boundary as their parent menu. */
function useMenuSurface({ ref, isNonModal, shouldCloseOnInteractOutside }) {
    const state = useContext(RootMenuTriggerStateContext);
    const inherited = useContext(MenuSurfaceContext);
    const own = useRef(new Set());
    const group = inherited ?? own.current;
    const [surface, forwardRef] = useForwardedRef(ref);
    const setRef = useCallback((element) => {
        if (surface.current)
            group.delete(surface.current);
        if (element)
            group.add(element);
        forwardRef(element);
    }, [surface, group, forwardRef]);
    useInteractOutside({
        ref: surface,
        isDisabled: !isNonModal || inherited !== null || !state?.isOpen,
        onInteractOutside: (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            if ([...group].some((element) => element.contains(target)))
                return;
            if (shouldCloseOnInteractOutside?.(target) !== false)
                state?.close();
        },
    });
    return { group, ref: setRef };
}
/**
 * Keeps a nonmodal root menu open while the page scrolls, following its trigger. React Aria closes
 * it on any scroll of the trigger's scroll containers, the page included; only a scroll of an
 * element holding the trigger still closes it, since the popover cannot follow that.
 */
function usePageScrollFollow(isActive, props) {
    const state = useContext(OverlayTriggerStateContext);
    const isOpen = props.isOpen ?? state?.isOpen ?? false;
    const setOpen = props.onOpenChange ?? state?.setOpen;
    const isPageScrolling = useRef(false);
    // Pausing position updates for one render makes React Aria place the popover again.
    const [isPaused, setPaused] = useState(false);
    useLayoutEffect(() => {
        if (isPaused)
            setPaused(false);
    }, [isPaused]);
    useLayoutEffect(() => {
        if (!isActive || !isOpen)
            return;
        // A layout effect, so this capture listener sees each scroll before React Aria's.
        let timer;
        let frame;
        const onScroll = (event) => {
            isPageScrolling.current = !(event.target instanceof Element);
            if (!isPageScrolling.current)
                return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                isPageScrolling.current = false;
            });
            // A sticky or fixed trigger stays put as the page scrolls; the popover follows it.
            frame ??= requestAnimationFrame(() => {
                frame = undefined;
                setPaused(true);
            });
        };
        const options = { capture: true, passive: true };
        window.addEventListener('scroll', onScroll, options);
        return () => {
            clearTimeout(timer);
            if (frame !== undefined)
                cancelAnimationFrame(frame);
            isPageScrolling.current = false;
            window.removeEventListener('scroll', onScroll, options);
        };
    }, [isActive, isOpen]);
    if (!isActive)
        return {};
    return {
        isOpen,
        onOpenChange: (open) => {
            if (open || !isPageScrolling.current)
                setOpen?.(open);
        },
        shouldUpdatePosition: !isPaused,
    };
}
/**
 * The floating surface of a menu with the options the family's composites need (React Aria
 * `Popover`), stacked on an overlay layer. A submenu popover sits beside its trigger item,
 * overlapping the parent menu, on its layer.
 */
export function MenuOverlay({ layer, offset, crossOffset, containerPadding = 8, className, children, ref, isNonModal, ...rest }) {
    const inheritedNonModal = useContext(MenuNonModalContext);
    const nonModal = isNonModal ?? inheritedNonModal;
    const surface = useMenuSurface({ ...rest, ref, isNonModal: nonModal });
    const inherited = useContext(MenuLayerContext);
    const resolved = layer ?? inherited ?? 'dropdown';
    const zIndex = useLayerZIndex(resolved);
    const isSubmenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
    const open = usePageScrollFollow(nonModal && !isSubmenu, rest);
    return (_jsx(AriaPopover, { ...rest, ...open, ref: surface.ref, isNonModal: nonModal, ...hooks.root({ className, props: rest, data: { layer: resolved } }), offset: offset ?? (isSubmenu ? -2 : 4), crossOffset: crossOffset ?? (isSubmenu ? -4 : 0), containerPadding: containerPadding, style: { zIndex }, children: _jsx(MenuSurfaceContext.Provider, { value: surface.group, children: _jsx(MenuNonModalContext.Provider, { value: nonModal, children: _jsx(MenuLayerContext.Provider, { value: resolved, children: children }) }) }) }));
}
/**
 * The floating surface of a menu or submenu, placed against the `MenuTrigger` or `SubmenuTrigger`
 * that holds it and stacked on an overlay layer.
 */
export function MenuPopover(props) {
    return _jsx(MenuOverlay, { ...props });
}
//# sourceMappingURL=menu-popover.js.map