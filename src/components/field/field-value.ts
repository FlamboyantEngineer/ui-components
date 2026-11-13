// Value comparisons shared by the field state, its history and its menu.

import { isDate } from '../../utils/is-date.js';

/**
 * Keys already built, by object: field values are immutable, and a large one (a document) is
 * compared several times per change, so each object is walked once.
 */
const objectKeys = new WeakMap<object, string>();

/** Numbers for objects compared by identity, as their entries say nothing of their content. */
const identities = new WeakMap<object, number>();
let identityCount = 0;

function toIdentityKey(value: object): string {
  let identity = identities.get(value);
  if (identity === undefined) {
    identityCount += 1;
    identity = identityCount;
    identities.set(value, identity);
  }
  return `ref:${identity}`;
}

function toObjectKey(value: object): string {
  if (Array.isArray(value)) return `[${value.map(toFieldValueKey).join(',')}]`;
  if (isDate(value)) {
    const time = value.getTime();
    return Number.isNaN(time) ? 'date:invalid' : `date:${new Date(time).toISOString()}`;
  }
  // A map, set, file or other built-in keeps its content out of its entries: compared by identity.
  if (Object.prototype.toString.call(value) !== '[object Object]') return toIdentityKey(value);
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left < right ? -1 : 1,
  );
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${toFieldValueKey(entry)}`).join(',')}}`;
}

/**
 * A string that is the same for structurally equal values: key order and object identity do not
 * count for arrays and plain objects. Other objects (a map, a set, a file) are equal only to
 * themselves.
 */
export function toFieldValueKey(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'bigint') return `bigint:${String(value)}`;
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
  if (isDate(value)) return toObjectKey(value);
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
