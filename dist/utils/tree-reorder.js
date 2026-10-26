// Pure move computations for reordering a tree's rows: which moves are allowed, and the items
// that result from one. Components report moves; owners apply and persist them.
function indexRows(rows) {
    return new Map(rows.map((row) => [row.key, row]));
}
function findSiblings(rows, row) {
    return rows.filter((entry) => entry.parentKey === row.parentKey);
}
/** Whether the row `key`, or one of its ancestors, is one of `ancestors`. */
function isWithinAny(index, key, ancestors) {
    for (let current = key; current !== null; current = index.get(current)?.parentKey ?? null) {
        if (ancestors.has(current))
            return true;
    }
    return false;
}
/** Whether the row `key`, or one of its ancestors, is `ancestor`. */
function isWithin(index, key, ancestor) {
    return isWithinAny(index, key, new Set([ancestor]));
}
/** Whether a placement among the row's own siblings leaves it where it is. */
function isSameSlot(rows, placement) {
    const { source, target, position } = placement;
    if (position === 'inside')
        return true;
    const siblings = findSiblings(rows, source);
    const offset = siblings.indexOf(target) - siblings.indexOf(source);
    return offset === (position === 'before' ? 1 : -1);
}
/** Whether the owner lets the row leave its siblings for `parentKey`'s children. */
function canEnter(index, { source, parentKey }, rules) {
    const parent = parentKey === null ? null : index.get(parentKey);
    if (parent === undefined || !rules.canMoveInto)
        return false;
    return rules.canMoveInto(source.item, parent ? parent.item : null);
}
function findSiblingAbove(rows, row) {
    const siblings = findSiblings(rows, row);
    return siblings[siblings.indexOf(row) - 1];
}
function findParent(rows, row) {
    return row.parentKey === null ? undefined : rows.find((entry) => entry.key === row.parentKey);
}
/** The move past the neighbouring movable sibling, or `null` at either end. */
function resolveSiblingStep(rows, row, direction) {
    const movable = findSiblings(rows, row).filter((entry) => entry.isMovable);
    const target = movable[movable.indexOf(row) + (direction === 'up' ? -1 : 1)];
    if (!target)
        return null;
    return { key: row.key, targetKey: target.key, position: direction === 'up' ? 'before' : 'after' };
}
function findItem(items, key) {
    for (const item of items) {
        if (item.id === key)
            return item;
        const found = item.children ? findItem(item.children, key) : undefined;
        if (found)
            return found;
    }
    return undefined;
}
/**
 * `items` with each item that `place` answers replaced by the items it returns, searching the
 * children of the others. Subtrees with no replacement keep their identity.
 */
function replaceItems(items, place) {
    let changed = false;
    const next = items.flatMap((item) => {
        const placed = place(item);
        const children = placed || !item.children ? item.children : replaceItems(item.children, place);
        if (!placed && children === item.children)
            return [item];
        changed = true;
        return placed ?? [{ ...item, children }];
    });
    return changed ? next : items;
}
function placeAround(target, moved, position) {
    if (position === 'before')
        return [moved, target];
    if (position === 'after')
        return [target, moved];
    return [{ ...target, children: [...(target.children ?? []), moved] }];
}
/** An item's `children` property, the children trees read by default. */
export function readTreeChildren(item) {
    return item.children;
}
/** The rows a tree shows, in order: top-level items and the children of expanded items. */
export function getVisibleTreeRows(items, { expandedKeys, getChildren = readTreeChildren, isMovable = () => true, }) {
    const expanded = new Set(expandedKeys);
    const rows = [];
    const visit = (level, parentKey) => {
        for (const item of level) {
            const children = getChildren(item);
            const isExpanded = expanded.has(item.id) && Boolean(children?.length);
            rows.push({ key: item.id, parentKey, item, isMovable: isMovable(item), isExpanded });
            if (isExpanded && children)
                visit(children, item.id);
        }
    };
    visit(items, null);
    return rows;
}
/**
 * `move`, or `null` when it is not allowed or changes nothing. Both rows must be movable. A row never
 * lands inside or beside its own descendants, inside the parent it is already in, or in the slot it
 * already holds. A different parent needs the owner's `canMoveInto`.
 */
export function resolveTreeMove(rows, move, rules = {}) {
    const index = indexRows(rows);
    const source = index.get(move.key);
    const target = index.get(move.targetKey);
    if (!source?.isMovable || !target?.isMovable || source === target)
        return null;
    if (isWithin(index, target.parentKey, source.key))
        return null;
    const parentKey = move.position === 'inside' ? target.key : target.parentKey;
    const isAllowed = parentKey === source.parentKey
        ? !isSameSlot(rows, { source, target, position: move.position })
        : canEnter(index, { source, parentKey }, rules);
    return isAllowed ? move : null;
}
/**
 * The move a drop makes. As `resolveTreeMove`, except that nothing lands just after a row whose
 * children are listed below it: a line there reads as inside that row.
 */
export function resolveTreeDrop(rows, move, rules = {}) {
    const target = rows.find((row) => row.key === move.targetKey);
    if (move.position === 'after' && target?.isExpanded)
        return null;
    return resolveTreeMove(rows, move, rules);
}
/** The dragged rows in the order shown, leaving out rows inside another dragged row. */
function findOutermostRows(rows, keys) {
    const index = indexRows(rows);
    return rows.filter((row) => keys.has(row.key) && !isWithinAny(index, row.parentKey, keys));
}
/** Whether the rows already sit together in this order at the spot a drop of them names. */
function isSameArrangement(rows, { moved, first }) {
    if (first.position === 'inside' || first.target.parentKey !== first.source.parentKey)
        return false;
    const siblings = findSiblings(rows, first.source);
    const start = siblings.indexOf(first.source);
    const isRun = moved.every((row, offset) => siblings[start + offset] === row);
    const after = siblings[start + moved.length];
    const before = siblings[start - 1];
    return isRun && (first.position === 'before' ? after : before) === first.target;
}
/**
 * The moves a drop of several rows makes, in the order they apply: the first row lands where the
 * drop says and each other row just after the row before it, so the rows keep their order. Rows
 * inside another dragged row move with it. `null` when one of the rows cannot go there under the
 * rules of `resolveTreeDrop`, or when the drop leaves every row where it is.
 */
export function resolveTreeDropMany(rows, { keys, targetKey, position }, rules = {}) {
    const index = indexRows(rows);
    const dragged = new Set(keys);
    const moved = findOutermostRows(rows, dragged);
    const target = index.get(targetKey);
    const [source] = moved;
    if (!source || !target?.isMovable || isWithinAny(index, target.key, dragged))
        return null;
    if (position === 'after' && target.isExpanded)
        return null;
    const parentKey = position === 'inside' ? target.key : target.parentKey;
    const canGo = (row) => row.isMovable &&
        (row.parentKey === parentKey || canEnter(index, { source: row, parentKey }, rules));
    if (!moved.every(canGo))
        return null;
    if (isSameArrangement(rows, { moved, first: { source, target, position } }))
        return null;
    return moved.map((row, offset) => offset === 0
        ? { key: row.key, targetKey, position }
        : { key: row.key, targetKey: moved[offset - 1]?.key ?? targetKey, position: 'after' });
}
/**
 * The move a keyboard chord makes. `up` and `down` pass the neighbouring movable sibling. With
 * `canMoveInto`, `in` moves the row into the sibling above it as its last child and `out` moves it
 * to just after its parent.
 *
 * Returns `undefined` when the chord is not a move for this row (the row cannot move, or `in`/`out`
 * without `canMoveInto`), so the caller can treat the key as ordinary navigation; `null` when the
 * chord is a move that cannot happen here (at either end, or refused).
 */
export function resolveTreeKeyboardMove(rows, { key, direction }, rules = {}) {
    const row = rows.find((entry) => entry.key === key);
    if (!row?.isMovable)
        return undefined;
    if (direction === 'up' || direction === 'down')
        return resolveSiblingStep(rows, row, direction);
    if (!rules.canMoveInto)
        return undefined;
    const target = direction === 'in' ? findSiblingAbove(rows, row) : findParent(rows, row);
    if (!target)
        return null;
    const position = direction === 'in' ? 'inside' : 'after';
    return resolveTreeMove(rows, { key, targetKey: target.key, position }, rules);
}
/**
 * Nested items after `move`, leaving the input unchanged. Subtrees the move does not touch keep
 * their identity. A move whose row or target is missing, or whose target lies inside the moved row,
 * returns the items as they were.
 */
export function applyTreeMove(items, move) {
    const moved = findItem(items, move.key);
    if (!moved || move.key === move.targetKey || !findItem(items, move.targetKey))
        return items;
    if (moved.children && findItem(moved.children, move.targetKey))
        return items;
    const remaining = replaceItems(items, (item) => (item.id === move.key ? [] : null));
    return replaceItems(remaining, (item) => item.id === move.targetKey ? placeAround(item, moved, move.position) : null);
}
//# sourceMappingURL=tree-reorder.js.map