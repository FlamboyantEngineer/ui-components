import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Tree as AriaTree, ListLayout, useDragAndDrop, Virtualizer, } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { readTreeChildren } from '../../utils/tree-reorder.js';
import { walkTree } from '../../utils/walk-tree.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { TreeEmptyState, useTreeItemRenderer } from './tree-item.js';
import { createTreeAriaKeys } from './tree-aria-keys.js';
import { treeHooks as hooks } from './tree-hooks.js';
import { useTreeExpansion } from './use-tree-expansion.js';
import { useTreeFilter } from './use-tree-filter.js';
import { useTreeKeyDown } from './use-tree-key-down.js';
import { useTreeLoads } from './use-tree-loads.js';
import { useTreeRename } from './use-tree-rename.js';
import { useTreeReorder } from './use-tree-reorder.js';
import { useTreeSelection } from './use-tree-selection.js';
const virtualRowHeights = { sm: 28, md: 32, lg: 40 };
/** The drag and drop options of a tree that does not reorder: neither draggable nor droppable. */
const noDragAndDrop = {};
/** Separates the props that draw rows, the expansion, the root's own and React Aria's. */
function splitTreeProps({ items, getTextValue, getChildren = readTreeChildren, hasChildItems, isItemPending, getHref, isItemCurrent, getIcon, renderLabel, renderMeta, renderActions, expandGlyph = 'chevron', expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey, isPending = false, emptyMessage, size = 'sm', variant = 'default', wrap = false, reorder, onItemKeyDown, virtualized = false, rowHeight, className, ref, disabledKeys, checkboxSelection, selectionPropagation, selectedKeys, defaultSelectedKeys, onSelectionChange, filterText, filter, onLoadChildren, onRename, canRename, ...aria }) {
    const row = {
        getTextValue,
        getChildren,
        hasChildItems,
        isItemPending,
        getHref,
        isItemCurrent,
        getIcon,
        renderLabel,
        renderMeta,
        renderActions,
        expandGlyph,
    };
    const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey };
    const state = { items, isPending, emptyMessage, reorder, onItemKeyDown, disabledKeys };
    const selection = { selectionPropagation, selectedKeys, defaultSelectedKeys, onSelectionChange };
    const features = { checkboxSelection, selection, filterText, filter, onLoadChildren };
    const data = { size, variant, expandGlyph, wrap, pending: isPending, virtualized };
    const root = {
        className,
        ref,
        data,
        rowHeight: virtualized ? (rowHeight ?? virtualRowHeights[size]) : null,
    };
    return { row, expansion, state, features, rename: { onRename, canRename }, root, aria };
}
function findTreeItem(items, { key, getChildren }) {
    for (const item of walkTree(items, getChildren)) {
        if (item.id === key)
            return item;
    }
    return undefined;
}
/** Loading children through `onLoadChildren`, while the owner sets it. */
function useOwnerLoads(items, { getChildren, onLoadChildren, }) {
    const loads = useTreeLoads(onLoadChildren &&
        ((key) => {
            const item = findTreeItem(items, { key, getChildren });
            return item ? onLoadChildren(item) : undefined;
        }));
    return onLoadChildren ? loads : null;
}
/** Everything the tree draws from its props: the rows shown, their selection and their keys. */
function useTreeModel(props) {
    const { row, expansion: expansionOptions, state, features, ...parts } = splitTreeProps(props);
    const { getTextValue, getChildren: getAllChildren } = row;
    const { items, getChildren, expansion } = useTreeFilter({
        items: state.items,
        getChildren: getAllChildren,
        getTextValue,
        filterText: features.filterText,
        filter: features.filter,
        expansion: useTreeExpansion(expansionOptions),
    });
    const { reorder } = state;
    const disabledKeys = useMemo(() => (state.disabledKeys ? new Set(state.disabledKeys) : undefined), [state.disabledKeys]);
    const defaultSelectedKeys = useMemo(() => features.selection.defaultSelectedKeys === 'all'
        ? 'all'
        : features.selection.defaultSelectedKeys && new Set(features.selection.defaultSelectedKeys), [features.selection.defaultSelectedKeys]);
    const selection = useTreeSelection({
        ...features.selection,
        selectionMode: parts.aria.selectionMode,
        defaultSelectedKeys,
        items: state.items,
        getChildren: getAllChildren,
        disabledKeys,
    });
    const loads = useOwnerLoads(state.items, { getChildren: getAllChildren, ...features });
    const rename = useTreeRename({ ...parts.rename, getTextValue });
    const reordering = useTreeReorder({
        items,
        reorder,
        disabledKeys,
        expansion,
        getChildren,
        getTextValue,
    });
    const keys = useTreeKeyDown({ onItemKeyDown: state.onItemKeyDown, reordering, rename });
    const renderItem = useTreeItemRenderer({
        ...row,
        getChildren,
        reordering,
        registerRow: keys.registerRow,
        checkboxSelection: features.checkboxSelection ?? false,
        isIndeterminate: selection.isIndeterminate,
        rename,
        loads,
    });
    const dependencies = useMemo(() => [renderItem], [renderItem]);
    return {
        ...parts,
        state: { ...state, disabledKeys },
        items,
        expansion,
        selection,
        reordering,
        keys,
        renderItem,
        dependencies,
    };
}
/**
 * A hierarchy of rows built on React Aria's `Tree`: expand and collapse, selection with optional
 * checkboxes and propagation, keyboard navigation and typeahead, filtering, link rows, optional
 * persisted expansion, children loaded on demand, loading and empty notices, an actions slot per
 * row, in-place renaming and opt-in reordering. Items are plain data; render callbacks draw them.
 */
export function Tree(props) {
    const { root, aria, state, items, expansion, selection, reordering, keys, ...model } = useTreeModel(props);
    const { isPending, emptyMessage, disabledKeys } = state;
    const ariaKeys = createTreeAriaKeys({
        selection: selection.props,
        expansion,
        disabledKeys,
        onAction: aria.onAction,
    });
    const hasEmptyState = isPending || !isEmptyNode(emptyMessage);
    const { dragAndDropHooks } = useDragAndDrop(reordering?.dragAndDrop ?? noDragAndDrop);
    let tree = (_jsx(AriaTree
    // React Aria keeps drag and drop hooks for the tree's lifetime: remount when reordering toggles.
    , { ...aria, ...ariaKeys, ...hooks.root({ className: root.className, props: aria, data: root.data }), ref: root.ref, items: items, dependencies: model.dependencies, renderEmptyState: hasEmptyState
            ? () => _jsx(TreeEmptyState, { isPending: isPending, emptyMessage: emptyMessage })
            : undefined, dragAndDropHooks: reordering ? dragAndDropHooks : undefined, render: (domProps) => (_jsx("div", { ...domProps, "aria-busy": isPending || undefined, onKeyDownCapture: (event) => {
                keys.onKeyDownCapture(event);
                if (!event.isPropagationStopped())
                    domProps.onKeyDownCapture?.(event);
            } })), children: model.renderItem }, reordering ? 'reorderable' : 'fixed'));
    if (props.filterText !== undefined) {
        tree = _jsx(TextMatchProvider, { query: props.filterText, children: tree });
    }
    if (root.rowHeight === null)
        return tree;
    return (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: { rowHeight: root.rowHeight }, children: tree }));
}
export { useTreeLoads } from './use-tree-loads.js';
//# sourceMappingURL=tree.js.map