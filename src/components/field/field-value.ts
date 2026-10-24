// Value comparisons shared by the field state, its history and its menu.

/**
 * Keys already built, by object: field values are immutable, and a large one (a document) is
 * compared several times per change, so each object is walked once.
 */
const objectKeys = new WeakMap<object, string>();

function toObjectKey(value: object): string {
  if (Array.isArray(value)) return `[${value.map(toFieldValueKey).join(',')}]`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : 1,
  );
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${toFieldValueKey(entry)}`).join(',')}}`;
}

/** A string that is the same for structurally equal values: key order and object identity do not count. */
export function toFieldValueKey(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
  if (value instanceof Date) return toObjectKey(value);
  let key = objectKeys.get(value);
  if (key === undefined) {
    key = toObjectKey(value);
    objectKeys.set(value, key);
  }
  return key;
}

/** Whether two field values are equal by structure: key order and object identity do not count. */
export function isFieldValueEqual(left: unknown, right: unknown): boolean {
  return Object.is(left, right) || toFieldValueKey(left) === toFieldValueKey(right);
}
