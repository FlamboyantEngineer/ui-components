import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A board of cards in columns, optionally repeated in lanes: each cell is a React Aria grid list,
// and cards move within and between cells by drag and drop or Alt+Arrow keys.
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { useMemo, useRef, useState, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { BoardColumnHeader } from './board-column-header.js';
import { boardHooks as hooks } from './board-hooks.js';
import { BoardCells, BoardLaneGroup } from './board-lane.js';
import { resolveBoardKeyboardMove, stepColumnMove, } from './board-moves.js';
import { useBoardModel } from './use-board-model.js';
import { useBoardCardDrag, useBoardColumnDrag } from './use-board-drag.js';
const cardShortcuts = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';
const editableSelector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
function toDirection(key, isRightToLeft) {
    if (key === 'ArrowUp')
        return 'up';
    if (key === 'ArrowDown')
        return 'down';
    if (key === 'ArrowLeft')
        return isRightToLeft ? 'next' : 'previous';
    if (key === 'ArrowRight')
        return isRightToLeft ? 'previous' : 'next';
    return null;
}
/** The card a keydown came from: the key of the card row around its target. */
function findCardKey(target, identities) {
    if (!(target instanceof Element) || target.closest(editableSelector))
        return undefined;
    const identity = target.closest(`.${hooks.slotClass('card')}`)?.getAttribute('data-key');
    return identity === null || identity === undefined ? undefined : identities.get(identity);
}
/**
 * Gives focus back to a moved card or column handle once the move renders. A card a virtualized
 * cell does not render is scrolled toward until it renders and takes focus.
 */
function useMoveFocus(root, reveals) {
    const request = useFocusRequest();
    return (kind, key) => {
        const escaped = CSS.escape(toKeyIdentity(key));
        const selector = kind === 'card'
            ? `.${hooks.slotClass('card')}[data-key-identity="${escaped}"]`
            : `.${hooks.slotClass('column')}[data-key-identity="${escaped}"] .${hooks.slotClass('column-handle')}`;
        request(() => {
            const element = root.current?.querySelector(selector);
            if (!element && kind === 'card')
                for (const reveal of reveals)
                    reveal(key);
            return element;
        });
    };
}
/** Alt+Arrow keys on a card: the move they make, reported, with focus kept on the card. */
function useCardKeys(options) {
    const { direction: textDirection } = useLocale();
    const { layout, onMove, focus } = options;
    const identities = useMemo(() => (onMove ? createKeyIndex(layout.addresses.keys()) : new Map()), [layout, onMove]);
    return (event) => {
        const direction = toDirection(event.key, textDirection === 'rtl');
        if (!onMove || !direction || !isMoveChord(event))
            return;
        const key = findCardKey(event.target, identities);
        const move = key === undefined ? undefined : resolveBoardKeyboardMove(layout, { key, direction });
        if (move === undefined)
            return;
        event.preventDefault();
        event.stopPropagation();
        if (!move)
            return;
        focus('card', move.key);
        onMove(move);
    };
}
/** The column headers, with keyboard column moves that keep focus on the moved column's handle. */
function BoardColumnHeaders({ model, onColumnMove, renderColumnActions, focus, }) {
    const drag = useBoardColumnDrag({ columns: model.columnKeys, onMove: onColumnMove });
    const onStep = (key, step) => {
        const move = stepColumnMove(model.columnKeys, key, step);
        if (!move)
            return;
        focus('column', key);
        onColumnMove?.(move);
    };
    return (_jsx("div", { ...hooks.slot('columns'), children: model.columns.map((column, index) => (_jsx(BoardColumnHeader, { columnKey: column.id, title: column.title, titleId: model.columnTitleId(index), count: model.countColumn(column.id), limit: column.limit, isOverLimit: model.isOverLimit(column), isCollapsed: model.collapsedColumns.keys.has(column.id), onCollapsedChange: (isCollapsed) => model.collapsedColumns.setCollapsed(column.id, isCollapsed), drag: drag, onStep: onStep, actions: renderColumnActions?.(column) }, toKeyIdentity(column.id)))) }));
}
/**
 * A board: columns of cards with a header each (title, count against an optional limit, collapse
 * toggle, optional caller actions), optionally repeated in collapsible lanes. Cards are the caller's content in a React Aria
 * grid list per cell; with `onMove` they move within and between cells by pointer or keyboard drag
 * and drop and Alt+Arrow keys, and with `onColumnMove` columns reorder. The board never moves cards
 * or columns itself: the owner applies each reported move.
 */
export function Board({ columns, lanes, items, getColumn, getLane, getTextValue, renderCard, onMove, onColumnMove, onAction, renderColumnActions, onAddCard, collapsedColumns, defaultCollapsedColumns, onCollapsedColumnsChange, collapsedLanes, defaultCollapsedLanes, onCollapsedLanesChange, persistKey, virtualized = false, className, ...rest }) {
    const root = useRef(null);
    const [reveals] = useState(() => new Set());
    const focus = useMoveFocus(root, reveals);
    const model = useBoardModel({
        ...{ columns, lanes, items, getColumn, getLane, persistKey },
        ...{ collapsedColumns, defaultCollapsedColumns, onCollapsedColumnsChange },
        ...{ collapsedLanes, defaultCollapsedLanes, onCollapsedLanesChange },
    });
    const { itemsByKey, layout } = model;
    const drag = useBoardCardDrag({
        layout,
        onMove,
        getTextValue: (key) => {
            const item = itemsByKey.get(key);
            return item ? getTextValue(item) : String(key);
        },
    });
    const onKeyDownCapture = useCardKeys({ layout, onMove, focus });
    const keyShortcuts = onMove ? cardShortcuts : undefined;
    const options = {
        renderCard,
        getTextValue,
        onAction,
        onAddCard,
        keyShortcuts,
        virtualized,
        drag,
        reveals,
    };
    return (_jsxs("div", { ref: root, role: "group", ...rest, ...hooks.root({ className, props: rest, data: { virtualized } }), onKeyDownCapture: onKeyDownCapture, children: [_jsx(BoardColumnHeaders, { model, onColumnMove, renderColumnActions, focus }), lanes ? (lanes.map((lane, index) => (_jsx(BoardLaneGroup, { model: model, lane: lane, index: index, options: options }, toKeyIdentity(lane.id))))) : (_jsx(BoardCells, { model: model, lane: null, options: options }))] }));
}
//# sourceMappingURL=board.js.map