// Pure rules of a version history: filtering, the people to filter by, the two-version selection
// and the order a comparison reports.
import { DateFormatter, getLocalTimeZone, parseIsoDate, parseIsoDateTime, } from '../../primitives/index.js';
/** The most versions selected at once: one to view, two to compare. */
export const MAX_SELECTED_VERSIONS = 2;
/** Whether a version has a name, as opposed to an automatic version titled by its time. */
export function isNamedVersion(version) {
    return (version.label ?? '').trim() !== '';
}
/** The versions the filter keeps, in their order; people match by their trimmed name. */
export function filterVersions(versions, filter) {
    return versions.filter((version) => (!filter.namedOnly || isNamedVersion(version)) &&
        (filter.person === null || version.person?.name.trim() === filter.person));
}
/** The names of the people who made the versions, once each, in order of first appearance. */
export function listVersionPeople(versions) {
    const names = new Set();
    for (const version of versions) {
        const name = version.person?.name.trim();
        if (name)
            names.add(name);
    }
    return [...names];
}
/**
 * The selection after a change, at most `MAX_SELECTED_VERSIONS` keys: the keys kept from before, in
 * their order, then the new ones; the earliest picks give way when there are too many.
 */
export function limitSelection(previous, next) {
    const kept = [...previous].filter((key) => next.has(key));
    const added = [...next].filter((key) => !previous.has(key));
    return new Set([...kept, ...added].slice(-MAX_SELECTED_VERSIONS));
}
/** Two selected versions ordered for a comparison, the older first; `null` unless exactly two. */
export function orderForComparison(versions, selected) {
    if (selected.size !== MAX_SELECTED_VERSIONS)
        return null;
    const [first, second] = [...selected];
    const position = (key) => versions.findIndex((version) => version.id === key);
    // Versions are listed newest first, so the older one comes later in the list.
    return position(first) > position(second) ? [first, second] : [second, first];
}
/** A version's time as a medium date (and short time), or `null` when it cannot be read. */
export function formatVersionTime(value, locale) {
    const date = parseIsoDate(value);
    if (date) {
        return new DateFormatter(locale, { dateStyle: 'medium' }).format(date.toDate(getLocalTimeZone()));
    }
    const dateTime = parseIsoDateTime(value);
    if (!dateTime)
        return null;
    return new DateFormatter(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(dateTime.toDate(getLocalTimeZone()));
}
//# sourceMappingURL=version-model.js.map