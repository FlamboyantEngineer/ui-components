import type { Key } from '../core/props.js';
import { toKeyIdentity } from './to-key-identity.js';

/** Encodes typed keys without whitespace for collection primitives that normalize DOM ids. */
export function toCollectionKey(key: Key): string {
  return encodeURIComponent(toKeyIdentity(key));
}
