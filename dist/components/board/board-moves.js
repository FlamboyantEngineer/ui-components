// Pure move computations for a board: where a dropped or keyboard-moved card lands, and where a
// dragged column goes. Boards report moves; owners apply and persist them.
/** The cards of one cell, in order. */
export function getCellCards(layout, { column, lane }) {
    return layout.cells.get(column)?.get(lane) ?? [];
}
/**
 * Sorts the items into the board's cells, keeping their order. Items whose column (or lane, on a
 * board with lanes) is not on the board are left out.
 */
export function createBoardLayout(options) {
    const { columns, lanes, collapsedColumns, items, getKey, getColumn, getLane } = options;
    const cells = new Map(columns.map((column) => [column, new Map(lanes.map((lane) => [lane, []]))]));
    const addresses = new Map();
    for (const item of items) {
        const address = { column: getColumn(item), lane: getLane ? getLane(item) : null };
        const cell = cells.get(address.column)?.get(address.lane);
        if (!cell)
            continue;
        cell.push(getKey(item));
        addresses.set(getKey(item), address);
    }
    const openColumns = columns.filter((column) => !collapsedColumns.has(column));
    return { cells, addresses, openColumns };
}
/** The move that lands `key` at `index` among the other cards of `address`. */
function moveToIndex(layout, { key, address, index }) {
    const others = getCellCards(layout, address).filter((card) => card !== key);
    const before = others[index];
    if (before !== undefined)
        return { key, ...address, targetKey: before, position: 'before' };
    return { key, ...address, targetKey: others.at(-1) ?? null, position: 'after' };
}
/** Whether `move` leaves the card where it already is. */
function isSamePlace(layout, move) {
    const current = layout.addresses.get(move.key);
    if (!current || current.column !== move.column || current.lane !== move.lane)
        return false;
    const cards = getCellCards(layout, current);
    const from = cards.indexOf(move.key);
    if (move.targetKey === null)
        return true;
    const offset = cards.indexOf(move.targetKey) - from;
    return offset === (move.position === 'before' ? 1 : -1);
}
/**
 * The move a drop of the card `key` on `target` in the cell `address` makes, or `null` where it may
 * not land or would stay where it is. A drop on a card, rather than beside it, is refused; a drop on
 * the cell itself lands after its last card.
 */
export function resolveBoardDrop(layout, { key, address, target }) {
    if (!layout.addresses.has(key))
        return null;
    let move;
    if (target.type === 'root') {
        move = moveToIndex(layout, { key, address, index: Number.POSITIVE_INFINITY });
    }
    else {
        if (target.dropPosition === 'on' || target.key === key)
            return null;
        if (!getCellCards(layout, address).includes(target.key))
            return null;
        move = { key, ...address, targetKey: target.key, position: target.dropPosition };
    }
    return isSamePlace(layout, move) ? null : move;
}
/**
 * The move a keyboard chord makes: `up` and `down` pass the neighbouring card of the cell, and
 * `previous` and `next` take the card to the same place in the neighbouring open column of its lane.
 * Returns `undefined` when `key` is not a card of the board, and `null` at either end.
 */
export function resolveBoardKeyboardMove(layout, { key, direction }) {
    const address = layout.addresses.get(key);
    if (!address)
        return undefined;
    const cards = getCellCards(layout, address);
    const index = cards.indexOf(key);
    if (direction === 'up' || direction === 'down') {
        const targetKey = cards[index + (direction === 'up' ? -1 : 1)];
        if (targetKey === undefined)
            return null;
        return { key, ...address, targetKey, position: direction === 'up' ? 'before' : 'after' };
    }
    const columnIndex = layout.openColumns.indexOf(address.column);
    const column = columnIndex < 0
        ? undefined
        : layout.openColumns[columnIndex + (direction === 'previous' ? -1 : 1)];
    if (column === undefined)
        return null;
    return moveToIndex(layout, { key, address: { column, lane: address.lane }, index });
}
/**
 * The move a drop of the column `key` on the column `targetKey` makes: the dragged column takes the
 * target's slot, landing after it when it comes from the left and before it otherwise. `null` when
 * either is missing or they are the same column.
 */
export function resolveColumnDrop(columns, { key, targetKey }) {
    const from = columns.indexOf(key);
    const to = columns.indexOf(targetKey);
    if (from < 0 || to < 0 || from === to)
        return null;
    return { key, targetKey, position: from < to ? 'after' : 'before' };
}
/** The move of the column `key` one place toward the start (-1) or the end (1), or `null` there. */
export function stepColumnMove(columns, key, step) {
    const index = columns.indexOf(key);
    const targetKey = index < 0 ? undefined : columns[index + step];
    if (targetKey === undefined)
        return null;
    return { key, targetKey, position: step < 0 ? 'before' : 'after' };
}
/** `items` with the item `key` moved to the slot before or after `targetKey`, or to the end. */
function placeItem(items, { key, targetKey, position }, place) {
    const moved = items.find((item) => item.id === key);
    if (!moved)
        return [...items];
    const rest = items.filter((item) => item.id !== key);
    const at = targetKey === null ? -1 : rest.findIndex((item) => item.id === targetKey);
    const index = at < 0 ? rest.length : at + (position === 'after' ? 1 : 0);
    return [...rest.slice(0, index), place(moved), ...rest.slice(index)];
}
/**
 * The items after a card move, leaving the input unchanged: the moved item takes its new cell
 * through `place` (which returns the item with its column and lane set) and lands beside its target,
 * or at the end without one.
 */
export function applyBoardMove(items, move, place) {
    return placeItem(items, move, (item) => place(item, { column: move.column, lane: move.lane }));
}
/** The columns after a column move, leaving the input unchanged. */
export function applyColumnMove(columns, move) {
    return placeItem(columns, move, (column) => column);
}
//# sourceMappingURL=board-moves.js.map