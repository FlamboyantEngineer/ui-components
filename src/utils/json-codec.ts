import type { PersistCodec } from '../core/provider.js';

/**
 * A codec that stores a value as JSON and reads it back through `read`, which returns the value or
 * throws when the stored data is not one, so the persisted state falls back to its default.
 */
export function createJsonCodec<T>(read: (value: unknown) => T): PersistCodec<T> {
  return {
    parse: (raw) => read(JSON.parse(raw)),
    stringify: (value) => JSON.stringify(value),
  };
}
