import type { PersistCodec } from '../core/provider.js';
import type { Key } from '../core/props.js';
import { isKey } from './is-key.js';

/**
 * A codec that stores a value as JSON and reads it back through `read`, which returns the value or
 * throws when the stored data is not one, so the persisted state falls back to its default. `write`
 * turns the value into the data stored, when that differs from the value itself.
 */
export function createJsonCodec<T>(
  read: (value: unknown) => T,
  write: (value: T) => unknown = (value) => value,
): PersistCodec<T> {
  return {
    parse: (raw) => read(JSON.parse(raw)),
    stringify: (value) => JSON.stringify(write(value)),
  };
}

/**
 * A codec for a stored list every entry of which passes `isEntry`. One entry that does not
 * refuses the whole list, so the persisted state falls back to its default rather than a part.
 */
export function createListCodec<T>(isEntry: (value: unknown) => value is T): PersistCodec<T[]> {
  return createJsonCodec((value): T[] => {
    if (!Array.isArray(value) || !value.every(isEntry)) throw new TypeError('Not a stored list');
    return value;
  });
}

/** A stored boolean, such as whether a section is open. */
export const booleanCodec = createJsonCodec((value): boolean => {
  if (typeof value !== 'boolean') throw new TypeError('Not a stored boolean');
  return value;
});

/** A stored collection key; numbers and strings stay distinct. `null`, for no key, is never read back. */
export const keyCodec = createJsonCodec((value): Key | null => {
  if (!isKey(value)) throw new TypeError('Not a stored key');
  return value;
});

/** A stored finite number, such as a size. */
export const numberCodec = createJsonCodec((value): number => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError('Not a stored number');
  return value;
});

/** A stored list of collection keys; numbers and strings stay distinct. */
export const keyListCodec: PersistCodec<Key[]> = createListCodec(isKey);
