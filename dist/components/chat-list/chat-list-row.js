import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GridListItem, Text, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { capitalizeText, describeRelativeTime } from '../../utils/relative-time.js';
import { Avatar } from '../avatar/avatar.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { Badge } from '../badge/badge.js';
import { Icon } from '../icon/icon.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { TextMatch } from '../text-match/text-match.js';
export const listHooks = createHooks('chat-list', [
    'header',
    'search',
    'new',
    'list',
    'conversation',
    'avatar',
    'title',
    'time',
    'preview',
    'muted',
    'unread',
    'actions',
    'empty',
    'skeleton',
]);
/** The time as the row shows it, for the row's name. */
function useTimeText(value, getNow) {
    const { locale } = useLocale();
    const text = value
        ? describeRelativeTime(value, { now: getNow(), locale, fallbackAfterDays: 7 })
        : null;
    if (!text)
        return undefined;
    return text.isRelative ? capitalizeText(text.relative, locale) : text.relative;
}
/** The conversation's own avatar, its one participant with presence, or its participants' stack. */
function ConversationAvatar({ conversation }) {
    const { avatar, participants = [] } = conversation;
    const [first] = participants;
    if (avatar)
        return _jsx(Avatar, { ...avatar, size: "md", decorative: true });
    if (participants.length > 1)
        return _jsx(AvatarGroup, { people: participants, size: "sm", maxVisible: 2 });
    if (!first)
        return _jsx(Avatar, { name: conversation.title, size: "md", decorative: true });
    const { id: _id, presence, presenceLabel, ...identity } = first;
    return _jsx(Avatar, { ...identity, status: presence, statusLabel: presenceLabel, size: "md" });
}
/**
 * One conversation: its avatar, title, relative time, last message, muted mark, unread count and
 * the host's actions. The row is named by its title, presence, unread count, muted state and time,
 * then the last message.
 */
export function ChatListRow({ conversation, renderActions, getNow }) {
    const strings = useUiStrings();
    const { title, lastMessage, time, isMuted = false, participants = [] } = conversation;
    const unread = normalizeCount(conversation.unreadCount) ?? 0;
    const timeText = useTimeText(time, getNow);
    const presence = conversation.avatar ? undefined : participants[0]?.presenceLabel?.trim();
    const actions = renderActions?.(conversation);
    const label = strings.conversationLabel({
        title,
        presence: participants.length === 1 ? presence || undefined : undefined,
        unreadCount: unread,
        isMuted,
        time: timeText,
    });
    return (_jsxs(GridListItem, { id: conversation.id, textValue: title, "aria-label": label, ...listHooks.slot('conversation', { unread: unread > 0, muted: isMuted }), children: [_jsx("span", { ...listHooks.slot('avatar'), "aria-hidden": "true", children: _jsx(ConversationAvatar, { conversation: conversation }) }), _jsx("span", { ...listHooks.slot('title'), children: _jsx(TextMatch, { children: title }) }), time ? (_jsx(RelativeTime, { value: time, getNow: getNow, showTooltip: false, className: listHooks.slotClass('time') })) : null, lastMessage ? (_jsx(Text, { slot: "description", className: listHooks.slotClass('preview'), children: _jsx(TextMatch, { children: lastMessage }) })) : null, isMuted ? (_jsx(Icon, { glyph: "bell-slash", label: strings.conversationMuted, className: listHooks.slotClass('muted') })) : null, unread > 0 ? (_jsx(Badge, { count: unread, max: 99, size: "sm", "aria-label": strings.unreadMessages(unread), className: listHooks.slotClass('unread') })) : null, actions ? _jsx("div", { ...listHooks.slot('actions'), children: actions }) : null] }));
}
//# sourceMappingURL=chat-list-row.js.map