import type { Key } from '../core/props.js';
import { toCollectionKey } from './to-collection-key.js';

/** Restores a typed collection key, leaving a primitive's generated IDs unchanged. */
export function fromCollectionKey(key: Key): Key {
  if (typeof key !== 'string') return key;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(key));
    if (!Array.isArray(value) || value.length !== 2 || typeof value[1] !== 'string') return key;
    const original = value[0] === 'number' ? Number(value[1]) : value[1];
    if (value[0] !== 'number' && value[0] !== 'string') return key;
    return toCollectionKey(original) === key ? original : key;
  } catch {
    return key;
  }
}
