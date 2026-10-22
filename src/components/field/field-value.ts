// Value comparisons shared by the field state, its history and its menu.

/** A string that is the same for structurally equal values: key order and object identity do not count. */
export function toFieldValueKey(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
  if (Array.isArray(value)) return `[${value.map(toFieldValueKey).join(',')}]`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : 1,
  );
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${toFieldValueKey(entry)}`).join(',')}}`;
}

/** Whether two field values are equal by structure: key order and object identity do not count. */
export function isFieldValueEqual(left: unknown, right: unknown): boolean {
  return Object.is(left, right) || toFieldValueKey(left) === toFieldValueKey(right);
}
