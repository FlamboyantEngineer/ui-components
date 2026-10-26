// The heading tree an outline draws from a flat list of headings (specs/OUTLINE.md).
/**
 * Nests headings given in document order: each goes under the nearest heading before it with a
 * lower level, so a skipped level nests one step deeper, and a heading with no such heading before
 * it is at the top.
 */
export function nestOutlineHeadings(headings) {
    const roots = [];
    const open = [];
    for (const heading of headings) {
        while ((open.at(-1)?.heading.level ?? -Infinity) >= heading.level)
            open.pop();
        const parent = open.at(-1);
        const siblings = parent ? parent.children : roots;
        const entry = {
            heading,
            path: [...(parent?.path ?? []), siblings.length],
            ancestors: parent ? [...parent.ancestors, parent.heading.id] : [],
            children: [],
        };
        siblings.push(entry);
        open.push(entry);
    }
    return roots;
}
/** Every entry of the tree, in document order. */
export function flattenOutline(entries) {
    return entries.flatMap((entry) => [entry, ...flattenOutline(entry.children)]);
}
//# sourceMappingURL=outline-tree.js.map