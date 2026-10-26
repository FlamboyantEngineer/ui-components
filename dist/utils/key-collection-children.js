import { jsx as _jsx } from "react/jsx-runtime";
import { Children, cloneElement, Fragment, isValidElement, } from 'react';
import { toCollectionKey } from './to-collection-key.js';
import { toKeyIdentity } from './to-key-identity.js';
function getItemKey(item) {
    const value = item;
    const key = value.key ?? value.id;
    return typeof key === 'string' || typeof key === 'number' ? key : undefined;
}
/** Hands the element drawn for an item its own `id` and data item, as React Aria would. */
function CollectionItemSlot({ element, itemId, value }) {
    return cloneElement(element, value === undefined ? { id: itemId } : { id: itemId, value });
}
function keyElement(element) {
    const node = element;
    if (node.type === Fragment) {
        return cloneElement(node, { children: keyCollectionChildren(node.props.children) });
    }
    const { id } = node.props;
    return id === undefined ? node : cloneElement(node, { key: toKeyIdentity(id) });
}
/** Wraps an element drawn from `items` so React Aria keys it by its encoded collection key. */
function keyItemElement(element, item) {
    const node = element;
    const itemId = node.props.id ?? getItemKey(item);
    if (itemId === undefined)
        return node;
    return _jsx(CollectionItemSlot, { id: toCollectionKey(itemId), element: node, itemId: itemId });
}
export function keyCollectionChildren(children) {
    if (typeof children === 'function')
        return (item) => keyItemElement(children(item), item);
    return Children.map(children, (child) => (isValidElement(child) ? keyElement(child) : child));
}
//# sourceMappingURL=key-collection-children.js.map