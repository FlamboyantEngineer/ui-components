import type { Key } from '../core/props.js';
import { toKeyIdentity } from './to-key-identity.js';

/** Encodes typed keys without whitespace for collection primitives that normalize DOM ids. */
export function toCollectionKey(key: Key): string {
  return encodeURIComponent(toKeyIdentity(key));
}

/**
 * The collection key a library collection item hands its primitive for its optional `id`. Each
 * item encodes its own `id`, so one rendered through a host component (React Aria's reuse
 * pattern) keeps the key its collection's selection, disabled keys and panels are encoded to.
 */
export function toCollectionItemKey(id: Key | undefined): string | undefined {
  return id === undefined ? undefined : toCollectionKey(id);
}
