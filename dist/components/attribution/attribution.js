import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, getDisplayName } from '../avatar/avatar.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { UserCardTrigger } from '../user-card/user-card.js';
import { isTimeFirst, parseAttributionTemplate } from './attribution-template.js';
const hooks = createHooks('attribution', ['time', 'person', 'avatar', 'name']);
/** The person's avatar and name, as a card trigger when there is a card. */
function AttributionPerson({ person, showAvatar, card, cardTrigger, }) {
    const strings = useUiStrings();
    const content = (_jsxs(_Fragment, { children: [person && showAvatar ? (_jsx(Avatar, { ...person, size: "xs", decorative: true, className: hooks.slotClass('avatar') })) : null, _jsx("span", { ...hooks.slot('name'), children: getDisplayName(person?.name ?? '', strings.unnamed) })] }));
    if (!card)
        return _jsx("span", { ...hooks.slot('person'), children: content });
    return (_jsx(UserCardTrigger, { card: card, trigger: cardTrigger, className: hooks.slotClass('person'), children: content }));
}
/**
 * Who did something and when, as one sentence (`Edited 5 minutes ago by Maria Santos`): literal text
 * from a template, a live `RelativeTime` and the person's name, which can open their card.
 */
export function Attribution({ time, person, template, showAvatar = false, card, cardTrigger, fallbackAfterDays, getNow, className, ...rest }) {
    const strings = useUiStrings();
    const segments = parseAttributionTemplate(template ?? (person ? strings.attribution : '{time}'));
    const capitalize = isTimeFirst(segments);
    return (_jsx("span", { ...rest, ...hooks.root({ className }), children: segments.map((segment) => {
            if (segment.kind === 'text')
                return _jsx(Fragment, { children: segment.text }, segment.offset);
            if (segment.kind === 'person') {
                return (_jsx(AttributionPerson, { person: person, showAvatar: showAvatar, card: card, cardTrigger: cardTrigger }, segment.offset));
            }
            return (_jsx(RelativeTime, { value: time, fallbackAfterDays: fallbackAfterDays, getNow: getNow, capitalize: capitalize, placeholder: strings.unknownTime, className: hooks.slotClass('time') }, segment.offset));
        }) }));
}
//# sourceMappingURL=attribution.js.map