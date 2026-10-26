// What a list lets its tabs do, and the state its two renders share. React Aria builds the tabs'
// collection from a hidden render of the list, where the `Tab` components run, while the drawn list
// holds the collection state; state both renders need lives in `Tabs`, above them.
import { createContext, useMemo, useRef, useState } from 'react';
import { createMenuController, useMenuController, } from '../context-menu/context-menu.js';
const idleController = createMenuController();
/** The shared state of the enclosing `Tabs`. */
export const TabsSharedContext = createContext({
    orientation: 'horizontal',
    isDisabled: false,
    disabledKeys: new Set(),
    controller: idleController,
    editingKey: null,
    setEditingKey: () => { },
    draggingKey: { current: null },
    stateRef: { current: null },
});
/** The actions of the enclosing `TabList`. */
export const TabActionsContext = createContext({
    onRemove: undefined,
    keyShortcuts: undefined,
    rename: null,
    reorder: null,
    menu: { controller: idleController, isEnabled: false, getEntries: () => [] },
});
/** The keys of the drawn list's tabs, in order. */
export function listTabKeys(shared) {
    const state = shared.stateRef.current;
    // The collection's own key list keeps the order the tabs were added in; walking it follows moves.
    return state ? [...state.collection].map((node) => node.key) : [];
}
/** The element of the tab `key` in a list. */
export function findTabElement(list, key) {
    const tabs = list ? [...list.querySelectorAll('[role="tab"]')] : [];
    return tabs.find((tab) => tab.getAttribute('data-key') === String(key));
}
/** Whether the tab `key` refuses focus, through the list's `disabledKeys` or with every tab. */
export function isTabDisabled(shared, key) {
    return shared.isDisabled || shared.disabledKeys.has(key);
}
/** Creates the state a `Tabs` shares with both renders of its list. */
export function useTabsShared({ orientation, isDisabled, disabledKeys }) {
    const controller = useMenuController();
    const [editingKey, setEditingKey] = useState(null);
    const draggingKey = useRef(null);
    const stateRef = useRef(null);
    const disabled = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
    return useMemo(() => ({
        orientation,
        isDisabled,
        disabledKeys: disabled,
        controller,
        editingKey,
        setEditingKey,
        draggingKey,
        stateRef,
    }), [orientation, isDisabled, disabled, controller, editingKey]);
}
//# sourceMappingURL=tab-actions.js.map