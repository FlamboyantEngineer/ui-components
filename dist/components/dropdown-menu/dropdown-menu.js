import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext } from 'react';
import { OverlayTriggerStateContext } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Menu, MenuPopover, MenuTrigger, } from '../menu/menu.js';
const hooks = createHooks('dropdown-menu', ['caret', 'action', 'toggle']);
/** The menu button: a `Button` with a caret, or an `Button`, publishing the open state. */
function DropdownMenuTrigger({ label, icon, iconOnly = false, showCaret = true, variant, className, ...rest }) {
    const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? false;
    const props = { ...rest, ...hooks.root({ className, props: rest, data: { open: isOpen } }) };
    if (iconOnly) {
        return (_jsx(Button, { ...props, variant: variant ?? 'ghost', icon: icon ?? 'more', label: typeof label === 'string' ? label : '' }));
    }
    const caret = _jsx(Glyph, { name: "chevron-down", className: hooks.slotClass('caret') });
    return (_jsx(Button, { ...props, variant: variant ?? 'secondary', startIcon: icon, endIcon: showCaret ? caret : undefined, children: label }));
}
/**
 * A split button: the labelled button runs its own action, and a chevron button beside it opens the
 * menu. The group publishes the open state, which it holds for the menu trigger.
 */
function DropdownSplitButton({ trigger, menu, placement, open, onPress, }) {
    const strings = useUiStrings();
    const [isOpen, setOpen] = useControllableState(open.isOpen, open.defaultOpen ?? false, open.onOpenChange);
    const { label, icon, variant = 'secondary', size, isDisabled, className, iconOnly: _iconOnly, showCaret: _showCaret, ...rest } = trigger;
    const [data, button] = splitDataAttributes(rest);
    const shared = { variant, size, isDisabled };
    return (_jsxs("div", { ...data, ...hooks.root({ className, data: { open: isOpen, split: true } }), role: "group", children: [_jsx(Button, { ...button, ...shared, className: hooks.slotClass('action'), startIcon: icon, onPress: onPress, children: label }), _jsxs(MenuTrigger, { isOpen: isOpen, onOpenChange: setOpen, children: [_jsx(Button, { ...shared, icon: "chevron-down", label: strings.moreOptions, className: hooks.slotClass('toggle') }), _jsx(MenuPopover, { placement: placement, children: _jsx(Menu, { ...menu }) })] })] }));
}
/**
 * A button that opens a menu (React Aria `MenuTrigger`, which wires `aria-haspopup`,
 * `aria-expanded` and focus). Menu props pass to the `Menu`; the rest to the trigger. With
 * `onPress` it is a split button whose chevron opens the menu.
 */
export function DropdownMenu({ isOpen, defaultOpen, onOpenChange, placement = 'bottom start', menuSize, items, children, onAction, selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange, disabledKeys, disallowEmptySelection, shouldCloseOnSelect, filterable, 'aria-label': menuLabel, 'aria-labelledby': menuLabelledBy, size = 'md', onPress, ...trigger }) {
    const menu = {
        items,
        children,
        onAction,
        selectionMode,
        selectedKeys,
        defaultSelectedKeys,
        onSelectionChange,
        disabledKeys,
        disallowEmptySelection,
        shouldCloseOnSelect,
        filterable,
        'aria-label': menuLabel,
        'aria-labelledby': menuLabelledBy,
        size: menuSize ?? (size === 'xs' ? 'sm' : size),
    };
    const parts = { trigger: { ...trigger, size }, menu, placement };
    if (onPress) {
        return (_jsx(DropdownSplitButton, { ...parts, open: { isOpen, defaultOpen, onOpenChange }, onPress: onPress }));
    }
    return (_jsxs(MenuTrigger, { isOpen: isOpen, defaultOpen: defaultOpen, onOpenChange: onOpenChange, children: [_jsx(DropdownMenuTrigger, { ...parts.trigger }), _jsx(MenuPopover, { placement: placement, children: _jsx(Menu, { ...menu }) })] }));
}
//# sourceMappingURL=dropdown-menu.js.map