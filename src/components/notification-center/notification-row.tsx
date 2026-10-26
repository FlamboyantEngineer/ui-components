import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, type AvatarIdentity } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';
import type { IconSource } from '../icon/icon.js';
import { Button } from '../button/button.js';
import { ListRow } from '../list-row/list-row.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { RelativeTime } from '../relative-time/relative-time.js';

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
function RowTrailing({
  item,
  actions,
}: {
  item: NotificationItem;
  actions: NotificationRowActions;
}) {
  const strings = useUiStrings();
  const { onReadChange, onDismiss, renderActions } = actions;
  const isRead = item.isRead ?? false;
  const readLabel = isRead ? strings.markUnread : strings.markRead;
  return (
    <>
      {isRead ? null : (
        <Badge
          variant="dot"
          tone="info"
          aria-label={strings.unread}
          className={hooks.slotClass('unread')}
        />
      )}
      {renderActions ? <span {...hooks.slot('item-actions')}>{renderActions(item)}</span> : null}
      {onReadChange ? (
        <Button
          icon={isRead ? 'envelope' : 'envelope-open'}
          label={readLabel}
          tooltip={readLabel}
          size="sm"
          className={hooks.slotClass('read-toggle')}
          onPress={() => onReadChange(item.id, !isRead)}
        />
      ) : null}
      {onDismiss ? (
        <Button
          icon="close"
          label={strings.dismiss}
          tooltip={strings.dismiss}
          size="sm"
          className={hooks.slotClass('dismiss')}
          onPress={() => onDismiss(item.id)}
        />
      ) : null}
    </>
  );
}

/**
 * One notification as a `ListRow`: the actor's avatar or the icon, the title, a meta line of actor,
 * description and time, and the trailing controls. A row with `href` is a link; without one it is
 * a button while the list has `onAction`.
 */
export function NotificationRow({
  item,
  actions,
}: {
  item: NotificationItem;
  actions: NotificationRowActions;
}) {
  const { onAction, getNow } = actions;
  const actor = item.actor;
  return (
    <ListRow
      {...hooks.slot('item', { unread: !item.isRead })}
      title={item.title}
      leading={
        actor ? (
          <Avatar {...actor} size="sm" decorative className={hooks.slotClass('actor')} />
        ) : undefined
      }
      icon={actor ? undefined : item.icon}
      meta={
        <MetaLine
          items={[
            actor?.name,
            item.description,
            // The row's link or button holds the time, so it takes no tooltip tab stop of its own.
            <RelativeTime
              key="time"
              value={item.time}
              getNow={getNow}
              showTooltip={false}
              className={hooks.slotClass('time')}
            />,
          ]}
        />
      }
      href={item.href}
      onPress={onAction ? () => onAction(item.id) : undefined}
      trailing={<RowTrailing item={item} actions={actions} />}
    />
  );
}
