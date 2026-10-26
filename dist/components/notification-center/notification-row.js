import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { ListRow } from '../list-row/list-row.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { RelativeTime } from '../relative-time/relative-time.js';
export const notificationListHooks = createHooks('notification-list', [
    'toolbar',
    'filter',
    'mark-all-read',
    'actions',
    'group',
    'group-title',
    'list',
    'item',
    'actor',
    'time',
    'unread',
    'item-actions',
    'read-toggle',
    'dismiss',
    'empty',
    'load-more',
    'announcement',
]);
const hooks = notificationListHooks;
/** The row's trailing controls: the unread mark, the caller's actions, read and dismiss buttons. */
function RowTrailing({ item, actions, }) {
    const strings = useUiStrings();
    const { onReadChange, onDismiss, renderActions } = actions;
    const isRead = item.isRead ?? false;
    const readLabel = isRead ? strings.markUnread : strings.markRead;
    return (_jsxs(_Fragment, { children: [isRead ? null : (_jsx(Badge, { variant: "dot", tone: "info", "aria-label": strings.unread, className: hooks.slotClass('unread') })), renderActions ? _jsx("span", { ...hooks.slot('item-actions'), children: renderActions(item) }) : null, onReadChange ? (_jsx(Button, { icon: isRead ? 'envelope' : 'envelope-open', label: readLabel, tooltip: readLabel, size: "sm", className: hooks.slotClass('read-toggle'), onPress: () => onReadChange(item.id, !isRead) })) : null, onDismiss ? (_jsx(Button, { icon: "close", label: strings.dismiss, tooltip: strings.dismiss, size: "sm", className: hooks.slotClass('dismiss'), onPress: () => onDismiss(item.id) })) : null] }));
}
/**
 * One notification as a `ListRow`: the actor's avatar or the icon, the title, a meta line of actor,
 * description and time, and the trailing controls. A row with `href` is a link; without one it is
 * a button while the list has `onAction`.
 */
export function NotificationRow({ item, actions, }) {
    const { onAction, getNow } = actions;
    const actor = item.actor;
    return (_jsx(ListRow, { ...hooks.slot('item', { unread: !item.isRead }), title: item.title, leading: actor ? (_jsx(Avatar, { ...actor, size: "sm", decorative: true, className: hooks.slotClass('actor') })) : undefined, icon: actor ? undefined : item.icon, meta: _jsx(MetaLine, { items: [
                actor?.name,
                item.description,
                _jsx(RelativeTime, { value: item.time, getNow: getNow, showTooltip: false, className: hooks.slotClass('time') }, "time"),
            ] }), href: item.href, onPress: onAction ? () => onAction(item.id) : undefined, trailing: _jsx(RowTrailing, { item: item, actions: actions }) }));
}
//# sourceMappingURL=notification-row.js.map