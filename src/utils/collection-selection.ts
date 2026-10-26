import type { Key, Selection } from '../core/props.js';
import type { SelectionProps } from '../core/events.js';
import { fromCollectionKey } from './from-collection-key.js';
import { toCollectionKey } from './to-collection-key.js';
import { materializeIterator } from './materialize-iterator.js';

const primitiveSelections = new WeakMap<Set<Key>, Set<Key>>();

/** Restores the caller's key types after a primitive changes selection. */
export function fromCollectionSelection(keys: Selection): Selection {
  if (keys === 'all') return keys;
  const decoded = new Set([...keys].map(fromCollectionKey));
  primitiveSelections.set(decoded, keys);
  return decoded;
}

export function toCollectionSelection(keys: Iterable<Key> | 'all'): Selection;
export function toCollectionSelection(keys: undefined): undefined;
export function toCollectionSelection(
  keys: Iterable<Key> | 'all' | undefined,
): Selection | undefined;
/** Reuses an unchanged event selection so the primitive keeps its range-selection anchor. */
export function toCollectionSelection(keys: Iterable<Key> | 'all' | undefined) {
  if (keys === undefined || keys === 'all') return keys;
  const encoded = new Set(Array.from(materializeIterator(keys), toCollectionKey));
  const original = keys instanceof Set ? primitiveSelections.get(keys) : undefined;
  return original &&
    original.size === encoded.size &&
    [...encoded].every((key) => original.has(key))
    ? original
    : encoded;
}

/** Adapts controlled, initial and disabled selections at a collection boundary. */
export function toCollectionSelectionProps({
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onSelectionChange,
}: Pick<
  SelectionProps,
  'selectedKeys' | 'defaultSelectedKeys' | 'disabledKeys' | 'onSelectionChange'
>) {
  return {
    selectedKeys: toCollectionSelection(selectedKeys),
    defaultSelectedKeys: toCollectionSelection(defaultSelectedKeys),
    disabledKeys:
      disabledKeys === undefined
        ? undefined
        : Array.from(materializeIterator(disabledKeys), toCollectionKey),
    onSelectionChange:
      onSelectionChange && ((keys: Selection) => onSelectionChange(fromCollectionSelection(keys))),
  };
}
