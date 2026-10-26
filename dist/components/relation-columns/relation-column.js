import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ListView, ListViewItem } from '../list-row/list-row.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { relationColumnsHooks as hooks } from './relation-columns-hooks.js';
/** A count drawn as digits and read as text. */
function Count({ count, text, slot, }) {
    return (_jsxs("span", { ...hooks.slot(slot), children: [_jsx("span", { "aria-hidden": "true", children: count }), _jsx(VisuallyHidden, { elementType: "span", children: text })] }));
}
/** The column's title: what it lists, by the item it lists them for. */
function useColumnTitle(column, getTextValue) {
    const strings = useUiStrings();
    if (column.direction === 'item')
        return strings.relationItem;
    const source = getTextValue(column.source);
    return column.direction === 'upstream'
        ? strings.upstreamOf(source)
        : strings.downstreamOf(source);
}
/**
 * One column of a relation walk: a header with its title and item count, then a `ListView` of
 * its items, each with the count of items further along its side. In a side column a press or the
 * arrow keys choose an item (single selection that follows focus); the start item's column only
 * shows it.
 */
export function RelationColumnView({ column, context, }) {
    const strings = useUiStrings();
    const titleId = useId();
    const title = useColumnTitle(column, context.getTextValue);
    const { direction } = column;
    const isSide = direction !== 'item';
    return (_jsxs("div", { role: "group", ...hooks.slot('column', { direction, depth: column.depth }), "aria-labelledby": titleId, children: [_jsxs("div", { ...hooks.slot('column-header'), children: [_jsx("span", { id: titleId, ...hooks.slot('column-title'), children: title }), ' ', _jsx(Count, { count: column.items.length, text: strings.itemCount(column.items.length), slot: "column-count" })] }), _jsx(ListView, { "aria-labelledby": titleId, className: hooks.slotClass('list'), items: column.items, dependencies: [context.getRelated, context.getTextValue, context.renderItem], selectionMode: isSide ? 'single' : 'none', selectionBehavior: "replace", disallowEmptySelection: true, selectedKeys: column.selectedKey === null ? [] : [column.selectedKey], onSelectionChange: (keys) => {
                    const [key] = keys === 'all' ? [] : [...keys];
                    if (key !== undefined)
                        context.onSelect(column, key);
                }, onAction: isSide ? context.onAction : undefined, renderEmptyState: () => (_jsx(EmptyState, { className: hooks.slotClass('empty'), size: "sm", description: direction === 'upstream' ? strings.noUpstream : strings.noDownstream })), children: (item) => {
                    const further = isSide ? context.getRelated(item, direction).length : 0;
                    return (_jsx(ListViewItem, { id: item.id, className: hooks.slotClass('item'), textValue: context.getTextValue(item), title: context.renderItem?.(item) ?? context.getTextValue(item), meta: isSide ? (_jsx(Count, { count: further, text: strings.relatedCount(further, direction), slot: "item-count" })) : undefined }));
                } })] }));
}
//# sourceMappingURL=relation-column.js.map