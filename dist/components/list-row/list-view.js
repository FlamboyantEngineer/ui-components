import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// Collections of rows the reader selects, reorders or scrolls through at length: React Aria's grid
// list in its stack layout, each row drawn with the list row's text.
import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { useMemo } from 'react';
import { Collection, GridList, GridListHeader, GridListItem, GridListLoadMoreItem, GridListSection, ListLayout, useDragAndDrop, Virtualizer, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { useReorderDragAndDrop } from '../../utils/use-reorder-drag-and-drop.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ListRowContent } from './list-row.js';
const viewHooks = createHooks('list-view', ['drop-indicator', 'loader']);
const itemHooks = createHooks('list-view-item', ['drag-handle', 'checkbox', 'trailing']);
const sectionHooks = createHooks('list-view-section', ['header']);
/** The drag and drop options of a list that does not reorder: neither draggable nor droppable. */
const noDragAndDrop = {};
const defaultRowHeight = 48;
const renderDropIndicator = createDropIndicator(viewHooks.slotClass('drop-indicator'));
function getKeyText(key) {
    return String(fromCollectionKey(key));
}
/** The building block's drag and drop hooks for the list's reorder options. */
function useListDragAndDrop(reorder) {
    const options = useReorderDragAndDrop({
        resolveMove: (target, keys) => target.type === 'item' && target.dropPosition !== 'on' && !keys.has(target.key)
            ? {
                keys: [...keys].map(fromCollectionKey),
                targetKey: fromCollectionKey(target.key),
                position: target.dropPosition,
            }
            : null,
        onMove: (move) => reorder?.onMove(move),
        getTextValue: getKeyText,
        renderDropIndicator,
    });
    const { dragAndDropHooks } = useDragAndDrop(reorder ? options : noDragAndDrop);
    return reorder ? dragAndDropHooks : undefined;
}
/** The rows: children, or the rows drawn from `items`, and the loading row when loading more. */
function ListViewRows(props) {
    const strings = useUiStrings();
    const { items, children, dependencies, onLoadMore, isLoading = false } = props;
    return (_jsxs(_Fragment, { children: [_jsx(Collection, { items: items, dependencies: dependencies, children: keyCollectionChildren(children) }), onLoadMore ? (_jsx(GridListLoadMoreItem, { className: viewHooks.slotClass('loader'), isLoading: isLoading, onLoadMore: onLoadMore, children: _jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading }) })) : null] }));
}
/**
 * A list of rows on React Aria's grid list: single or multiple selection with checkboxes, actions,
 * links, typeahead, sections, reordering by drag and drop, virtualization, loading more and an
 * empty state. For a plain list of links and buttons, use `List`.
 */
export function ListView({ items, children, dependencies, divided = false, stickyHeaders = false, reorder, virtualized = false, rowHeight = defaultRowHeight, onLoadMore, isLoading, renderEmptyState, selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, onAction, className, ...rest }) {
    const dragAndDropHooks = useListDragAndDrop(reorder);
    const emptyState = useMemo(() => renderEmptyState && (() => renderEmptyState()), [renderEmptyState]);
    const list = (_jsx(GridList
    // React Aria keeps drag and drop hooks for the list's lifetime: remount when reorder toggles.
    , { ...rest, ...toCollectionSelectionProps({
            selectedKeys,
            defaultSelectedKeys,
            disabledKeys,
            onSelectionChange,
        }), onAction: onAction && ((key) => onAction(fromCollectionKey(key))), dragAndDropHooks: dragAndDropHooks, renderEmptyState: emptyState, ...viewHooks.root({ className, props: rest, data: { divided, stickyHeaders } }), children: _jsx(ListViewRows, { items, children, dependencies, onLoadMore, isLoading }) }, reorder ? 'reorder' : 'static'));
    if (!virtualized)
        return list;
    const layoutOptions = { rowHeight, headingHeight: rowHeight, loaderHeight: rowHeight };
    return (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: layoutOptions, children: list }));
}
/**
 * One row of a `ListView`: a drag handle while the list reorders, a selection checkbox while it
 * selects with toggles, the row text (`ListRowContent`) and trailing controls.
 */
export function ListViewItem({ id, title, meta, icon, leading, trailing, tone = 'neutral', textValue, className, ...rest }) {
    return (_jsx(GridListItem, { ...rest, id: toCollectionItemKey(id), textValue: textValue ?? (typeof title === 'string' ? title : undefined), ...itemHooks.root({ className, props: rest, data: { tone } }), children: ({ selectionMode, selectionBehavior, allowsDragging }) => (_jsxs(_Fragment, { children: [allowsDragging ? _jsx(DragHandle, { className: itemHooks.slotClass('drag-handle') }) : null, selectionMode !== 'none' && selectionBehavior === 'toggle' ? (_jsx(Checkbox, { size: "sm", slot: "selection", className: itemHooks.slotClass('checkbox') })) : null, _jsx(ListRowContent, { title: title, meta: meta, icon: icon, leading: leading }), isEmptyNode(trailing) ? null : _jsx("div", { ...itemHooks.slot('trailing'), children: trailing })] })) }));
}
/** A titled run of rows in a `ListView` (React Aria `GridListSection` with a header row). */
export function ListViewSection({ id, title, items, dependencies, children, className, ...rest }) {
    return (_jsxs(GridListSection, { ...rest, id: toCollectionItemKey(id), ...sectionHooks.root({ className, props: rest }), children: [_jsx(GridListHeader, { className: sectionHooks.slotClass('header'), children: title }), _jsx(Collection, { items: items, dependencies: dependencies, children: keyCollectionChildren(children) })] }));
}
//# sourceMappingURL=list-view.js.map