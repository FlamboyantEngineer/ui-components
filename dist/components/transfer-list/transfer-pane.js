import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ListView, ListViewItem } from '../list-row/list-row.js';
import { SearchField } from '../search-field/search-field.js';
const hooks = createHooks('transfer-list', [
    'pane',
    'header',
    'title',
    'count',
    'search',
    'list',
    'empty',
]);
/**
 * One side of a transfer list: its title and counts, its filter and its rows on a `ListView`, where
 * a press selects, Shift and Ctrl or Cmd extend the selection, and a double click or Enter moves.
 */
export function TransferPane({ side, label, total, items, selected, onSelectionChange, onAction, filterText, onFilterTextChange, disabledKeys, isDisabled, onReorder, tools, }) {
    const strings = useUiStrings();
    const titleId = useId();
    const countId = useId();
    const count = selected.size > 0
        ? `${strings.itemCount(total)}, ${strings.selectedCount(selected.size)}`
        : strings.itemCount(total);
    return (_jsxs("div", { ...hooks.slot('pane', { side }), children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx("span", { ...hooks.slot('title'), id: titleId, children: label }), _jsx("span", { ...hooks.slot('count'), id: countId, children: count })] }), tools, _jsx(SearchField, { className: hooks.slotClass('search'), label: strings.filterLabel(label), placeholder: strings.filterLabel(label), size: "sm", value: filterText, onChange: onFilterTextChange, isDisabled: isDisabled }), _jsx(ListView, { className: hooks.slotClass('list'), "aria-labelledby": titleId, "aria-describedby": countId, items: items, selectionMode: "multiple", selectionBehavior: "replace", selectedKeys: selected, onSelectionChange: onSelectionChange, disabledKeys: disabledKeys, onAction: onAction, reorder: onReorder ? { onMove: onReorder } : undefined, renderEmptyState: () => (_jsx("span", { ...hooks.slot('empty'), children: filterText.trim() ? strings.noResults : strings.noItems })), children: (item) => (_jsx(ListViewItem, { id: item.id, title: item.label, meta: item.description, icon: item.icon, textValue: item.label })) })] }));
}
//# sourceMappingURL=transfer-pane.js.map