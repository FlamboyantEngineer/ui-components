import { useEffect, useState } from 'react';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import {} from './folder-model.js';
function findRow(region, key) {
    const rows = region.querySelectorAll('[role="row"]');
    return Array.from(rows).find((element) => element.dataset.key === toCollectionKey(key));
}
function isSameList(a, b) {
    return a.length === b.length && a.every((key, index) => key === b[index]);
}
function controlledKeys(options) {
    if (options.selectionMode === 'multiple') {
        return options.selectedKeys === undefined ? undefined : [...options.selectedKeys];
    }
    if (options.selectedKey === undefined)
        return undefined;
    return options.selectedKey === null ? [] : [options.selectedKey];
}
function initialKeys(options) {
    if (options.selectionMode === 'multiple')
        return [...(options.defaultSelectedKeys ?? [])];
    return options.defaultSelectedKey == null ? [] : [options.defaultSelectedKey];
}
/** Reports a new selection in the shape of the selection mode. */
function reportSelection(options, keys) {
    // The handler's shape follows `selectionMode`, which the caller's type already matched.
    const onSelectionChange = options.onSelectionChange;
    if (options.selectionMode !== 'multiple') {
        onSelectionChange?.(keys[0] ?? null);
        return;
    }
    onSelectionChange?.(new Set(keys));
}
/** The selected folders, in single or multiple selection, controlled or held here. */
export function useFolderSelection(options) {
    const [own, setOwn] = useState(() => initialKeys(options));
    const selected = controlledKeys(options) ?? own;
    const select = (keys) => {
        if (isSameList(keys, selected))
            return;
        setOwn(keys);
        reportSelection(options, keys);
    };
    return [selected, select];
}
/**
 * Every row with children is expanded unless the reader collapsed it, so a folder created deep in
 * the tree is in view as soon as it appears. A folder whose subfolders are not loaded yet starts
 * collapsed; expanding it calls `onOpen`, which loads them.
 */
export function useFolderExpansion(nodes, onOpen) {
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [opened, setOpened] = useState(() => new Set());
    const branchKeys = [];
    const lazyKeys = new Set();
    for (const node of walkTree(nodes, (node) => node.children)) {
        if (node.children)
            branchKeys.push(node.id);
        if (node.isLazy)
            lazyKeys.add(node.id);
    }
    const isLazy = (key) => lazyKeys.has(key);
    return {
        expandedKeys: [
            ...branchKeys.filter((key) => !collapsed.has(key)),
            ...[...opened].filter((key) => isLazy(key)),
        ],
        onExpandedChange: (keys) => {
            const lazy = [...keys].filter(isLazy);
            for (const key of lazy)
                if (!opened.has(key))
                    onOpen(key);
            setOpened(new Set(lazy));
            setCollapsed(new Set(branchKeys.filter((key) => !keys.has(key))));
        },
        reveal: (keys) => {
            const revealed = new Set(keys);
            setCollapsed((current) => new Set([...current].filter((key) => !revealed.has(key))));
        },
    };
}
/**
 * Moves focus to the row of `request.key` once that row is rendered: after an edit or a delete,
 * the field or row that held focus is gone. The tree renders new rows after its owner, and the
 * owner may update its folders later still, so the request waits for the row to appear.
 */
export function useRowFocus(regionRef, request, done) {
    useEffect(() => {
        const region = regionRef.current;
        if (!request || !region)
            return undefined;
        const focusRow = () => {
            const row = findRow(region, request.key);
            if (row) {
                row.focus();
                done();
            }
            return Boolean(row);
        };
        if (focusRow())
            return undefined;
        const observer = new MutationObserver(() => {
            if (focusRow())
                observer.disconnect();
        });
        observer.observe(region, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [regionRef, request, done]);
}
//# sourceMappingURL=use-folder-tree.js.map