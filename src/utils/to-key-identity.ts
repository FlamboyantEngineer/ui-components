import type { Key } from '../core/props.js';

/** A collision-free text identity for a collection key, retaining its primitive type. */
export function toKeyIdentity(key: Key): string {
  return JSON.stringify([typeof key, String(key)]);
}
