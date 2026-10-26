import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Drawer, DrawerTrigger } from '../drawer/drawer.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { NotificationList } from './notification-list.js';
import { ArrivalAnnouncerContext, useArrivalAnnouncement } from './use-arrival-announcement.js';
const hooks = createHooks('notification-center', ['trigger', 'count', 'panel', 'announcement']);
/**
 * A bell button with the unread count that opens a `NotificationList` in a popover or a drawer.
 * The bell's name carries the count, and notifications that arrive are announced politely whether
 * the list is open or not.
 */
export function NotificationCenter({ presentation = 'popover', countMax = 99, title, placement = 'bottom end', isOpen: isOpenProp, defaultOpen = false, onOpenChange, className, id, ...rest }) {
    const strings = useUiStrings();
    const [dataAttributes, listProps] = splitDataAttributes(rest);
    const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
    const announcement = useArrivalAnnouncement(listProps.items);
    const unread = listProps.unreadCount ?? listProps.items.filter((item) => !item.isRead).length;
    const heading = title ?? strings.notifications;
    const list = (_jsx(ArrivalAnnouncerContext, { value: true, children: _jsx(NotificationList, { ...listProps }) }));
    const bell = (_jsx(Button, { icon: "bell", label: strings.notificationsWithCount(unread), className: hooks.slotClass('trigger') }));
    const openState = { isOpen, onOpenChange: setOpen };
    return (_jsxs("span", { ...dataAttributes, ...hooks.root({ className, data: { presentation } }), "data-open": isOpen ? 'true' : undefined, id: id, children: [presentation === 'drawer' ? (_jsxs(DrawerTrigger, { ...openState, children: [bell, _jsx(Drawer, { title: heading, size: "sm", showCloseButton: true, className: hooks.slotClass('panel'), children: list })] })) : (_jsxs(PopoverTrigger, { ...openState, children: [bell, _jsx(Popover, { title: heading, placement: placement, className: hooks.slotClass('panel'), children: list })] })), _jsx(Badge, { count: unread, max: countMax, showZero: false, placement: "overlay", tone: "info", size: "sm", "aria-hidden": true, className: hooks.slotClass('count') }), _jsx(VisuallyHidden, { elementType: "span", role: "status", className: hooks.slotClass('announcement'), children: announcement })] }));
}
//# sourceMappingURL=notification-center.js.map