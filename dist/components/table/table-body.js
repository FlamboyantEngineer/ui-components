import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Collection, Row, TableBody as AriaTableBody, TableLoadMoreItem, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { InlineError } from '../inline-error/inline-error.js';
import { tableHooks as hooks } from './table-hooks.js';
import { renderBodyNode } from './table-group-row.js';
import { countTableColumns } from './table-structure.js';
/** The key of the notice row, kept out of row actions. */
export const stateRowId = 'ui-table-state-row';
function TableStateRow({ status, props }) {
    const { message, onRetry } = props;
    return (_jsx(Row, { id: stateRowId, textValue: typeof message === 'string' ? message : status, 
        // Focusable so a retry button stays reachable, never selectable.
        isDisabled: true, disabledBehavior: "selection", ...hooks.slot('state-row', { variant: status }), children: _jsx(Cell, { colSpan: countTableColumns(props.model.structure), className: hooks.slotClass('state-cell'), children: status === 'error' ? (_jsx(InlineError, { onRetry: onRetry, children: message })) : (_jsx(EmptyState, { variant: status, size: "sm", description: message })) }) }));
}
/** The loading row after the rows, which asks for more as it scrolls into view. */
function TableLoader({ onLoadMore, isLoading, }) {
    const strings = useUiStrings();
    return (_jsx(TableLoadMoreItem, { className: hooks.slotClass('loader'), onLoadMore: onLoadMore, isLoading: isLoading, children: _jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading }) }));
}
/** The table body: one row per item with its child rows, or one full-width notice row. */
export function TableBody(props) {
    const { status, nodes, model, onLoadMore, isLoading } = props;
    if (model.structure.columns.length === 0) {
        return _jsx(AriaTableBody, { className: hooks.slotClass('body') });
    }
    if (status) {
        return (_jsx(AriaTableBody, { className: hooks.slotClass('body'), children: _jsx(TableStateRow, { status: status, props: props }) }));
    }
    return (_jsxs(AriaTableBody, { className: hooks.slotClass('body'), children: [_jsx(Collection, { items: nodes, dependencies: [model], children: (node) => renderBodyNode(node, model) }), onLoadMore || isLoading ? (_jsx(TableLoader, { onLoadMore: onLoadMore, isLoading: isLoading })) : null] }));
}
//# sourceMappingURL=table-body.js.map