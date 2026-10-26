import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Menu } from '../menu/menu.js';
function toMenuEntry(entry, state, strings) {
    if (entry === 'clear') {
        return { id: entry, label: strings.clear, icon: 'close', isDisabled: !state.canClear };
    }
    if (entry === 'set-default') {
        return {
            id: entry,
            label: strings.setDefault,
            icon: 'refresh',
            isDisabled: !state.canSetDefault,
        };
    }
    if (entry === 'help')
        return { id: entry, label: strings.help, icon: 'help' };
    return entry;
}
/**
 * The field menu's entries in the caller's order, with built-in actions applied to the field state
 * before `onMenuAction` hears of any chosen entry.
 */
export function useFieldMenu(state, label, options) {
    const strings = useUiStrings();
    return {
        label: strings.fieldActions(label),
        entries: options.menu.map((entry) => toMenuEntry(entry, state, strings)),
        isDisabled: state.isDisabled || options.menu.length === 0,
        onAction(key) {
            if (key === 'clear')
                state.clear();
            if (key === 'set-default')
                state.setToDefault();
            options.onMenuAction?.(key);
        },
    };
}
/** The field's menu button. */
export function FieldMenuButton({ model, size, className, }) {
    return (_jsx(DropdownMenu, { iconOnly: true, label: model.label, size: size, menuSize: "md", className: className, items: model.entries, onAction: model.onAction, isDisabled: model.isDisabled }));
}
/** Opens the field menu on a secondary click, a long touch, Shift+F10 or the Context Menu key. */
export function FieldContextMenu({ model, children, }) {
    return (_jsxs(ContextMenuTrigger, { isDisabled: model.isDisabled, "aria-label": model.label, children: [children, _jsx(Menu, { items: model.entries, onAction: model.onAction })] }));
}
//# sourceMappingURL=field-menu.js.map