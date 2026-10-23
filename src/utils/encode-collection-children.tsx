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

type CollectionChildren = ReactNode | ((item: object) => ReactElement);

interface CollectionElementProps {
  id?: Key | undefined;
  children?: CollectionChildren | undefined;
}

function getItemKey(item: object | undefined): Key | undefined {
  if (!item) return undefined;
  const value = item as { key?: unknown; id?: unknown };
  const key = value.key ?? value.id;
  return typeof key === 'string' || typeof key === 'number' ? key : undefined;
}

function encodeElement(
  element: ReactElement,
  parts: readonly ReactElement['type'][],
  item?: object,
): ReactElement {
  const node = element as ReactElement<CollectionElementProps>;
  if (node.type === Fragment) {
    return cloneElement(node, { children: encodeCollectionChildren(node.props.children, parts) });
  }
  if (!parts.includes(node.type)) return node;
  const key = node.props.id ?? getItemKey(item);
  return key === undefined
    ? node
    : cloneElement(node, { id: toCollectionKey(key), key: toCollectionKey(key) });
}

/** Encodes row and section IDs before the collection infers React keys from them. */
export function encodeCollectionChildren(
  children: ReactElement[],
  parts: readonly ReactElement['type'][],
): ReactElement[];
export function encodeCollectionChildren(
  children: ReactNode,
  parts: readonly ReactElement['type'][],
): ReactNode;
export function encodeCollectionChildren<T extends object>(
  children: (item: T) => ReactElement,
  parts: readonly ReactElement['type'][],
): (item: T) => ReactElement;
export function encodeCollectionChildren<T extends object>(
  children: ReactNode | ((item: T) => ReactElement),
  parts: readonly ReactElement['type'][],
): ReactNode | ((item: T) => ReactElement);
export function encodeCollectionChildren<T extends object>(
  children: ReactNode | ((item: T) => ReactElement),
  parts: readonly ReactElement['type'][],
): ReactNode | ((item: T) => ReactElement) {
  if (typeof children === 'function')
    return (item: T) => encodeElement(children(item), parts, item);
  return Children.map(children, (child) =>
    isValidElement(child) ? encodeElement(child, parts) : child,
  );
}
