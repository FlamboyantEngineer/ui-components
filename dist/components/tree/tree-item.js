import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { Collection, TreeItem, TreeItemContent, TreeLoadMoreItem, } from '../../primitives/index.js';
import { measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { treeHooks as hooks } from './tree-hooks.js';
import { TreeRowContent } from './tree-row.js';
const getLevelStyle = ({ level }) => measuredProperty('tree-level', String(level));
function toItemState(values, isCurrent) {
    const { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible } = values;
    return { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible, isCurrent };
}
/**
 * The row element: React Aria's props, without its drag handlers when the row cannot move, plus
 * the current-row marks and the keyboard moves a movable row announces.
 */
function createRowElement(options) {
    const { isMovable, isCurrent, isIndeterminate, href, keyShortcuts } = options;
    return (domProps) => {
        const { draggable, onDragStart, onDrag, onDragEnd, ...others } = domProps;
        return (_jsx("div", { ...others, ...(isMovable ? { draggable, onDragStart, onDrag, onDragEnd } : {}), "data-current": isCurrent || undefined, "data-indeterminate": isIndeterminate || undefined, "aria-current": isCurrent ? (href ? 'page' : true) : undefined, "aria-keyshortcuts": isMovable ? keyShortcuts : undefined }));
    };
}
/**
 * The loading row below an expanded row whose children are not loaded yet. With `onLoadMore` it
 * asks for them once it is in view (React Aria's loading sentinel).
 */
function TreeLoaderRow(props) {
    const strings = useUiStrings();
    return (_jsx(TreeLoadMoreItem, { className: hooks.slotClass('loader'), style: getLevelStyle, isLoading: props.isLoading, onLoadMore: props.onLoadMore, children: _jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading }) }));
}
/** The notice an empty tree shows: a loading notice while pending, else the caller's message. */
export function TreeEmptyState(props) {
    const strings = useUiStrings();
    return (_jsx(EmptyState, { variant: props.isPending ? 'loading' : 'empty', size: "sm", description: props.isPending ? strings.loading : props.emptyMessage, className: hooks.slotClass('empty') }));
}
/** The options every row's content reads, kept while none of them changes. */
function useRowContentOptions(options) {
    const { getTextValue, getIcon, renderLabel, renderMeta, renderActions, expandGlyph } = options;
    const { checkboxSelection, isIndeterminate, rename, loads } = options;
    const isMovable = options.reordering?.isMovable;
    return useMemo(() => ({
        getTextValue,
        getIcon,
        renderLabel,
        renderMeta,
        renderActions,
        expandGlyph,
        checkboxSelection,
        isIndeterminate,
        rename,
        loads,
        isMovable: isMovable ?? (() => false),
        hasReorder: isMovable !== undefined,
    }), [
        getTextValue,
        getIcon,
        renderLabel,
        renderMeta,
        renderActions,
        expandGlyph,
        checkboxSelection,
        isIndeterminate,
        rename,
        loads,
        isMovable,
    ]);
}
/** The loading row of a branch whose children are not loaded, asking for them unless they came. */
function renderLoader(item, { isItemPending, loads }) {
    const isLoading = (isItemPending?.(item) ?? false) || (loads?.isLoading(item.id) ?? false);
    const canLoad = loads && !loads.hasLoaded(item.id) && !loads.errorOf(item.id);
    return (_jsx(TreeLoaderRow, { isLoading: isLoading, onLoadMore: canLoad ? () => loads.load(item.id) : undefined }));
}
/**
 * Draws an item as a row with its loaded children nested below it, or with a loading row when it
 * has children that are not loaded yet.
 */
export function useTreeItemRenderer(options) {
    const { getTextValue, getChildren, hasChildItems, isItemPending, getHref, isItemCurrent } = options;
    const { reordering, registerRow, loads } = options;
    const content = useRowContentOptions(options);
    const keyShortcuts = reordering?.keyShortcuts;
    return useCallback(function renderItem(item) {
        const children = getChildren(item) ?? [];
        const isLazy = children.length === 0 && (hasChildItems?.(item) ?? false);
        const href = getHref?.(item);
        const isCurrent = isItemCurrent?.(item) ?? false;
        const isIndeterminate = content.isIndeterminate(item.id);
        const isMovable = content.isMovable(item.id);
        const rowElement = { isMovable, isCurrent, isIndeterminate, href, keyShortcuts };
        return (_jsxs(TreeItem, { id: toCollectionKey(item.id), textValue: getTextValue(item), href: href, hasChildItems: isLazy || undefined, className: hooks.slotClass('item'), style: getLevelStyle, render: createRowElement(rowElement), ref: (node) => registerRow(node, item), children: [_jsx(TreeItemContent, { children: (values) => (_jsx(TreeRowContent, { item: item, state: toItemState(values, isCurrent), hasCheckbox: content.checkboxSelection && values.selectionMode !== 'none', options: content })) }), children.length > 0 ? (_jsx(Collection, { items: children, dependencies: [renderItem], children: renderItem })) : null, isLazy ? renderLoader(item, { isItemPending, loads }) : null] }));
    }, [
        getChildren,
        hasChildItems,
        isItemPending,
        getHref,
        isItemCurrent,
        getTextValue,
        content,
        keyShortcuts,
        registerRow,
        loads,
    ]);
}
//# sourceMappingURL=tree-item.js.map