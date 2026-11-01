/**
 * The value a record holds under `key` itself, or `undefined`: a key such as `constructor` or
 * `__proto__` never reads what the record inherits.
 */
export function readOwn<V>(record: Readonly<Record<string, V>>, key: string): V | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}
