import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext } from 'react';
import { Header, KeyboardContext, MenuItem as AriaMenuItem, MenuSection as AriaMenuSection, useLocale, } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Separator } from '../separator/separator.js';
import { Shortcut } from '../shortcut/shortcut.js';
import { MenuSizeContext } from './menu-context.js';
const itemHooks = createHooks('menu-item', [
    'check',
    'icon',
    'spinner',
    'label',
    'description',
    'shortcut',
    'submenu-indicator',
]);
const sectionHooks = createHooks('menu-section', ['header']);
const separatorHooks = createHooks('menu-separator');
/** A check item's own state: a selection, where there is one, owns the check instead. */
function toOwnCheck(isSelected, selectionMode) {
    return selectionMode === 'none' ? isSelected : undefined;
}
/**
 * The building block's item state, narrowed to the states the library publishes, with the
 * disabled and checked states the item holds itself.
 */
function toRenderState(state, own) {
    const { isHovered, isFocused, isFocusVisible, isPressed } = state;
    const { selectionMode, hasSubmenu, isOpen } = state;
    return {
        isHovered,
        isFocused,
        isFocusVisible,
        isPressed,
        isSelected: toOwnCheck(own.isSelected, selectionMode) ?? state.isSelected,
        isDisabled: own.focusableDisabled || state.isDisabled,
        selectionMode,
        hasSubmenu,
        isOpen,
    };
}
/**
 * Draws the row itself where the building block's row will not do: a check item of its own takes
 * `menuitemcheckbox`, `aria-checked` and `data-selected`, since React Aria knows check items only
 * inside a selection; a focusable disabled item drops its activation handlers. Neither is a link.
 */
function createRowRender(own) {
    if (own.isSelected === undefined && !own.focusableDisabled)
        return undefined;
    return (domProps, state) => {
        const checked = toOwnCheck(own.isSelected, state.selectionMode);
        const row = checked === undefined
            ? domProps
            : {
                ...domProps,
                role: 'menuitemcheckbox',
                'aria-checked': checked,
                'data-selected': checked || undefined,
            };
        if (own.focusableDisabled)
            return renderFocusableDisabled(row);
        return _jsx("div", { ...row });
    };
}
/**
 * Draws a focusable disabled item. The building block keeps it enabled so arrow keys, Home, End,
 * type-to-select and hover still reach it (React Aria skips disabled items), so the row states
 * `aria-disabled` itself and drops the handlers that would press, select or activate it. Enter and
 * Space are refused without stopping them, so a search field's simulated key reports them cancelled.
 */
function renderFocusableDisabled(domProps) {
    // Without `href` the building block draws a `<div>`.
    const { onPointerDown: _onPointerDown, onPointerUp: _onPointerUp, onMouseDown: _onMouseDown, onClick: _onClick, onKeyDown, ...props } = domProps;
    return (_jsx("div", { ...props, "aria-disabled": "true", "data-disabled": "true", onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ')
                event.preventDefault();
            else
                onKeyDown?.(event);
        } }));
}
/**
 * The default row layout. The row is named by its text, so each part sits in plain elements
 * separated by spaces and its accessible name holds everything it shows.
 */
function MenuItemContent({ state, hasCheck, icon, description, shortcut, isPending, children, }) {
    const size = useContext(MenuSizeContext);
    const { direction } = useLocale();
    const iconBox = icon ? (_jsx(Icon, { ...toIconProps(icon), size: size, className: itemHooks.slotClass('icon') })) : null;
    return (_jsxs(_Fragment, { children: [!hasCheck ? null : (_jsx("span", { ...itemHooks.slot('check'), "aria-hidden": "true", children: state.isSelected ? _jsx(Glyph, { name: "check" }) : null })), isPending ? _jsx("span", { ...itemHooks.slot('spinner'), "aria-hidden": "true" }) : iconBox, _jsx("span", { ...itemHooks.slot('label'), children: children }), description ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...itemHooks.slot('description'), children: description })] })) : null, shortcut ? (_jsxs(KeyboardContext.Provider, { value: null, children: [' ', _jsx(Shortcut, { chord: shortcut, className: itemHooks.slotClass('shortcut') })] })) : null, state.hasSubmenu ? (_jsx(Glyph, { name: direction === 'rtl' ? 'chevron-left' : 'chevron-right', className: itemHooks.slotClass('submenu-indicator') })) : null] }));
}
/** One menu row: selection check, icon, label, description, shortcut and submenu arrow. */
export function MenuItem({ id, children, icon, description, shortcut, tone = 'neutral', isPending = false, isDisabled = false, focusableWhenDisabled = false, isSelected, textValue, className, href, ...rest }) {
    const own = { focusableDisabled: isDisabled && focusableWhenDisabled && !isPending, isSelected };
    const render = createRowRender(own);
    return (_jsx(AriaMenuItem, { ...rest, ...(render ? { render } : { href }), id: toCollectionItemKey(id), ...itemHooks.root({ className, props: rest, data: { tone, pending: isPending } }), textValue: textValue ?? (typeof children === 'string' ? children : undefined), isDisabled: isPending || (isDisabled && !own.focusableDisabled) || undefined, children: (ariaState) => {
            const state = toRenderState(ariaState, own);
            if (typeof children === 'function')
                return children(state);
            const isCheckItem = toOwnCheck(isSelected, state.selectionMode) !== undefined;
            return (_jsx(MenuItemContent, { state: state, hasCheck: isCheckItem || state.selectionMode !== 'none', icon: icon, description: description, shortcut: shortcut, isPending: isPending, children: children }));
        } }));
}
/** A group of menu items with an optional heading and its own selection mode. */
export function MenuSection({ id, title, children, className, selectedKeys, defaultSelectedKeys, onSelectionChange, ...rest }) {
    return (_jsxs(AriaMenuSection, { ...rest, id: toCollectionItemKey(id), ...sectionHooks.root({ className, props: rest }), ...toCollectionSelectionProps({ selectedKeys, defaultSelectedKeys, onSelectionChange }), children: [title ? _jsx(Header, { className: sectionHooks.slotClass('header'), children: title }) : null, keyCollectionChildren(children)] }));
}
/** A rule between menu items or sections: a `Separator` with the menu's hook. */
export function MenuSeparator({ className, ...rest }) {
    return _jsx(Separator, { ...rest, className: mergeClassNames(separatorHooks.className, className) });
}
//# sourceMappingURL=menu-item.js.map