import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Toolbar, Tooltip, TooltipTrigger } from '../../primitives/index.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { Menu, MenuPopover, MenuTrigger, } from '../menu/menu.js';
import { toActionContent } from './action-verbs.js';
const hooks = createHooks('action-row', ['actions', 'action', 'tooltip', 'overflow']);
/** An action without a menu presses and states its own popup; a menu trigger leaves both to the menu. */
function toPressProps(action, hasMenu) {
    if (hasMenu)
        return {};
    return {
        'aria-expanded': action.isExpanded,
        'aria-haspopup': action['aria-haspopup'],
        onPress: action.onPress,
    };
}
/** The action's menu, opened by its button (with the button's tooltip) at the button's end. */
function ActionRowMenu({ action, size, children, }) {
    const menuSize = size === 'xs' ? 'sm' : size;
    return (_jsxs(MenuTrigger, { children: [children, _jsx(MenuPopover, { placement: "bottom end", children: _jsx(Menu, { items: action.items, onAction: action.onAction, size: menuSize }) })] }));
}
/** A tooltip that only repeats the action's label names the button already, so it describes nothing. */
function renderWithoutDescription(props) {
    return _jsx("button", { ...props, "aria-describedby": undefined });
}
/** A custom action's ref and toggle state, which report `aria-pressed` either way once set. */
function toCustomButtonProps(action) {
    if (action.verb !== 'custom')
        return {};
    if (action.isSelected === undefined)
        return { ref: action.ref };
    return { ref: action.ref, isSelected: action.isSelected, 'aria-pressed': action.isSelected };
}
function ActionRowButton({ action, size }) {
    const { icon, label, pendingLabel } = toActionContent(action, useUiStrings());
    const hasMenu = Boolean(action.items?.length);
    const button = (_jsx(Button, { ...pickDataAttributes(action), ...hooks.slot('action', { verb: action.verb }), ...toCustomButtonProps(action), ...toPressProps(action, hasMenu), id: action.id, icon: icon, label: label, size: size, isDisabled: action.isDisabled, 
        // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
        focusableWhenDisabled: action.tooltip !== undefined, isPending: action.isPending, pendingLabel: pendingLabel, "aria-controls": action['aria-controls'], render: action.tooltip === undefined ? renderWithoutDescription : undefined }));
    const withTooltip = (_jsxs(TooltipTrigger, { children: [button, _jsx(Tooltip, { className: hooks.slotClass('tooltip'), children: action.tooltip ?? label })] }));
    if (!hasMenu)
        return withTooltip;
    return (_jsx(ActionRowMenu, { action: action, size: size, children: withTooltip }));
}
function actionKey(action, index) {
    return action.id ?? `${action.verb}-${index}`;
}
/** Whether a menu's entries hold an item with `key`, in sections and submenus too. */
function hasMenuKey(entries, key) {
    return entries.some((entry) => {
        if (entry.type === 'separator')
            return false;
        if (entry.id === key && entry.type !== 'section')
            return true;
        return entry.items ? hasMenuKey(entry.items, key) : false;
    });
}
/** A hidden action as an overflow menu entry: a press, or a submenu of its own menu. */
function toMenuEntry(action, key, strings) {
    const { icon, label } = toActionContent(action, strings);
    const entry = {
        id: key,
        label,
        icon,
        isDisabled: action.isDisabled,
        isPending: action.isPending,
    };
    return action.items?.length
        ? { ...entry, items: action.items }
        : { ...entry, onPress: action.onPress };
}
/** The menu of the actions that do not fit, at the end of the row. */
function OverflowMenu({ keyed, size }) {
    const strings = useUiStrings();
    const onAction = (key) => {
        const owner = keyed.find(({ action }) => action.items && hasMenuKey(action.items, key));
        owner?.action.onAction?.(key);
    };
    return (_jsx("div", { ...hooks.slot('overflow'), children: _jsx(DropdownMenu, { iconOnly: true, size: size, placement: "bottom end", label: strings.moreItems(keyed.length), items: keyed.map(({ action, key }) => toMenuEntry(action, key, strings)), onAction: onAction }) }));
}
/**
 * The actions slot: the buttons, optionally as one toolbar, optionally keeping only the
 * actions that fit and listing the others in a "more" menu at the end.
 */
export function ActionRowActions({ actions, size, isToolbar, isCollapsing, ...labels }) {
    const { containerRef, visibleItems, hiddenItems } = useOverflowItems({
        items: isCollapsing ? actions : [],
    });
    const toKeyed = (action) => ({
        action,
        key: actionKey(action, actions.indexOf(action)),
    });
    const shown = (isCollapsing ? visibleItems : actions).map(toKeyed);
    const children = (_jsxs(_Fragment, { children: [shown.map(({ action, key }) => (_jsx(ActionRowButton, { action: action, size: size }, key))), isCollapsing && hiddenItems.length > 0 ? (_jsx(OverflowMenu, { keyed: hiddenItems.map(toKeyed), size: size })) : null] }));
    const ref = isCollapsing ? containerRef : undefined;
    if (isToolbar) {
        return (_jsx(Toolbar, { ...labels, ref: ref, className: hooks.slotClass('actions'), children: children }));
    }
    return (_jsx("div", { ref: ref, ...hooks.slot('actions'), children: children }));
}
/** Escape clears a selection, unless something inside the row handled it. */
export function createClearKey(onClear) {
    return (event) => {
        if (!onClear || event.key !== 'Escape' || event.defaultPrevented)
            return;
        event.preventDefault();
        onClear();
    };
}
//# sourceMappingURL=action-row-actions.js.map