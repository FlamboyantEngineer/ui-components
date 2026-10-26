import { jsx as _jsx } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { getColumnText } from './table-column.js';
import { tableHooks as hooks } from './table-hooks.js';
/** The hidden columns after a change to the shown hideable ones; others stay as they were. */
function toHidden(hideable, hidden, shown) {
    const isHideable = (id) => hideable.some((column) => column.id === id);
    const isShown = (id) => shown === 'all' || shown.has(id);
    return [
        ...hidden.filter((id) => !isHideable(id)),
        ...hideable.filter((column) => !isShown(column.id)).map((column) => column.id),
    ];
}
/**
 * The columns menu: a checkable item per column that allows hiding, ticked while it is shown. The
 * menu stays open while columns are toggled.
 */
export function TableColumnsMenu({ columns, hidden, onHiddenChange }) {
    const strings = useUiStrings();
    const hideable = columns.filter((column) => column.allowsHiding);
    return (_jsx(DropdownMenu, { label: strings.columns, size: "sm", className: hooks.slotClass('columns-menu'), items: hideable.map((column) => ({ id: column.id, label: getColumnText(column) })), selectionMode: "multiple", selectedKeys: hideable
            .filter((column) => !hidden.includes(column.id))
            .map((column) => column.id), shouldCloseOnSelect: false, onSelectionChange: (shown) => onHiddenChange(toHidden(hideable, hidden, shown)) }));
}
//# sourceMappingURL=table-columns-menu.js.map