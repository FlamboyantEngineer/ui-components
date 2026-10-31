'use client';

import { BellGlyph } from '../../core/glyphs.js';
import { useId, useRef, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps } from '../../core/props.js';
import { useNow, useTimeZone } from '../../core/clock.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { List } from '../list-row/list-row.js';
import { LoadMore } from '../load-more/load-more.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { groupByDay, type DayGroup } from './group-by-day.js';
import {
  NotificationRow,
  notificationListHooks as hooks,
  type NotificationItem,
  type NotificationRowActions,
} from './notification-row.js';
import { ArrivalAnnouncement } from './arrival-announcement.js';
import { useRemovalFocus } from './use-removal-focus.js';

export type { NotificationItem } from './notification-row.js';

/** Which notifications a list shows: every one, or only the unread ones. */
export type NotificationFilter = 'all' | 'unread';

export interface NotificationListProps extends BaseProps, NotificationRowActions {
  /** The notifications, newest first. */
  items: readonly NotificationItem[];
  /**
   * Announces the notifications that arrive in a polite status. Defaults to `true`; turn it off
   * where another status already announces them.
   */
  announcesArrivals?: boolean | undefined;
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

type ListGroupProps = { group: DayGroup<NotificationItem>; actions: NotificationRowActions };

function countUnread(items: readonly NotificationItem[]): number {
  return items.filter((item) => !item.isRead).length;
}

/** One day: its heading, then a list of its notifications named by the heading. */
function ListGroup({ group, actions }: ListGroupProps) {
  const headingId = useId();
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  return (
    // The section stays unnamed, so a page with several lists does not repeat day landmarks.
    <section {...hooks.slot('group', { day: group.day || undefined })}>
      <Heading {...hooks.slot('group-title')} id={headingId}>
        {group.label}
      </Heading>
      <List divided aria-labelledby={headingId} className={hooks.slotClass('list')}>
        {group.items.map((item) => (
          <NotificationRow key={toKeyIdentity(item.id)} item={item} actions={actions} />
        ))}
      </List>
    </section>
  );
}

/** The filter between all and unread notifications, Mark all as read and the caller's controls. */
function ListToolbar({
  filter,
  onFilterChange,
  unread,
  onMarkAllRead,
  actions,
}: Pick<NotificationListProps, 'onMarkAllRead' | 'actions'> & {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unread: number;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('toolbar')}>
      <SegmentedChoice
        aria-label={strings.notificationFilter}
        size="sm"
        sizing="content"
        options={[
          { value: 'all', label: strings.allNotifications },
          { value: 'unread', label: strings.unread, count: unread },
        ]}
        value={filter}
        onChange={(next) => onFilterChange(next === 'unread' ? 'unread' : 'all')}
        className={hooks.slotClass('filter')}
      />
      {onMarkAllRead ? (
        <Button
          size="sm"
          variant="ghost"
          isDisabled={unread === 0}
          className={hooks.slotClass('mark-all-read')}
          onPress={onMarkAllRead}
        >
          {strings.markAllRead}
        </Button>
      ) : null}
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </div>
  );
}

/** The empty state: loading, nothing at all, or nothing unread. */
function ListEmptyState({ filter, isLoading }: { filter: NotificationFilter; isLoading: boolean }) {
  const strings = useUiStrings();
  if (isLoading) {
    return (
      <EmptyState
        variant="loading"
        size="sm"
        description={strings.loading}
        className={hooks.slotClass('empty')}
      />
    );
  }
  const isUnread = filter === 'unread';
  return (
    <EmptyState
      size="sm"
      icon={BellGlyph}
      title={isUnread ? strings.noUnreadNotifications : strings.noNotifications}
      description={isUnread ? strings.unreadNotificationsEmpty : strings.notificationsEmpty}
      className={hooks.slotClass('empty')}
    />
  );
}

/**
 * A notification inbox: a filter between all and unread notifications with Mark all as read, the
 * notifications grouped by day (`Today`, `Yesterday`, then dates) as rows the reader opens, marks
 * read or unread and dismisses, Load more, an empty state, and a polite announcement of the
 * notifications that arrive while it is shown. `NotificationCenter` opens it from a bell.
 */
export function NotificationList({
  items,
  announcesArrivals = true,
  filter: filterProp,
  defaultFilter = 'all',
  onFilterChange,
  unreadCount,
  onMarkAllRead,
  actions,
  hasMore = false,
  onLoadMore,
  isLoading = false,
  onAction,
  onReadChange,
  onDismiss,
  renderActions,
  getNow,
  className,
  ...rest
}: NotificationListProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const [filter, setFilter] = useControllableState(filterProp, defaultFilter, onFilterChange);
  const unread = unreadCount ?? countUnread(items);
  const shown = filter === 'unread' ? items.filter((item) => !item.isRead) : items;
  const groups = groupByDay(shown, {
    getDate: (item) => item.time,
    now: useNow(getNow),
    timeZone: useTimeZone(),
    locale,
    unknownLabel: strings.earlier,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const focusHandlers = useRemovalFocus(rootRef);
  const rowActions = { onAction, onReadChange, onDismiss, renderActions, getNow };
  return (
    <div
      {...rest}
      {...focusHandlers}
      ref={rootRef}
      {...hooks.root({ className, props: rest, data: { filter } })}
      aria-busy={isLoading || undefined}
    >
      <ListToolbar
        filter={filter}
        onFilterChange={setFilter}
        unread={unread}
        onMarkAllRead={onMarkAllRead}
        actions={actions}
      />
      {groups.map((group) => (
        <ListGroup key={group.day} group={group} actions={rowActions} />
      ))}
      {groups.length === 0 ? <ListEmptyState filter={filter} isLoading={isLoading} /> : null}
      {hasMore && groups.length > 0 ? (
        <LoadMore
          autoLoad
          isPending={isLoading}
          onLoadMore={onLoadMore}
          className={hooks.slotClass('load-more')}
        />
      ) : null}
      {announcesArrivals ? (
        <ArrivalAnnouncement items={items} className={hooks.slotClass('announcement')} />
      ) : null}
    </div>
  );
}
