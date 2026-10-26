import { Children, Fragment, isValidElement } from 'react';
/** The child's own key: its `id` prop, else its React key, else its position. */
function readKey(child, index) {
    if (!isValidElement(child))
        return `#${index}`;
    const { id } = child.props;
    if (typeof id === 'string' && id !== '')
        return id;
    return child.key ?? `#${index}`;
}
/** Adds the children to `items`, flattening fragments so each child draws one element. */
function collectInto(children, items, used) {
    Children.forEach(children, (child) => {
        if (child === null || child === undefined || typeof child === 'boolean')
            return;
        if (isValidElement(child) && child.type === Fragment) {
            collectInto(child.props.children, items, used);
            return;
        }
        let key = readKey(child, items.length);
        // A repeated key keeps the first child's identity; later ones are told apart by position.
        if (used.has(key))
            key = `${key}#${items.length}`;
        used.add(key);
        items.push({ key, node: child });
    });
}
/** The transcript's children, flattened, each with a key unique among them. */
export function collectTranscriptItems(children) {
    const items = [];
    collectInto(children, items, new Set());
    return items;
}
/** Sorts the keys that are new since `previous` into arrivals and older history. */
export function diffTranscriptKeys(previous, next) {
    if (previous === null)
        return { isReset: true, arrivals: [], older: [] };
    if (previous.length === 0)
        return { isReset: false, arrivals: [...next], older: [] };
    const before = new Set(previous);
    const firstSurvivor = next.findIndex((key) => before.has(key));
    if (firstSurvivor === -1)
        return { isReset: true, arrivals: [], older: [] };
    return {
        isReset: false,
        arrivals: next.slice(firstSurvivor + 1).filter((key) => !before.has(key)),
        older: next.slice(0, firstSurvivor),
    };
}
//# sourceMappingURL=transcript-items.js.map