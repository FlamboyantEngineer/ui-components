import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useControllableState } from '../../core/controllable-state.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { listViewActions, } from './view-actions.js';
import { ViewDialogs } from './view-dialogs.js';
const hooks = createHooks('view-switcher', [
    'bar',
    'tabs',
    'tab',
    'menu',
    'label',
    'default',
    'modified',
    'actions',
    'panel',
]);
/** A view's name with its marks: the default view's star and the modified mark. */
function ViewLabel({ view, isDefault, isModified, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('label'), children: view.label }), isDefault ? (_jsxs(_Fragment, { children: [' ', _jsxs("span", { ...hooks.slot('default'), children: [_jsx(Glyph, { name: "star" }), _jsx(VisuallyHidden, { elementType: "span", children: strings.defaultView })] })] })) : null, isModified ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('modified'), children: _jsx(VisuallyHidden, { elementType: "span", children: strings.viewModified }) })] })) : null] }));
}
/** The views as tabs, each with a menu of its actions; the panel holds the content. */
function ViewTabs({ props, selectedKey, onSelect, getActions, actions, }) {
    const strings = useUiStrings();
    const { views, defaultViewKey, isDirty = false } = props;
    return (_jsxs(Tabs, { selectedKey: selectedKey ?? undefined, onSelectionChange: onSelect, size: "sm", children: [_jsxs("div", { ...hooks.slot('bar'), children: [_jsx(TabList, { className: hooks.slotClass('tabs'), "aria-label": props['aria-label'] ?? (props['aria-labelledby'] ? undefined : strings.views), "aria-labelledby": props['aria-labelledby'], overflow: "menu", getMenuItems: (key) => getActions(key), children: views.map((view) => (_jsx(Tab, { id: view.id, icon: view.icon, textValue: view.label, className: hooks.slotClass('tab'), children: _jsx(ViewLabel, { view: view, isDefault: view.id === defaultViewKey, isModified: isDirty && view.id === selectedKey }) }, toKeyIdentity(view.id)))) }), actions] }), views.map((view) => (_jsx(TabPanel, { id: view.id, className: hooks.slotClass('panel'), children: props.children }, toKeyIdentity(view.id))))] }));
}
/** The views in a menu whose button shows the selected view. */
function ViewMenu({ props, selected, onSelect, }) {
    const strings = useUiStrings();
    const { views, defaultViewKey, isDirty = false } = props;
    return (_jsx(DropdownMenu, { className: hooks.slotClass('menu'), label: selected ? (_jsx(ViewLabel, { view: selected, isDefault: selected.id === defaultViewKey, isModified: isDirty })) : (strings.views), icon: selected?.icon, "aria-label": props['aria-label'] ?? (props['aria-labelledby'] ? undefined : strings.views), "aria-labelledby": props['aria-labelledby'], selectionMode: "single", disallowEmptySelection: true, selectedKeys: selected ? [selected.id] : [], onSelectionChange: (keys) => {
            const [key] = keys === 'all' ? [] : [...keys];
            if (key !== undefined)
                onSelect(key);
        }, items: views.map((view) => ({
            id: view.id,
            label: view.label,
            icon: view.icon,
            description: view.id === defaultViewKey ? strings.defaultView : undefined,
        })) }));
}
function findView(views, key) {
    return key === null || key === undefined ? undefined : views.find((view) => view.id === key);
}
/**
 * The selected view: the chosen one while it is among `views`, else the default view, else the
 * first. An uncontrolled selection left on a view that is gone moves to that fallback and reports it.
 */
function useSelectedView(props) {
    const { views, defaultViewKey } = props;
    const [chosenKey, select] = useControllableState(props.selectedKey, props.defaultSelectedKey ?? defaultViewKey ?? views[0]?.id ?? null, (key) => {
        if (key !== null)
            props.onSelectionChange?.(key);
    });
    const selected = findView(views, chosenKey) ?? findView(views, defaultViewKey) ?? views[0];
    const selectedKey = selected?.id ?? null;
    const isStale = props.selectedKey === undefined && selectedKey !== null && chosenKey !== selectedKey;
    useEffect(() => {
        if (isStale)
            select(selectedKey);
    });
    return { selected, selectedKey, select };
}
/**
 * Names and switches the saved views of a collection, as tabs or a menu. The selected view shows a
 * modified mark while its settings differ from its saved ones; its actions save, save as a new
 * view, reset, rename, make it the default view or delete it, each tab also offering its own.
 */
export function ViewSwitcher(props) {
    const { views, variant = 'tabs', isDirty = false, defaultViewKey = null } = props;
    const { className, id } = props;
    const strings = useUiStrings();
    const { selected, selectedKey, select: setSelectedKey } = useSelectedView(props);
    const [dialog, setDialog] = useState(null);
    const context = {
        handlers: props,
        strings,
        selectedKey,
        isDirty,
        defaultViewKey,
        canDelete: views.length > 1,
        openDialog: setDialog,
    };
    const getActions = (key) => listViewActions(key, views.find((view) => view.id === key)?.label ?? String(key), context);
    const selectedActions = selected ? getActions(selected.id) : [];
    const actions = selected && selectedActions.length > 0 ? (_jsx(DropdownMenu, { iconOnly: true, label: strings.viewActions(selected.label), variant: "ghost", size: "sm", className: hooks.slotClass('actions'), items: selectedActions })) : null;
    const data = { variant, dirty: isDirty };
    return (_jsxs("div", { id: id, ...hooks.root({ className, props, data }), children: [variant === 'tabs' ? (_jsx(ViewTabs, { props: props, selectedKey: selectedKey, onSelect: setSelectedKey, getActions: getActions, actions: actions })) : (_jsxs(_Fragment, { children: [_jsxs("div", { ...hooks.slot('bar'), children: [_jsx(ViewMenu, { props: props, selected: selected, onSelect: setSelectedKey }), actions] }), props.children] })), _jsx(ViewDialogs, { dialog: dialog, onClose: () => setDialog((open) => open && { ...open, isOpen: false }) })] }));
}
//# sourceMappingURL=view-switcher.js.map