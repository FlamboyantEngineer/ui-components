/** Whether a node renders nothing on its own: `null`, `undefined`, a boolean or the empty string. */
export function isEmptyNode(node) {
    return node === null || node === undefined || typeof node === 'boolean' || node === '';
}
//# sourceMappingURL=is-empty-node.js.map