// What the tree comparison derives from its aligned rows: filtering, order, ancestors and names.
import { walkTree } from '../../utils/walk-tree.js';
/** The rows that differ, with the rows above them as context. */
export function filterChangedRows(rows) {
    const kept = new Map();
    const order = Array.from(walkTree(rows, (row) => row.children));
    for (const row of order.reverse()) {
        const children = row.children.flatMap((child) => kept.get(child.id) ?? []);
        if (row.change !== 'unchanged' || children.length > 0) {
            kept.set(row.id, { ...row, children });
        }
    }
    return rows.flatMap((row) => kept.get(row.id) ?? []);
}
/** The ids of the rows with a difference somewhere below them. */
export function collectKeysAboveChanges(rows) {
    const keys = new Set();
    const changes = new Set();
    const order = Array.from(walkTree(rows, (row) => row.children));
    for (const row of order.reverse()) {
        const hasChangeBelow = row.children.some((child) => changes.has(child.id));
        if (hasChangeBelow)
            keys.add(row.id);
        if (hasChangeBelow || row.change !== 'unchanged')
            changes.add(row.id);
    }
    return keys;
}
export function indexRows(rows) {
    const index = {
        order: [],
        position: new Map(),
        parent: new Map(),
        byId: new Map(),
    };
    const getChildren = (row) => {
        for (const child of row.children)
            index.parent.set(child.id, row.id);
        return row.children;
    };
    for (const row of walkTree(rows, getChildren)) {
        index.position.set(row.id, index.order.length);
        index.order.push(row);
        index.byId.set(row.id, row);
    }
    return index;
}
/** The row with a difference after (`1`) or before (`-1`) the current row, wrapping around. */
export function findNextChange(index, { from, step }) {
    const current = from === null ? undefined : index.position.get(from);
    let at = current ?? (step === 1 ? -1 : index.order.length);
    for (let checked = 0; checked < index.order.length; checked += 1) {
        at = (at + step + index.order.length) % index.order.length;
        const row = index.order[at];
        if (row.change !== 'unchanged')
            return row;
    }
    return undefined;
}
/** A row's accessible name and typeahead text: its label and how it differs. */
export function nameRow(row, strings) {
    const { left, right } = row;
    const label = (right ?? left)?.label ?? '';
    switch (row.change) {
        case 'added':
            return strings.treeAddedRow(label);
        case 'removed':
            return strings.treeRemovedRow(label);
        case 'changed':
            return strings.treeChangedRow(label, left && left.label !== label ? left.label : null);
        case 'moved':
            return right ? strings.treeMovedHereRow(label) : strings.treeMovedAwayRow(label);
        default:
            return label;
    }
}
//# sourceMappingURL=tree-compare-rows.js.map