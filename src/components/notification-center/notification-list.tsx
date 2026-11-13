'use client';

import { type ReactNode, useId, useRef } from 'react';
import { useNow, useTimeZone } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import { BellGlyph } from '../../core/glyphs.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { List } from '../list-row/list-row.js';
import { LoadMore } from '../load-more/load-more.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { ArrivalAnnouncement } from './arrival-announcement.js';
import { type DayGroup, groupByDay } from './group-by-day.js';
import {
  type NotificationItem,
  notificationListHooks as hooks,
  NotificationRow,
  type NotificationRowActions,
} from './notification-row.js';
import { useRemovalFocus } from './use-removal-focus.js';

export type { NotificationItem } from './notification-row.js';

/** Which notifications a list shows: every one, or only the unread ones. */
export type NotificationFilter = 'all' | 'unread';

export interface NotificationListProps
  extends RefProps<HTMLDivElement>, BaseProps, NotificationRowActions {
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
  /** Receives a failed `onLoadMore`, a throw or a rejected promise; without it the error is rethrown. */
  onLoadMoreError?: ((error: unknown) => void) | undefined;
  /** Notifications are loading: the empty state reads as loading, and Load more is pending. */
  isLoading?: boolean | undefined;
}

type ListGroupProps = {
  group: DayGroup<NotificationItem>;
  actions: NotificationRowActions;
  isBusy: boolean;
};

function countUnread(items: readonly NotificationItem[]): number {
  return items.filter((item) => !item.isRead).length;
}

/** One day: its heading, then a list of its notifications named by the heading. */
function ListGroup({ group, actions, isBusy }: ListGroupProps) {
  const headingId = useId();
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  return (
    // The section stays unnamed, so a page with several lists does not repeat day landmarks.
    // Only the groups are busy: a busy root would hold back the loading and arrival statuses.
    <section
      {...hooks.slot('group', { day: group.day || undefined })}
      aria-busy={isBusy || undefined}
    >
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
  ref,
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
  onLoadMoreError,
  isLoading = false,
  onAction,
  onReadChange,
  onDismiss,
  renderActions,
  fallbackAfterDays,
  getNow,
  timeZone,
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
    timeZone: useTimeZone(timeZone),
    locale,
    unknownLabel: strings.earlier,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useMergedRefs(rootRef, ref);
  const focusHandlers = useRemovalFocus(rootRef);
  const time = { fallbackAfterDays, getNow, timeZone };
  const rowActions = { onAction, onReadChange, onDismiss, renderActions, ...time };
  return (
    <div
      {...rest}
      {...focusHandlers}
      ref={rootRefs}
      {...hooks.root({ className, props: rest, data: { filter } })}
    >
      <ListToolbar
        filter={filter}
        onFilterChange={setFilter}
        unread={unread}
        onMarkAllRead={onMarkAllRead}
        actions={actions}
      />
      {groups.map((group) => (
        <ListGroup key={group.day} group={group} actions={rowActions} isBusy={isLoading} />
      ))}
      {groups.length === 0 && !hasMore && (isLoading || !(filter === 'unread' && unread > 0)) ? (
        <ListEmptyState filter={filter} isLoading={isLoading} />
      ) : null}
      {/* Rows that the filter hides on loaded pages say nothing of later pages, so Load more stays. */}
      {hasMore ? (
        <LoadMore
          autoLoad
          isPending={isLoading}
          onLoadMore={onLoadMore}
          onError={onLoadMoreError}
          className={hooks.slotClass('load-more')}
        />
      ) : null}
      {announcesArrivals ? (
        <ArrivalAnnouncement items={items} className={hooks.slotClass('announcement')} />
      ) : null}
    </div>
  );
}
