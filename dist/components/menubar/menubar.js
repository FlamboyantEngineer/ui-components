import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId, useLayoutEffect, useRef } from 'react';
import { useInteractOutside, Button as AriaButton, RootMenuTriggerStateContext, useLocale, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { mergeProps } from '../../utils/merge-props.js';
import { Menu, MenuOverlay, MenuTrigger } from '../menu/menu.js';
import { MenubarContext, useMenubarContext, useMenubarState } from './menubar-state.js';
const hooks = createHooks('menubar', ['trigger']);
/**
 * A menubar (`role="menubar"`): a row or column of top-level items that each open a menu, like an
 * application's File, Edit and View menus. It is one tab stop; the arrow keys move between the
 * items and from one open menu to the next, and once a menu is open, pointing at another item
 * opens its menu instead.
 */
export function Menubar({ orientation = 'horizontal', size = 'md', className, children, ...rest }) {
    const rootRef = useRef(null);
    const { direction } = useLocale();
    const { context, onKeyDownCapture } = useMenubarState({
        rootRef,
        orientation,
        size: size === 'xs' ? 'sm' : size,
        direction,
    });
    return (_jsx("div", { ...mergeProps(rest, { ref: rootRef, onKeyDownCapture }), ...hooks.root({ className, props: rest, data: { orientation, size } }), role: "menubar", "aria-orientation": orientation, children: _jsx(MenubarContext.Provider, { value: context, children: children }) }));
}
/**
 * The top-level item: React Aria's button, given the `menuitem` role, inside the menu's trigger,
 * where it can hand React Aria's menu state to the bar.
 */
function MenubarTrigger({ itemKey, isOpen, label, className, ...rest }) {
    const bar = useMenubarContext();
    const state = useContext(RootMenuTriggerStateContext);
    const stateRef = useRef(state);
    useLayoutEffect(() => {
        stateRef.current = state;
    });
    const ref = useRef(null);
    const { register } = bar;
    // React Aria hands the button a new merged ref on every render, so registration waits for mount.
    useLayoutEffect(() => {
        const element = ref.current;
        return element ? register(itemKey, { element, state: stateRef }) : undefined;
    }, [register, itemKey]);
    return (_jsx(AriaButton, { ...rest, ...hooks.slot('trigger', { open: isOpen }, className), "data-open": isOpen ? 'true' : undefined, ref: ref, excludeFromTabOrder: bar.tabKey !== itemKey, onFocus: () => bar.setTabKey(itemKey), onHoverStart: () => bar.switchTo(itemKey), onPressStart: (event) => {
            // React Aria's trigger only opens on a pointer press; a second press closes the menu.
            if (isOpen && event.pointerType !== 'touch' && event.pointerType !== 'keyboard') {
                bar.close(itemKey);
            }
        }, 
        // React Aria's button takes no role; the items of a menubar are menu items.
        render: (props) => _jsx("button", { ...props, role: "menuitem" }), children: label }));
}
/**
 * One top-level item of a `Menubar` and the menu it opens (React Aria `MenuTrigger` with the
 * library `Menu`, so the menu takes items, sections, separators, selection, shortcuts and submenus).
 * The menu floats without hiding the page, so the bar stays reachable while it is open.
 */
export function MenubarMenu({ items, children, onAction, ...trigger }) {
    const bar = useMenubarContext();
    const key = useId();
    const popoverRef = useRef(null);
    const isOpen = bar.openKey === key;
    // A menu that leaves the page usable does not close on a press outside by itself.
    useInteractOutside({
        ref: popoverRef,
        isDisabled: !isOpen,
        onInteractOutside: (event) => {
            if (!bar.isInside(event.target))
                bar.close(key);
        },
    });
    return (_jsxs(MenuTrigger, { isOpen: isOpen, onOpenChange: (open) => bar.setOpen(key, open), children: [_jsx(MenubarTrigger, { ...trigger, itemKey: key, isOpen: isOpen }), _jsx(MenuOverlay, { ref: popoverRef, placement: bar.orientation === 'horizontal' ? 'bottom start' : 'end top', isNonModal: true, shouldCloseOnInteractOutside: (element) => !bar.isInside(element), children: _jsx(Menu, { items: items, onAction: onAction, size: bar.size, children: children }) })] }));
}
//# sourceMappingURL=menubar.js.map