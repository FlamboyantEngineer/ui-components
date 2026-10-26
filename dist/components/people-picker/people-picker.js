import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useId, useState } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { Combobox, } from '../combobox/combobox.js';
import { UserIdentity } from '../user-identity/user-identity.js';
const hooks = createHooks('people-picker', ['person', 'you', 'avatar']);
const identitySizes = { sm: 'xs', md: 'sm', lg: 'md' };
/** A person as an option: the name as label, and the avatar that the chip draws. */
function toOption(person) {
    const [identity] = splitAvatarIdentity(person);
    return {
        id: person.id,
        label: person.name,
        icon: _jsx(Avatar, { ...identity, size: "xs", decorative: true, className: hooks.slotClass('avatar') }),
        isDisabled: person.isDisabled,
    };
}
/**
 * The people listed before a search, each once: the current user, the known people, then the recent
 * ones under a heading.
 */
function toIdleItems(people, section) {
    const { currentUser, knownPeople = [], recent = [] } = people;
    const known = knownPeople.filter((person) => person.id !== currentUser?.id);
    const listed = new Set([currentUser?.id, ...known.map((person) => person.id)]);
    const others = recent.filter((person) => !listed.has(person.id));
    return [
        ...(currentUser ? [toOption(currentUser)] : []),
        ...known.map(toOption),
        ...(others.length > 0 ? [{ ...section, options: others.map(toOption) }] : []),
    ];
}
/** The caller's loader as the combobox's, remembering every person a search returns. */
function usePeopleSearch(loadItems) {
    const [found, setFound] = useState(() => new Map());
    const load = useCallback(async (query, signal, cursor) => {
        const result = cursor === undefined
            ? await loadItems(query, signal)
            : await loadItems(query, signal, cursor);
        const page = 'items' in result ? result : { items: result };
        if (!signal.aborted) {
            setFound((known) => new Map([...known, ...page.items.map((p) => [p.id, p])]));
        }
        return { items: page.items.map(toOption), cursor: page.cursor };
    }, [loadItems]);
    return { found, load };
}
function PersonRow({ person, isCurrent, size, }) {
    const strings = useUiStrings();
    const [identity, { description, isDisabled, disabledReason }] = splitAvatarIdentity(person);
    return (_jsx(UserIdentity, { ...identity, ...hooks.slot('person', { kind: identity.kind ?? 'person' }), size: size, description: isDisabled && disabledReason ? disabledReason : description, nameSuffix: isCurrent ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('you'), children: strings.currentPerson })] })) : null }));
}
/**
 * A field for choosing one or more people or groups, on `Combobox`: it searches through `loadItems`
 * as the reader types, lists the current user, known and recent people before a search, draws each person
 * with `UserIdentity`, and shows chosen people of a multiple picker as chips with their avatars.
 */
export function PeoplePicker({ loadItems, currentUser, recent = [], knownPeople = [], size = 'md', className, ...rest }) {
    const strings = useUiStrings();
    const sectionId = useId();
    const { found, load } = usePeopleSearch(loadItems);
    const people = new Map(found);
    for (const person of [...recent, ...knownPeople, ...(currentUser ? [currentUser] : [])]) {
        people.set(person.id, person);
    }
    return (_jsx(Combobox, { ...rest, className: mergeClassNames(hooks.className, className), size: size, loadItems: load, items: toIdleItems({ currentUser, knownPeople, recent }, { id: sectionId, title: strings.recentPeople }), renderOption: (option) => {
            const person = people.get(option.id);
            return person ? (_jsx(PersonRow, { person: person, isCurrent: person.id === currentUser?.id, size: identitySizes[size] })) : (option.label);
        } }));
}
//# sourceMappingURL=people-picker.js.map