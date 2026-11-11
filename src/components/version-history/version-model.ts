// Pure rules of a version history: filtering, the people to filter by, the two-version selection
// and the order a comparison reports.

import type { Key } from '../../core/props.js';
import { parseIsoDate, parseIsoDateTime } from '../../primitives/index.js';
import { getDateFormatter } from '../../utils/intl-format.js';

/** What a version needs for the rules here: its key, name, time and person. */
interface VersionFacts {
  id: Key;
  label?: string | undefined;
  time: string;
  person?: { name: string } | undefined;
}

/** A version that may fold older versions under it. */
interface FoldingVersion extends VersionFacts {
  children?: readonly this[] | undefined;
}

/** A row the list draws: a version, whether it sits folded under another, and what it folds. */
export interface VersionRow<V> {
  version: V;
  isNested: boolean;
  /** How many of its folded versions the filter keeps; a row with any shows a toggle. */
  foldedCount: number;
}

/** Which versions a history shows. */
export interface VersionHistoryFilter {
  /** Keeps only the versions that have a name. */
  namedOnly: boolean;
  /** Keeps only the versions made by the person with this name; `null` keeps everyone's. */
  person: string | null;
}

/** The most versions selected at once: one to view, two to compare. */
const maxSelectedVersions = 2;

/** Whether a version has a name, as opposed to an automatic version titled by its time. */
export function isNamedVersion(version: VersionFacts): boolean {
  return (version.label ?? '').trim() !== '';
}

/** The versions the filter keeps, in their order; people match by their trimmed name. */
export function filterVersions<V extends VersionFacts>(
  versions: readonly V[],
  filter: VersionHistoryFilter,
): V[] {
  return versions.filter(
    (version) =>
      (!filter.namedOnly || isNamedVersion(version)) &&
      (filter.person === null || version.person?.name.trim() === filter.person),
  );
}

/** Every version, each followed by the versions it folds, newest first as listed. */
export function flattenVersions<V extends FoldingVersion>(versions: readonly V[]): V[] {
  return versions.flatMap((version) => [version, ...(version.children ?? [])]);
}

/**
 * The rows the list draws: each version the filter keeps, followed, while it is expanded, by the
 * folded versions the filter keeps. A folded version the filter keeps under a version it drops
 * stands on its own row, so a filter never hides a match.
 */
export function listVersionRows<V extends FoldingVersion>(
  versions: readonly V[],
  options: { filter: VersionHistoryFilter; expandedKeys: ReadonlySet<Key> },
): VersionRow<V>[] {
  return versions.flatMap((version) => {
    const kept = filterVersions(version.children ?? [], options.filter);
    const loose = kept.map((child) => ({ version: child, isNested: false, foldedCount: 0 }));
    if (filterVersions([version], options.filter).length === 0) return loose;
    const row = { version, isNested: false, foldedCount: kept.length };
    if (!options.expandedKeys.has(version.id)) return [row];
    return [row, ...loose.map((child) => ({ ...child, isNested: true }))];
  });
}

/** The names of the people who made the versions, once each, in order of first appearance. */
export function listVersionPeople(versions: readonly VersionFacts[]): string[] {
  const names = new Set<string>();
  for (const version of versions) {
    const name = version.person?.name.trim();
    if (name) names.add(name);
  }
  return [...names];
}

/**
 * The selection after a change, at most `maxSelectedVersions` keys: the keys kept from before, in
 * their order, then the new ones; the earliest picks give way when there are too many.
 */
export function limitSelection(previous: ReadonlySet<Key>, next: ReadonlySet<Key>): Set<Key> {
  const kept = [...previous].filter((key) => next.has(key));
  const added = [...next].filter((key) => !previous.has(key));
  return new Set([...kept, ...added].slice(-maxSelectedVersions));
}

/**
 * The selected keys that name a version in `versions` that is not disabled, in their order. A key
 * hidden only by the filter stays: it is still in `versions`.
 */
export function keepSelectableKeys(
  versions: readonly (VersionFacts & { isDisabled?: boolean | undefined })[],
  selected: ReadonlySet<Key>,
): Set<Key> {
  const selectable = new Set(
    versions.filter((version) => !version.isDisabled).map((version) => version.id),
  );
  return new Set([...selected].filter((key) => selectable.has(key)));
}

/**
 * Two selected versions ordered for a comparison, the older first; `null` unless exactly two
 * selected keys name versions in `versions` (pass the selectable ones, see `keepSelectableKeys`).
 */
export function orderForComparison(
  versions: readonly VersionFacts[],
  selected: ReadonlySet<Key>,
): [Key, Key] | null {
  if (selected.size !== maxSelectedVersions) return null;
  const [first, second] = [...selected] as [Key, Key];
  const position = (key: Key) => versions.findIndex((version) => version.id === key);
  if (position(first) < 0 || position(second) < 0) return null;
  // Versions are listed newest first, so the older one comes later in the list.
  return position(first) > position(second) ? [first, second] : [second, first];
}

/**
 * A version's time as a medium date (and short time), or `null` when it cannot be read. A date or a
 * floating date and time reads as written; an instant reads in `timeZone`.
 */
export function formatVersionTime(value: string, locale: string, timeZone: string): string | null {
  const date = parseIsoDate(value);
  if (date) {
    return getDateFormatter(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
      date.toDate('UTC'),
    );
  }
  const dateTime = parseIsoDateTime(value, timeZone);
  if (!dateTime) return null;
  return getDateFormatter(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(
    dateTime.toDate(timeZone),
  );
}
