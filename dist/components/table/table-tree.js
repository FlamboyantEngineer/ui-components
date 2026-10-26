import { mapTree } from '../../utils/map-tree.js';
/** The rows as nodes, each holding its child rows as nodes, depth first. */
export function buildTableNodes(rows, getChildRows) {
    return mapTree(rows, (row) => getChildRows?.(row), (row, children) => ({ id: row.id, row, children }));
}
/**
 * The nodes whose row matches, or that hold a matching descendant, each keeping only its kept
 * children, so a match deep in the tree keeps the rows above it.
 */
export function filterTableNodes(nodes, matches) {
    return mapTree(nodes, (node) => node.children, (node, children) => matches(node.row) || children.length > 0 ? { ...node, children } : null);
}
/** The nodes ordered by `compare` at every level; rows it cannot separate keep their order. */
export function sortTableNodes(nodes, compare) {
    const ordered = (siblings) => [...siblings].sort((left, right) => compare(left.row, right.row));
    return mapTree(ordered(nodes), (node) => ordered(node.children), (node, children) => ({ ...node, children }));
}
//# sourceMappingURL=table-tree.js.map