import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// Card collections: React Aria's grid list in its grid layout, one item per card.
import { useMemo } from 'react';
import { Collection, GridLayout, GridList, GridListItem, GridListLoadMoreItem, Size as LayoutSize, Virtualizer, WaterfallLayout, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { EmptyState } from '../empty-state/empty-state.js';
const gridHooks = createHooks('card-grid', ['loader']);
const itemHooks = createHooks('card-grid-item', ['checkbox']);
const defaultItemSize = { width: 200, height: 200 };
/** React Aria's virtual layout and its options for a layout and a smallest card size. */
function toVirtualLayout(layout, { width, height }) {
    const minItemSize = new LayoutSize(width, height);
    return layout === 'waterfall'
        ? { layout: WaterfallLayout, layoutOptions: { minItemSize } }
        : { layout: GridLayout, layoutOptions: { minItemSize } };
}
/** The cards: children, or the cards drawn from `items`, and the loading item when loading more. */
function CardGridCards(props) {
    const strings = useUiStrings();
    const { items, children, dependencies, onLoadMore, isLoading = false } = props;
    return (_jsxs(_Fragment, { children: [_jsx(Collection, { items: items, dependencies: dependencies, children: children }), onLoadMore ? (_jsx(GridListLoadMoreItem, { className: gridHooks.slotClass('loader'), isLoading: isLoading, onLoadMore: onLoadMore, children: _jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading }) })) : null] }));
}
/**
 * A collection of cards with two-dimensional arrow-key navigation, built on React Aria's grid list
 * in its grid layout: selection with checkboxes, actions, links, typeahead, a virtualized grid or
 * waterfall, loading more and an empty state.
 */
export function CardGrid({ items, children, dependencies, layout = 'grid', virtualized = false, minItemSize = defaultItemSize, onLoadMore, isLoading, renderEmptyState, className, ...rest }) {
    const emptyState = useMemo(() => renderEmptyState && (() => renderEmptyState()), [renderEmptyState]);
    const grid = (_jsx(GridList, { ...rest, layout: "grid", renderEmptyState: emptyState, ...gridHooks.root({ className, props: rest }), children: _jsx(CardGridCards, { items, children, dependencies, onLoadMore, isLoading }) }));
    if (!virtualized && layout === 'grid')
        return grid;
    return _jsx(Virtualizer, { ...toVirtualLayout(layout, minItemSize), children: grid });
}
/**
 * One item of a `CardGrid`, usually holding a `Card`. While the grid selects with toggles, it draws
 * a selection checkbox before its content; a render function receives the item's `isSelected` for
 * the card.
 */
export function CardGridItem({ className, children, ...rest }) {
    return (_jsx(GridListItem, { ...rest, ...itemHooks.root({ className, props: rest }), children: ({ selectionMode, selectionBehavior, isSelected }) => (_jsxs(_Fragment, { children: [selectionMode !== 'none' && selectionBehavior === 'toggle' ? (_jsx(Checkbox, { size: "sm", slot: "selection", className: itemHooks.slotClass('checkbox') })) : null, typeof children === 'function' ? children({ isSelected }) : children] })) }));
}
//# sourceMappingURL=card-grid.js.map