import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { assignOccurrenceKeys } from '../../utils/stable-keys.js';
import { AvatarGroupPeople } from './avatar-group-people.js';
import { AvatarGroupListTrigger } from './avatar-group-list.js';
import { usePresenceLabels, windowPeople } from './avatar-group-window.js';
const hooks = createHooks('avatar-group');
/** One group of identities, including optional presence, cards, commands and overflow. */
export function AvatarGroup({ people, maxVisible, overflowCount, hiddenNames, layout = 'stack', size = 'md', variant, colorCount, onAction, renderCard, overflow = 'count', nameTooltip, cardTrigger, action = 'none', 'aria-label': ariaLabel, className, ...rest }) {
    const presence = windowPeople({ people, maxVisible, overflowCount });
    const labels = usePresenceLabels({
        people,
        hiddenNames,
        ariaLabel,
        hidden: presence.hidden,
        overflow: presence.overflow,
    });
    if (presence.visible.length === 0 && presence.overflow === 0)
        return null;
    const content = (_jsx(AvatarGroupPeople, { presence: presence, labels: labels, layout: layout, size: size, variant: variant, colorCount: colorCount, onAction: onAction, renderCard: renderCard, overflow: overflow, nameTooltip: nameTooltip, cardTrigger: cardTrigger, isList: action === 'list' }));
    return (_jsx("span", { ...rest, ...hooks.root({ className, data: { layout, size, overflow, action } }), ...(layout === 'dots'
            ? { 'aria-hidden': true }
            : { role: 'group', 'aria-label': labels.group }), children: action === 'list' && layout !== 'dots' ? (_jsx(AvatarGroupListTrigger, { people: assignOccurrenceKeys(people, (person) => person.id), colorCount: colorCount, children: content })) : (content) }));
}
//# sourceMappingURL=avatar-group.js.map