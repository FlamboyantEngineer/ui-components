/** A value paired with the React key to render it under. */
export interface KeyedValue<T> {
  key: string;
  value: T;
}

/**
 * Pairs each value with a React key built from its identity and how many equal identities came
 * before it (`apple:0`, `apple:1`). Keys follow content rather than position, so inserting or
 * removing an entry keeps the other entries' state; swapping two equal entries is harmless because
 * they render the same content.
 */
export function assignOccurrenceKeys<T>(
  values: readonly T[],
  identity: (value: T) => string,
): Array<KeyedValue<T>> {
  const occurrences = new Map<string, number>();
  return values.map((value) => {
    const base = identity(value);
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return { key: `${base}:${occurrence}`, value };
  });
}
