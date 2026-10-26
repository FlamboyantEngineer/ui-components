import type { ReactNode } from 'react';
import type { OpenStateProps, OverlayPositionProps } from '../../core/events.js';
import { type NotificationListProps } from './notification-list.js';
export type { NotificationFilter, NotificationItem, NotificationListProps, } from './notification-list.js';
/** How the list opens: a popover against the bell, or a drawer from the end edge for narrow screens. */
export type NotificationCenterPresentation = 'popover' | 'drawer';
export interface NotificationCenterProps extends NotificationListProps, OpenStateProps, Pick<OverlayPositionProps, 'placement'> {
    /** How the list opens. Defaults to `popover`. */
    presentation?: NotificationCenterPresentation | undefined;
    /** Unread counts above this show as `<max>+` on the bell. Defaults to 99. */
    countMax?: number | undefined;
    /** The panel's heading. Defaults to the provider's `notifications` string. */
    title?: ReactNode;
}
/**
 * A bell button with the unread count that opens a `NotificationList` in a popover or a drawer.
 * The bell's name carries the count, and notifications that arrive are announced politely whether
 * the list is open or not.
 */
export declare function NotificationCenter({ presentation, countMax, title, placement, isOpen: isOpenProp, defaultOpen, onOpenChange, className, id, ...rest }: NotificationCenterProps): import("react").JSX.Element;
//# sourceMappingURL=notification-center.d.ts.map