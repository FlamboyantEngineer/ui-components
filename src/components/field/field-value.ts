// Value comparisons shared by the field state, its history and its menu.

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : 1,
  );
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`;
}

/** Whether two field values are equal by structure: key order and object identity do not count. */
export function isFieldValueEqual(left: unknown, right: unknown): boolean {
  return Object.is(left, right) || stableStringify(left) === stableStringify(right);
}

/** Whether a value counts as empty for a required field: nothing, blank text or an empty list. */
export function isFieldValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return Array.isArray(value) && value.length === 0;
}
