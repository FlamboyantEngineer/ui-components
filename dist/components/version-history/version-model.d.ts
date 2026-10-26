import type { Key } from '../../core/props.js';
/** What a version needs for the rules here: its key, name, time and person. */
export interface VersionFacts {
    id: Key;
    label?: string | undefined;
    time: string;
    person?: {
        name: string;
    } | undefined;
}
/** Which versions a history shows. */
export interface VersionHistoryFilter {
    /** Keeps only the versions that have a name. */
    namedOnly: boolean;
    /** Keeps only the versions made by the person with this name; `null` keeps everyone's. */
    person: string | null;
}
/** The most versions selected at once: one to view, two to compare. */
export declare const MAX_SELECTED_VERSIONS = 2;
/** Whether a version has a name, as opposed to an automatic version titled by its time. */
export declare function isNamedVersion(version: VersionFacts): boolean;
/** The versions the filter keeps, in their order; people match by their trimmed name. */
export declare function filterVersions<V extends VersionFacts>(versions: readonly V[], filter: VersionHistoryFilter): V[];
/** The names of the people who made the versions, once each, in order of first appearance. */
export declare function listVersionPeople(versions: readonly VersionFacts[]): string[];
/**
 * The selection after a change, at most `MAX_SELECTED_VERSIONS` keys: the keys kept from before, in
 * their order, then the new ones; the earliest picks give way when there are too many.
 */
export declare function limitSelection(previous: ReadonlySet<Key>, next: ReadonlySet<Key>): Set<Key>;
/** Two selected versions ordered for a comparison, the older first; `null` unless exactly two. */
export declare function orderForComparison(versions: readonly VersionFacts[], selected: ReadonlySet<Key>): [Key, Key] | null;
/** A version's time as a medium date (and short time), or `null` when it cannot be read. */
export declare function formatVersionTime(value: string, locale: string): string | null;
//# sourceMappingURL=version-model.d.ts.map