// Aligns two hierarchies row by row (specs/TREE-COMPARE.md): a keyed tree diff.
import { diffSequences } from './diff.js';
import { walkTree } from './walk-tree.js';
const haveSameLabel = (left, right) => left.label === right.label;
function getMovedFromId(id, comparison) {
    const known = comparison.movedFrom.get(id);
    if (known !== undefined)
        return known;
    const base = `moved-from:${String(id)}`;
    let candidate = base;
    for (let suffix = 2; comparison.rowIds.has(candidate); suffix += 1)
        candidate = `${base}:${suffix}`;
    comparison.rowIds.add(candidate);
    comparison.movedFrom.set(id, candidate);
    return candidate;
}
const childrenOf = (node) => (node.children ?? []);
function indexTree(nodes) {
    const index = new Map();
    for (const node of walkTree(nodes, childrenOf))
        index.set(node.id, node);
    return index;
}
function pairRow(left, right, comparison) {
    const change = comparison.isEqual(left, right) ? 'unchanged' : 'changed';
    if (change === 'changed')
        comparison.counts.changed += 1;
    return { id: left.id, nodeId: left.id, left, right, change, children: [] };
}
/** A node only the left sibling list holds: removed, or the old position of a moved node. */
function leftRow(node, comparison) {
    if (comparison.right.has(node.id)) {
        const id = getMovedFromId(node.id, comparison);
        return {
            id,
            nodeId: node.id,
            left: node,
            change: 'moved',
            counterpartId: node.id,
            children: [],
        };
    }
    comparison.counts.removed += 1;
    return { id: node.id, nodeId: node.id, left: node, change: 'removed', children: [] };
}
/**
 * A node only the right sibling list holds: added, or the new position of a moved node, under
 * which its children on both sides are compared.
 */
function rightRow(node, comparison) {
    const old = comparison.left.get(node.id);
    if (old) {
        comparison.counts.moved += 1;
        const counterpartId = getMovedFromId(node.id, comparison);
        return {
            id: node.id,
            nodeId: node.id,
            right: node,
            change: 'moved',
            counterpartId,
            children: [],
        };
    }
    comparison.counts.added += 1;
    return { id: node.id, nodeId: node.id, right: node, change: 'added', children: [] };
}
/** Aligns two sibling lists on their longest common run of ids. */
function* alignSiblings(left, right, comparison) {
    const ids = (nodes) => nodes.map((node) => node.id);
    for (const { kind, items } of diffSequences(ids(left), ids(right))) {
        for (const id of items) {
            if (kind === 'equal')
                yield pairRow(comparison.left.get(id), comparison.right.get(id), comparison);
            else if (kind === 'delete')
                yield leftRow(comparison.left.get(id), comparison);
            else
                yield rightRow(comparison.right.get(id), comparison);
        }
    }
}
function alignRows(left, right, comparison) {
    const rows = [];
    const stack = [{ rows, entries: alignSiblings(left, right, comparison) }];
    while (stack.length > 0) {
        const frame = stack.at(-1);
        const next = frame.entries.next();
        if (next.done) {
            stack.pop();
            continue;
        }
        const row = next.value;
        frame.rows.push(row);
        if (row.change === 'moved' && !row.right)
            continue;
        const oldNode = row.left ?? comparison.left.get(row.nodeId);
        const oldChildren = oldNode ? childrenOf(oldNode) : [];
        const newChildren = row.right ? childrenOf(row.right) : [];
        if (oldChildren.length === 0 && newChildren.length === 0)
            continue;
        stack.push({
            rows: row.children,
            entries: alignSiblings(oldChildren, newChildren, comparison),
        });
    }
    return rows;
}
/**
 * Aligns two hierarchies row by row, matching nodes by id. A node on both sides under the same
 * parent and in the same order is one row, `unchanged` or `changed`; a node on one side only is
 * `added` or `removed` with its subtree; a node whose parent or order differs is `moved` and has
 * two rows, its old position (left only, no children) and its new one (right only, its children
 * compared under it), each naming the other as its counterpart.
 */
export function compareTrees(left, right, options = {}) {
    const comparison = {
        left: indexTree(left),
        right: indexTree(right),
        isEqual: options.isEqual ?? haveSameLabel,
        counts: { added: 0, removed: 0, changed: 0, moved: 0 },
        movedFrom: new Map(),
        rowIds: new Set(),
    };
    for (const id of comparison.left.keys())
        comparison.rowIds.add(id);
    for (const id of comparison.right.keys())
        comparison.rowIds.add(id);
    return { rows: alignRows(left, right, comparison), counts: comparison.counts };
}
//# sourceMappingURL=compare-trees.js.map