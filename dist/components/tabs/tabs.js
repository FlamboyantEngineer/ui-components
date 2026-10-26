import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { TabPanel as AriaTabPanel, Tabs as AriaTabs } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import { usePersistentState } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionItemKey, toCollectionKey } from '../../utils/to-collection-key.js';
import { TabsSharedContext, useTabsShared } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
const keyCodec = {
    parse(raw) {
        const value = JSON.parse(raw);
        if (typeof value !== 'string' && typeof value !== 'number')
            throw new Error('Not a tab key');
        return value;
    },
    stringify: (key) => JSON.stringify(key),
};
/**
 * The selection props for the building block: the caller's, or, with `persistKey` and no
 * `selectedKey`, an uncontrolled selection that starts from the provider's storage and is written
 * back on every change. With nothing stored it starts from `defaultSelectedKey`; the building block
 * replaces a key that no enabled tab has with the first enabled tab, which is then stored.
 */
function usePersistedSelection({ persistKey, ...selection }) {
    const isPersisted = persistKey !== undefined && selection.selectedKey === undefined;
    const [storedKey, setStoredKey] = usePersistentState(isPersisted ? persistKey : undefined, selection.defaultSelectedKey ?? null, keyCodec);
    if (!isPersisted)
        return selection;
    return {
        defaultSelectedKey: storedKey ?? undefined,
        onSelectionChange: (key) => {
            setStoredKey(key);
            selection.onSelectionChange?.(key);
        },
    };
}
/**
 * Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. With
 * `persistKey` it remembers the selected tab through the provider's storage.
 */
export function Tabs({ size = 'md', className, persistKey, selectedKey, defaultSelectedKey, onSelectionChange, ...rest }) {
    const selection = usePersistedSelection({
        persistKey,
        selectedKey,
        defaultSelectedKey,
        onSelectionChange,
    });
    const disabledKeys = useMemo(() => rest.disabledKeys && Array.from(rest.disabledKeys, toCollectionKey), [rest.disabledKeys]);
    const shared = useTabsShared({
        orientation: rest.orientation ?? 'horizontal',
        isDisabled: rest.isDisabled ?? false,
        disabledKeys,
    });
    return (_jsx(TabsSharedContext.Provider, { value: shared, children: _jsx(AriaTabs
        // Another storage key restores that key's selection.
        , { ...rest, selectedKey: toCollectionItemKey(selection.selectedKey), defaultSelectedKey: toCollectionItemKey(selection.defaultSelectedKey), onSelectionChange: (key) => selection.onSelectionChange?.(fromCollectionKey(key)), disabledKeys: disabledKeys, ...hooks.root({ className, props: rest, data: { size } }) }, persistKey) }));
}
/** The content shown for the tab with the same `id`. */
export function TabPanel({ className, id, ...rest }) {
    return (_jsx(AriaTabPanel, { ...rest, id: toCollectionItemKey(id), className: mergeClassNames(hooks.slotClass('panel'), className) }));
}
export { Tab } from './tab.js';
export { TabList } from './tab-list.js';
//# sourceMappingURL=tabs.js.map