export function* walkTree(items, getChildren) {
    const levels = [items[Symbol.iterator]()];
    while (levels.length > 0) {
        const next = levels.at(-1).next();
        if (next.done) {
            levels.pop();
            continue;
        }
        yield next.value;
        const children = getChildren(next.value);
        if (children?.length)
            levels.push(children[Symbol.iterator]());
    }
}
//# sourceMappingURL=walk-tree.js.map