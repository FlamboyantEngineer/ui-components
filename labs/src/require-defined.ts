// The labs' own non-null assertion: sample data an example indexes is known to be there.

/** `value` when it is present; throws when a lab's sample data lacks it. */
export function requireDefined<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Expected a value to be present.');
  return value;
}
