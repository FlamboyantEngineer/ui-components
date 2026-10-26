import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { Key } from '../core/props.js';
import { toCollectionKey } from './to-collection-key.js';
import { toKeyIdentity } from './to-key-identity.js';

type CollectionChildren = ReactNode | ((item: object) => ReactElement);

interface CollectionElementProps {
  id?: Key | undefined;
  value?: unknown;
  children?: CollectionChildren | undefined;
}

interface CollectionItemSlotProps {
  /** The item's collection key, which React Aria also keys the element by. */
  id: string;
  /** The element the caller's function drew for the item. */
  element: ReactElement<CollectionElementProps>;
  /** The item's own `id`, which the collection item inside `element` encodes itself. */
  itemId: Key;
  /** The data item, which React Aria hands each element it draws from `items`. */
  value?: unknown;
}

function getItemKey(item: object): Key | undefined {
  const value = item as { key?: unknown; id?: unknown };
  const key = value.key ?? value.id;
  return typeof key === 'string' || typeof key === 'number' ? key : undefined;
}

/** Hands the element drawn for an item its own `id` and data item, as React Aria would. */
function CollectionItemSlot({ element, itemId, value }: CollectionItemSlotProps) {
  return cloneElement(element, value === undefined ? { id: itemId } : { id: itemId, value });
}

function keyElement(element: ReactElement): ReactElement {
  const node = element as ReactElement<CollectionElementProps>;
  if (node.type === Fragment) {
    return cloneElement(node, { children: keyCollectionChildren(node.props.children) });
  }
  const { id } = node.props;
  return id === undefined ? node : cloneElement(node, { key: toKeyIdentity(id) });
}

/** Wraps an element drawn from `items` so React Aria keys it by its encoded collection key. */
function keyItemElement(element: ReactElement, item: object): ReactElement {
  const node = element as ReactElement<CollectionElementProps>;
  const itemId = node.props.id ?? getItemKey(item);
  if (itemId === undefined) return node;
  return <CollectionItemSlot id={toCollectionKey(itemId)} element={node} itemId={itemId} />;
}

/**
 * Keys a collection's children by their `id`, whatever component draws them, so that siblings with
 * the keys `1` and `'1'` stay separate React elements. React Aria keys the elements it draws from
 * `items` by their `id` as text, so each is wrapped in an element that carries its collection key and
 * hands the drawn element its own `id`. The collection items (`Tag`, `Tab`, `ListViewItem`, …) encode
 * that `id` themselves, so a host component that wraps one keeps its key.
 */
export function keyCollectionChildren(children: ReactNode): ReactNode;
export function keyCollectionChildren<T extends object>(
  children: (item: T) => ReactElement,
): (item: T) => ReactElement;
export function keyCollectionChildren<T extends object>(
  children: ReactNode | ((item: T) => ReactElement),
): ReactNode | ((item: T) => ReactElement);
export function keyCollectionChildren<T extends object>(
  children: ReactNode | ((item: T) => ReactElement),
): ReactNode | ((item: T) => ReactElement) {
  if (typeof children === 'function') return (item: T) => keyItemElement(children(item), item);
  return Children.map(children, (child) => (isValidElement(child) ? keyElement(child) : child));
}
