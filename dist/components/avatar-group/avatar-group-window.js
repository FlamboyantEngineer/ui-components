import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys } from '../../utils/stable-keys.js';
import { getDisplayName } from '../avatar/avatar.js';
function wholeCount(value) {
    return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}
export function windowPeople({ people, maxVisible, overflowCount, }) {
    const limit = maxVisible === undefined || !Number.isFinite(maxVisible)
        ? people.length
        : wholeCount(maxVisible);
    const keyed = assignOccurrenceKeys(people, (person) => person.id);
    const hidden = keyed.slice(limit);
    return {
        visible: keyed.slice(0, limit),
        hidden,
        overflow: hidden.length + wholeCount(overflowCount),
    };
}
/** The group's name and the overflow's name, with blank names read as the `unnamed` string. */
export function usePresenceLabels({ people, hiddenNames = [], ariaLabel, hidden, overflow, }) {
    const strings = useUiStrings();
    const displayName = (person) => getDisplayName(person.name, strings.unnamed);
    const extraNames = hiddenNames.map((name) => name.trim()).filter(Boolean);
    const allNames = [...people.map(displayName), ...extraNames];
    return {
        group: ariaLabel?.trim() || allNames.join(', ') || strings.morePeople(overflow, []),
        overflow: strings.morePeople(overflow, [
            ...hidden.map(({ value }) => displayName(value)),
            ...extraNames,
        ]),
    };
}
//# sourceMappingURL=avatar-group-window.js.map