import type { Key } from '../core/props.js';
import { toCollectionKey } from './to-collection-key.js';

/** Resolves a rendered typed identity back to one of the supplied collection keys. */
export function createKeyIndex(keys: Iterable<Key>): ReadonlyMap<string, Key> {
  const index = new Map<string, Key>();
  for (const key of keys) index.set(toCollectionKey(key), key);
  return index;
}
