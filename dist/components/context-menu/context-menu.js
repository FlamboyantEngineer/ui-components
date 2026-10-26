import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { MenuContext, RootMenuTriggerStateContext, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Menu, MenuOverlay } from '../menu/menu.js';
import { useContextMenuTarget } from './context-menu-target.js';
import { useMenuAnchor } from './menu-anchor.js';
import { useMenuControllerState, useMenuController, } from './menu-controller.js';
import { useCloseOnSecondaryPress } from './menu-state.js';
export { useContextMenuTarget } from './context-menu-target.js';
export { createMenuController, useMenuController } from './menu-controller.js';
/**
 * The root menu state React Aria reads for submenus and to close a whole menu tree, for a menu
 * whose open state lives elsewhere. `close` empties the submenu stack, then calls `onClose`.
 */
function useRootMenuState(isOpen, onClose) {
    const [expandedKeysStack, setExpandedKeysStack] = useState([]);
    const close = useCallback(() => {
        setExpandedKeysStack([]);
        onClose();
    }, [onClose]);
    return useMemo(() => ({
        isOpen,
        focusStrategy: 'first',
        point: null,
        setPoint: () => { },
        setOpen: (open) => {
            if (!open)
                close();
        },
        open: () => { },
        toggle: close,
        close,
        expandedKeysStack,
        openSubmenu: (triggerKey, level) => setExpandedKeysStack((stack) => level > stack.length ? stack : [...stack.slice(0, level), triggerKey]),
        closeSubmenu: (triggerKey, level) => setExpandedKeysStack((stack) => stack[level] === triggerKey ? stack.slice(0, level) : stack),
    }), [isOpen, close, expandedKeysStack]);
}
/**
 * A menu opened, moved and closed through a `MenuController`, at a viewport point or against an
 * element. Focus enters the first item on open and returns where it was on close.
 */
export function ContextMenu({ controller, children, layer = 'context-menu', placement = 'bottom start', triggerRef, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const label = ariaLabel ?? strings.contextMenu;
    const { isOpen, anchor, items } = useMenuControllerState(controller);
    const fallbackRef = useRef(null);
    const state = useRootMenuState(isOpen, controller.close);
    const anchorProps = useMenuAnchor({ anchor, placement, owner: triggerRef ?? fallbackRef });
    useCloseOnSecondaryPress(isOpen, state.close);
    const menuDefaults = useMemo(() => ({ onClose: state.close, autoFocus: 'first', 'aria-label': label }), [state.close, label]);
    return (_jsxs(_Fragment, { children: [triggerRef ? null : _jsx("span", { ref: fallbackRef, hidden: true }), _jsx(RootMenuTriggerStateContext.Provider, { value: state, children: _jsx(MenuOverlay, { ...rest, ...anchorProps, "aria-label": label, layer: layer, 
                    // Like a platform context menu, it holds the page still while open.
                    isNonModal: false, isOpen: isOpen, onOpenChange: state.setOpen, onContextMenu: (event) => event.preventDefault(), children: _jsx(MenuContext.Provider, { value: menuDefaults, children: children ?? _jsx(Menu, { items: items ?? [] }) }) }) })] }));
}
/**
 * Opens a `ContextMenu` from any element: at the pointer on a secondary click or a long touch, and
 * below the element on the Context Menu key or Shift+F10.
 */
export function ContextMenuTrigger({ children, isDisabled = false, ...rest }) {
    const controller = useMenuController();
    const targetRef = useRef(null);
    const [target, ...menu] = Children.toArray(children);
    const own = isValidElement(target)
        ? target.props
        : {};
    const targetProps = useContextMenuTarget({ controller, isDisabled, own, targetRef });
    useEffect(() => {
        if (isDisabled)
            controller.close();
    }, [isDisabled, controller]);
    if (!isValidElement(target)) {
        throw new Error('ContextMenuTrigger needs a target element as its first child.');
    }
    // A disabled target opens no menu, so it mounts none.
    return (_jsxs(_Fragment, { children: [cloneElement(target, targetProps), isDisabled ? null : (_jsx(ContextMenu, { ...rest, controller: controller, triggerRef: targetRef, children: menu.length > 0 ? menu : undefined }))] }));
}
//# sourceMappingURL=context-menu.js.map