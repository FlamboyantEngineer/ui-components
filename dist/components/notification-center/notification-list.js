import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { List } from '../list-row/list-row.js';
import { LoadMore } from '../load-more/load-more.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { groupByDay } from './group-by-day.js';
import { NotificationRow, notificationListHooks as hooks, } from './notification-row.js';
import { useArrivalAnnouncement } from './use-arrival-announcement.js';
import { useRemovalFocus } from './use-removal-focus.js';
const currentTime = () => new Date();
function countUnread(items) {
    return items.filter((item) => !item.isRead).length;
}
/** One day: its heading, then a list of its notifications named by the heading. */
function ListGroup({ group, actions }) {
    const headingId = useId();
    const Heading = `h${useHeadingLevel(undefined)}`;
    return (_jsxs("section", { ...hooks.slot('group', { day: group.day || undefined }), children: [_jsx(Heading, { ...hooks.slot('group-title'), id: headingId, children: group.label }), _jsx(List, { divided: true, "aria-labelledby": headingId, className: hooks.slotClass('list'), children: group.items.map((item) => (_jsx(NotificationRow, { item: item, actions: actions }, toKeyIdentity(item.id)))) })] }));
}
/** The filter between all and unread notifications, Mark all as read and the caller's controls. */
function ListToolbar({ filter, onFilterChange, unread, onMarkAllRead, actions, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [_jsx(SegmentedChoice, { "aria-label": strings.notificationFilter, size: "sm", sizing: "content", options: [
                    { value: 'all', label: strings.allNotifications },
                    { value: 'unread', label: strings.unread, count: unread },
                ], value: filter, onChange: (next) => onFilterChange(next === 'unread' ? 'unread' : 'all'), className: hooks.slotClass('filter') }), onMarkAllRead ? (_jsx(Button, { size: "sm", variant: "ghost", isDisabled: unread === 0, className: hooks.slotClass('mark-all-read'), onPress: onMarkAllRead, children: strings.markAllRead })) : null, isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
/** The empty state: loading, nothing at all, or nothing unread. */
function ListEmptyState({ filter, isLoading }) {
    const strings = useUiStrings();
    if (isLoading) {
        return (_jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading, className: hooks.slotClass('empty') }));
    }
    const isUnread = filter === 'unread';
    return (_jsx(EmptyState, { size: "sm", icon: "bell", title: isUnread ? strings.noUnreadNotifications : strings.noNotifications, description: isUnread ? strings.unreadNotificationsEmpty : strings.notificationsEmpty, className: hooks.slotClass('empty') }));
}
/**
 * A notification inbox: a filter between all and unread notifications with Mark all as read, the
 * notifications grouped by day (`Today`, `Yesterday`, then dates) as rows the reader opens, marks
 * read or unread and dismisses, Load more, an empty state, and a polite announcement of the
 * notifications that arrive while it is shown. `NotificationCenter` opens it from a bell.
 */
export function NotificationList({ items, filter: filterProp, defaultFilter = 'all', onFilterChange, unreadCount, onMarkAllRead, actions, hasMore = false, onLoadMore, isLoading = false, onAction, onReadChange, onDismiss, renderActions, getNow = currentTime, className, ...rest }) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const [filter, setFilter] = useControllableState(filterProp, defaultFilter, onFilterChange);
    const announcement = useArrivalAnnouncement(items);
    const unread = unreadCount ?? countUnread(items);
    const shown = filter === 'unread' ? items.filter((item) => !item.isRead) : items;
    const groups = groupByDay(shown, {
        getDate: (item) => item.time,
        now: getNow(),
        locale,
        unknownLabel: strings.earlier,
    });
    const rootRef = useRef(null);
    const focusHandlers = useRemovalFocus(rootRef);
    const rowActions = { onAction, onReadChange, onDismiss, renderActions, getNow };
    return (_jsxs("div", { ...rest, ...focusHandlers, ref: rootRef, ...hooks.root({ className, props: rest, data: { filter } }), "aria-busy": isLoading || undefined, children: [_jsx(ListToolbar, { filter: filter, onFilterChange: setFilter, unread: unread, onMarkAllRead: onMarkAllRead, actions: actions }), groups.map((group) => (_jsx(ListGroup, { group: group, actions: rowActions }, group.day))), groups.length === 0 ? _jsx(ListEmptyState, { filter: filter, isLoading: isLoading }) : null, hasMore && groups.length > 0 ? (_jsx(LoadMore, { autoLoad: true, isPending: isLoading, onLoadMore: onLoadMore, className: hooks.slotClass('load-more') })) : null, _jsx(VisuallyHidden, { role: "status", className: hooks.slotClass('announcement'), children: announcement })] }));
}
//# sourceMappingURL=notification-list.js.map