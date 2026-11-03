'use client';

import type { RefProps } from '../../core/props.js';
import { BellGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, OverlayPositionProps } from '../../core/events.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Drawer, DrawerTrigger } from '../drawer/drawer.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { NotificationList, type NotificationListProps } from './notification-list.js';
import { ArrivalAnnouncement } from './arrival-announcement.js';

export type {
  NotificationFilter,
  NotificationItem,
  NotificationListProps,
} from './notification-list.js';

/** How the list opens: a popover against the bell, or a drawer from the end edge for narrow screens. */
export type NotificationCenterPresentation = 'popover' | 'drawer';

export interface NotificationCenterProps
  extends
    RefProps<HTMLSpanElement>,
    Omit<NotificationListProps, 'announcesArrivals' | 'ref'>,
    OpenStateProps,
    Pick<OverlayPositionProps, 'placement'> {
  /** How the list opens. Defaults to `popover`. */
  presentation?: NotificationCenterPresentation | undefined;
  /** Unread counts above this show as `<max>+` on the bell. Defaults to 99. */
  countMax?: number | undefined;
  /** The panel's heading. Defaults to the provider's `notifications` string. */
  title?: ReactNode;
}

const hooks = createHooks('notification-center', ['trigger', 'count', 'panel', 'announcement']);

/**
 * A bell button with the unread count that opens a `NotificationList` in a popover or a drawer.
 * The bell's name carries the count, and notifications that arrive are announced politely whether
 * the list is open or not.
 */
export function NotificationCenter({
  ref,
  presentation = 'popover',
  countMax = 99,
  title,
  placement = 'bottom end',
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  className,
  id,
  filter: filterProp,
  defaultFilter = 'all',
  onFilterChange,
  ...rest
}: NotificationCenterProps) {
  const strings = useUiStrings();
  const [dataAttributes, listProps] = splitDataAttributes(rest);
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  const unread = listProps.unreadCount ?? listProps.items.filter((item) => !item.isRead).length;
  const heading = title ?? strings.notifications;
  // The bell announces arrivals whether the panel is open or not, so the list stays silent.
  // The centre owns the filter, so it outlives the panel: closing, reopening or changing the
  // presentation keeps the reader's choice.
  const [filter, setFilter] = useControllableState(filterProp, defaultFilter, onFilterChange);
  const list = (
    <NotificationList
      {...listProps}
      filter={filter}
      onFilterChange={setFilter}
      announcesArrivals={false}
    />
  );
  const bell = (
    <Button
      icon={BellGlyph}
      label={strings.notificationsWithCount(unread)}
      className={hooks.slotClass('trigger')}
    />
  );
  const openState = { isOpen, onOpenChange: setOpen };
  return (
    <span
      ref={ref}
      {...dataAttributes}
      {...hooks.root({ className, data: { presentation, open: isOpen } })}
      id={id}
    >
      {presentation === 'drawer' ? (
        <DrawerTrigger {...openState}>
          {bell}
          <Drawer title={heading} size="sm" showCloseButton className={hooks.slotClass('panel')}>
            {list}
          </Drawer>
        </DrawerTrigger>
      ) : (
        <PopoverTrigger {...openState}>
          {bell}
          <Popover title={heading} placement={placement} className={hooks.slotClass('panel')}>
            {list}
          </Popover>
        </PopoverTrigger>
      )}
      <Badge
        variant="solid"
        count={unread}
        max={countMax}
        showZero={false}
        placement="overlay"
        tone="info"
        size="sm"
        aria-hidden
        className={hooks.slotClass('count')}
      />
      <ArrivalAnnouncement
        items={listProps.items}
        as="span"
        className={hooks.slotClass('announcement')}
      />
    </span>
  );
}
