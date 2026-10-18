// Pure comparison of two values of a change: what kind of change it is, and which list items moved.

/** A list item and whether the other side of the change has it. */
export interface ListItemChange {
  value: string;
  /** `added` or `removed` when only one side has the item; `unchanged` when both do. */
  change: 'added' | 'removed' | 'unchanged';
}

/** Both sides of a list change, each item marked. */
export interface ListChanges {
  /** The old items in their order: `removed` or `unchanged`. */
  before: ListItemChange[];
  /** The new items in their order: `added` or `unchanged`. */
  after: ListItemChange[];
}

/** What happened to a property: it got a value, lost it, or its value changed. */
export type ChangeKind = 'added' | 'removed' | 'changed';

/** Whether a value is unset: nullish, an empty text or an empty list. */
export function isBlankValue(value: string | readonly string[] | null | undefined): boolean {
  return value === null || value === undefined || value.length === 0;
}

/** The kind of a change from its two values. */
export function resolveChangeKind(
  before: string | readonly string[] | null | undefined,
  after: string | readonly string[] | null | undefined,
): ChangeKind {
  if (isBlankValue(before) && !isBlankValue(after)) return 'added';
  if (isBlankValue(after) && !isBlankValue(before)) return 'removed';
  return 'changed';
}

/** Marks each item of `items` that `other` also has, matching repeated items one for one. */
function markItems(
  items: readonly string[],
  other: readonly string[],
  missing: 'added' | 'removed',
): ListItemChange[] {
  const counts = new Map<string, number>();
  for (const value of other) counts.set(value, (counts.get(value) ?? 0) + 1);
  return items.map((value) => {
    const left = counts.get(value) ?? 0;
    if (left === 0) return { value, change: missing };
    counts.set(value, left - 1);
    return { value, change: 'unchanged' };
  });
}

/**
 * Compares two lists of texts: old items the new list lacks are `removed`, new items the old list
 * lacks are `added`, and the rest `unchanged`. Each side keeps its order; repeated items match one
 * for one.
 */
export function compareLists(before: readonly string[], after: readonly string[]): ListChanges {
  return { before: markItems(before, after, 'removed'), after: markItems(after, before, 'added') };
}
