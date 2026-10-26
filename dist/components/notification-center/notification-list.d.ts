import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type NotificationItem, type NotificationRowActions } from './notification-row.js';
export type { NotificationItem } from './notification-row.js';
/** Which notifications a list shows: every one, or only the unread ones. */
export type NotificationFilter = 'all' | 'unread';
export interface NotificationListProps extends BaseProps, NotificationRowActions {
    /** The notifications, newest first. */
    items: readonly NotificationItem[];
    /** Which notifications show (controlled). */
    filter?: NotificationFilter | undefined;
    /** Which notifications show at first. Defaults to `all`. */
    defaultFilter?: NotificationFilter | undefined;
    /** Receives the filter the reader picks, for a caller that loads each filter itself. */
    onFilterChange?: ((filter: NotificationFilter) => void) | undefined;
    /** The number of unread notifications, loaded or not. Defaults to the unread `items`. */
    unreadCount?: number | undefined;
    /** Draws a Mark all as read button that calls this. */
    onMarkAllRead?: (() => void) | undefined;
    /** More controls after the filter, such as a link to notification settings. */
    actions?: ReactNode;
    /** More notifications can be loaded: a Load more control follows the list. */
    hasMore?: boolean | undefined;
    /** Loads the next page. A returned promise keeps Load more pending until it settles. */
    onLoadMore?: (() => void | Promise<unknown>) | undefined;
    /** Notifications are loading: the empty state reads as loading, and Load more is pending. */
    isLoading?: boolean | undefined;
}
/**
 * A notification inbox: a filter between all and unread notifications with Mark all as read, the
 * notifications grouped by day (`Today`, `Yesterday`, then dates) as rows the reader opens, marks
 * read or unread and dismisses, Load more, an empty state, and a polite announcement of the
 * notifications that arrive while it is shown. `NotificationCenter` opens it from a bell.
 */
export declare function NotificationList({ items, filter: filterProp, defaultFilter, onFilterChange, unreadCount, onMarkAllRead, actions, hasMore, onLoadMore, isLoading, onAction, onReadChange, onDismiss, renderActions, getNow, className, ...rest }: NotificationListProps): import("react").JSX.Element;
//# sourceMappingURL=notification-list.d.ts.map