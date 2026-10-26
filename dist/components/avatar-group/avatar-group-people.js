import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Avatar, resolveAvatarColor, splitAvatarIdentity } from '../avatar/avatar.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { AvatarGroupOverflowMenu } from './avatar-group-overflow-menu.js';
const hooks = createHooks('avatar-group', ['avatar', 'dot', 'overflow']);
function AvatarGroupPersonView({ person, onAction, renderCard, ...avatar }) {
    const [identity] = splitAvatarIdentity(person);
    return (_jsx(Avatar, { ...identity, ...avatar, status: person.status, statusLabel: person.statusLabel, className: hooks.slotClass('avatar'), onPress: onAction ? () => onAction(person.id) : undefined, card: renderCard?.(person) }));
}
function AvatarGroupOverflow({ presence: { overflow: count, hidden }, label, overflow, colorCount, onAction, }) {
    if (count === 0)
        return null;
    if (label && overflow === 'menu' && hidden.length > 0) {
        return (_jsx(AvatarGroupOverflowMenu, { count: count, label: label, hidden: hidden, colorCount: colorCount, onAction: onAction }));
    }
    return (_jsx("span", { ...hooks.slot('overflow'), ...(label ? { role: 'img', 'aria-label': label } : {}), children: `+${count}` }));
}
/** The same people and overflow in stacked, spaced or decorative-dot layouts. */
export function AvatarGroupPeople({ presence, labels, layout, isList, overflow, ...avatar }) {
    const isDots = layout === 'dots';
    return (_jsxs(_Fragment, { children: [presence.visible.map(({ key, value }, index) => (_jsxs(Fragment, { children: [isList && index > 0 ? (_jsxs(_Fragment, { children: [_jsx(VisuallyHidden, { elementType: "span", children: "," }), ' '] })) : null, isDots ? (_jsx("span", { ...hooks.slot('dot', { color: resolveAvatarColor(value, avatar.colorCount) }) })) : (_jsx(AvatarGroupPersonView, { ...avatar, person: value, onAction: isList ? undefined : avatar.onAction, renderCard: isList ? undefined : avatar.renderCard, nameTooltip: isList ? false : avatar.nameTooltip }))] }, key))), isList && presence.visible.length > 0 && presence.overflow > 0 ? (_jsxs(_Fragment, { children: [_jsx(VisuallyHidden, { elementType: "span", children: "," }), ' '] })) : null, _jsx(AvatarGroupOverflow, { ...avatar, presence: presence, label: isDots ? undefined : labels.overflow, overflow: isList ? 'count' : overflow })] }));
}
//# sourceMappingURL=avatar-group-people.js.map