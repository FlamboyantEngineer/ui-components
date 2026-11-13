import type { SelectionProps } from '../core/events.js';
import type { Key, Selection } from '../core/props.js';
import { fromCollectionKey } from './from-collection-key.js';
import { materializeIterator } from './materialize-iterator.js';
import { toCollectionKey } from './to-collection-key.js';

const primitiveSelections = new WeakMap<Set<Key>, Set<Key>>();

/** Each caller selection's keys when last encoded, and that encoding. */
const encodedSelections = new WeakMap<Iterable<Key>, { raw: readonly Key[]; result: Selection }>();

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
/**
 * Reuses an unchanged event selection so the primitive keeps its range-selection anchor, and the
 * encoding of a selection object passed again with the same keys, so a render that keeps a large
 * selection encodes nothing and the primitive sees the same set.
 */
export function toCollectionSelection(keys: Iterable<Key> | 'all' | undefined) {
  if (keys === undefined || keys === 'all') return keys;
  const raw = Array.from(materializeIterator(keys));
  const known = encodedSelections.get(keys);
  // A caller may mutate its set between renders: the cache holds only while the keys are the same.
  if (known && known.raw.length === raw.length && known.raw.every((key, at) => key === raw[at]))
    return known.result;
  const encoded = new Set(raw.map(toCollectionKey));
  const original = keys instanceof Set ? primitiveSelections.get(keys) : undefined;
  const result =
    original && original.size === encoded.size && [...encoded].every((key) => original.has(key))
      ? original
      : encoded;
  encodedSelections.set(keys, { raw, result });
  return result;
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
