import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { GridList, GridListItem, ListLayout, useDragAndDrop, Virtualizer, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { boardHooks as hooks } from './board-hooks.js';
/** The estimated height of a card in a virtualized cell, in pixels; cards are measured. */
const estimatedCardHeight = 96;
/** The options of a cell that does not drag: neither draggable nor droppable. */
const noDragAndDrop = {};
const renderDropIndicator = createDropIndicator(hooks.slotClass('drop-indicator'));
/**
 * Scrolls a virtualized cell toward its card at `index`, which it does not render, so that the
 * virtualizer renders it: the card's place is estimated from the rendered card nearest to it (or the
 * cell's start), and each later call starts from a nearer, measured card.
 */
function scrollTowardCard(grid, cards) {
    const { keys, index } = cards;
    const indexes = new Map(keys.map((key, at) => [toKeyIdentity(key), at]));
    const origin = grid.getBoundingClientRect().top - grid.scrollTop;
    let anchor = { index: 0, top: 0 };
    for (const row of grid.querySelectorAll(`.${hooks.slotClass('card')}`)) {
        const at = indexes.get(row.getAttribute('data-key-identity') ?? '');
        if (at === undefined || Math.abs(at - index) >= Math.abs(anchor.index - index))
            continue;
        anchor = { index: at, top: row.getBoundingClientRect().top - origin };
    }
    const top = anchor.top + (index - anchor.index) * estimatedCardHeight;
    grid.scrollTop = Math.max(0, top - grid.clientHeight / 2);
}
/**
 * Registers a virtualized cell's `BoardCardReveal`, so that a card moved into the cell by keyboard
 * renders and takes focus wherever the cell is scrolled.
 */
function useCardReveal(reveals, items) {
    const grid = useRef(null);
    useLayoutEffect(() => {
        if (!reveals)
            return;
        const reveal = (key) => {
            const keys = items.map((item) => item.id);
            const index = keys.indexOf(key);
            if (index >= 0 && grid.current)
                scrollTowardCard(grid.current, { keys, index });
        };
        reveals.add(reveal);
        return () => {
            reveals.delete(reveal);
        };
    }, [reveals, items]);
    return grid;
}
/**
 * A cell's grid list drag and drop hooks: its cards drag with the board's media type, and it takes
 * drops of the board's cards wherever `resolveDrop` lets them land. `undefined` without `drag`.
 */
function useCellDragAndDrop(drag, { column, lane }, keys) {
    const options = useMemo(() => {
        if (!drag)
            return noDragAndDrop;
        const address = { column, lane };
        const decodeTarget = (target) => {
            if (target.type === 'root')
                return target;
            const key = keys.get(String(target.key));
            return key === undefined ? null : { ...target, key };
        };
        return {
            getItems: (dragged) => [...dragged].map((key) => ({
                [drag.dragType]: String(key),
                'text/plain': drag.getTextValue(keys.get(String(key))),
            })),
            getAllowedDropOperations: () => ['move'],
            acceptedDragTypes: [drag.dragType],
            onDragStart: ({ keys: dragged }) => drag.setDragging(keys.get(String([...dragged][0])) ?? null),
            onDragEnd: () => drag.setDragging(null),
            getDropOperation: (target) => {
                const decoded = decodeTarget(target);
                return decoded && drag.resolveDrop(address, decoded) ? 'move' : 'cancel';
            },
            onDrop: ({ target }) => {
                const decoded = decodeTarget(target);
                if (decoded)
                    drag.drop(address, decoded);
            },
            renderDropIndicator,
        };
    }, [drag, column, lane, keys]);
    const { dragAndDropHooks } = useDragAndDrop(options);
    return drag ? dragAndDropHooks : undefined;
}
/** The cell's cards: a grid list of the caller's card content, virtualized on request. */
function BoardCards({ address, items, labelledBy, options, }) {
    const strings = useUiStrings();
    const { renderCard, getTextValue, onAction, keyShortcuts, virtualized, drag } = options;
    const keys = useMemo(() => createKeyIndex(items.map((item) => item.id)), [items]);
    const dragAndDropHooks = useCellDragAndDrop(drag, address, keys);
    const grid = useCardReveal(virtualized ? options.reveals : null, items);
    const renderEmptyState = useCallback(() => (_jsx(EmptyState, { size: "sm", description: strings.noCards, className: hooks.slotClass('empty') })), [strings.noCards]);
    const list = (_jsx(GridList
    // React Aria keeps drag and drop hooks for the list's lifetime: remount when moves toggle.
    , { ref: grid, "aria-labelledby": labelledBy, items: items, dependencies: [renderCard, getTextValue, keyShortcuts], onAction: onAction &&
            ((key) => {
                const original = keys.get(String(key));
                if (original !== undefined)
                    onAction(original);
            }), dragAndDropHooks: dragAndDropHooks, renderEmptyState: renderEmptyState, ...hooks.slot('cards', { virtualized }), children: (item) => (_jsx(GridListItem, { id: toCollectionKey(item.id), textValue: getTextValue(item), ...hooks.slot('card', { keyIdentity: toKeyIdentity(item.id) }), render: (domProps) => _jsx("div", { ...domProps, "aria-keyshortcuts": keyShortcuts }), children: ({ allowsDragging }) => (_jsxs(_Fragment, { children: [allowsDragging ? _jsx(DragHandle, { className: hooks.slotClass('card-handle') }) : null, _jsx("div", { ...hooks.slot('card-content'), children: renderCard(item) })] })) })) }, drag ? 'drag' : 'static'));
    if (!virtualized)
        return list;
    return (_jsx(Virtualizer, { layout: ListLayout, layoutOptions: { estimatedRowSize: estimatedCardHeight }, children: list }));
}
/**
 * One column of one lane: its cards, then the add-card button when the board takes new cards. A
 * collapsed column's cell stays as an empty placeholder so the lanes keep their columns aligned.
 */
export function BoardCell(props) {
    const strings = useUiStrings();
    const { address, isCollapsed, isOverLimit, labelledBy, options } = props;
    const { onAddCard } = options;
    const data = { collapsed: isCollapsed, overLimit: isOverLimit };
    if (isCollapsed)
        return _jsx("div", { ...hooks.slot('cell', data) });
    return (_jsxs("div", { ...hooks.slot('cell', data), children: [_jsx(BoardCards, { ...props }), onAddCard ? (_jsx(Button, { variant: "ghost", size: "sm", startIcon: "plus", "aria-describedby": labelledBy, className: hooks.slotClass('add'), onPress: () => onAddCard(address), children: strings.addCard })) : null] }));
}
//# sourceMappingURL=board-cell.js.map