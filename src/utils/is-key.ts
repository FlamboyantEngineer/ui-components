import type { Key } from '../core/props.js';

/** Whether a value read from outside, such as storage or a drag, is a collection key. */
export function isKey(value: unknown): value is Key {
  return typeof value === 'string' || typeof value === 'number';
}
