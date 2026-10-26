import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import type { IconSource } from '../icon/icon.js';
/** One notification: what happened, who did it, when, and where it leads. */
export interface NotificationItem {
    /** Identifies the notification. */
    id: Key;
    /** What happened, in one line. It also names the row in announcements. */
    title: string;
    /** More about it, on the meta line after the actor. */
    description?: string | undefined;
    /** Who did it: their avatar leads the row and their name starts the meta line. */
    actor?: AvatarIdentity | undefined;
    /** A decorative glyph or icon node that leads the row when there is no actor. */
    icon?: IconSource;
    /** When it happened: an ISO 8601 date and time. */
    time: string;
    /** Where it leads: the row is a link to it. */
    href?: string | undefined;
    /** Whether the reader has read it. */
    isRead?: boolean | undefined;
}
/** What a row does when the reader acts on it, shared by every row of a list. */
export interface NotificationRowActions {
    onAction?: ((key: Key) => void) | undefined;
    onReadChange?: ((key: Key, isRead: boolean) => void) | undefined;
    onDismiss?: ((key: Key) => void) | undefined;
    renderActions?: ((item: NotificationItem) => ReactNode) | undefined;
    getNow?: (() => Date) | undefined;
}
export declare const notificationListHooks: import("../../core/hooks.js").ComponentHooks<"time" | "filter" | "empty" | "dismiss" | "actions" | "unread" | "group" | "list" | "toolbar" | "item" | "load-more" | "announcement" | "actor" | "mark-all-read" | "group-title" | "item-actions" | "read-toggle">;
/**
 * One notification as a `ListRow`: the actor's avatar or the icon, the title, a meta line of actor,
 * description and time, and the trailing controls. A row with `href` is a link; without one it is
 * a button while the list has `onAction`.
 */
export declare function NotificationRow({ item, actions, }: {
    item: NotificationItem;
    actions: NotificationRowActions;
}): import("react").JSX.Element;
//# sourceMappingURL=notification-row.d.ts.map