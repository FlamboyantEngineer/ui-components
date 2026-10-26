import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { chatHeaderHooks as hooks } from './chat-hooks.js';
import { toMessageAuthor } from './chat-model.js';
/** A participant as a person of an avatar group, their presence in words as the second line. */
function toGroupPerson(participant) {
    const [identity, { statusLabel }] = splitAvatarIdentity(toMessageAuthor(participant));
    return { ...identity, id: participant.id, description: statusLabel };
}
/** The other participants' avatars: one with their presence, or a stack that lists everyone. */
function HeaderAvatar({ participants }) {
    const [only] = participants;
    const className = hooks.slotClass('avatar');
    if (!only)
        return null;
    if (participants.length > 1) {
        return (_jsx(AvatarGroup, { people: participants.map(toGroupPerson), maxVisible: 3, size: "sm", action: "list", className: className }));
    }
    const [identity, { status, statusLabel }] = splitAvatarIdentity(toMessageAuthor(only));
    return (_jsx(Avatar, { ...identity, status: status, statusLabel: statusLabel, size: "sm", decorative: !status?.trim(), className: className }));
}
/**
 * The top of a conversation: the other participants' avatars with their presence, the title as a
 * heading at the level its section gives, a line saying who is typing or what the assistant is
 * doing, and the host's controls.
 */
export function ChatHeader({ title, participants = [], status, actions, className, id, ...rest }) {
    const Heading = `h${useHeadingLevel(undefined)}`;
    return (_jsxs("div", { id: id, ...hooks.root({ className, props: rest }), children: [_jsx(HeaderAvatar, { participants: participants }), _jsxs("div", { ...hooks.slot('text'), children: [_jsx(Heading, { ...hooks.slot('title'), children: title }), status ? (_jsx("div", { ...hooks.slot('status'), "aria-hidden": "true", children: status })) : null] }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
//# sourceMappingURL=chat-header.js.map