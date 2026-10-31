# Notification Center

`NotificationList` is a notification inbox: a filter between all and unread notifications, Mark all as read, the notifications grouped by day as [List Row](LIST-ROW.md) rows the reader opens, marks read or unread and dismisses, [Load More](LOAD-MORE.md), an [Empty State](EMPTY-STATE.md) and a polite announcement of the notifications that arrive. `NotificationCenter` is a bell [Icon Button](BUTTON.md) with the unread count in a [Badge](BADGE.md) that opens the list in a [Popover](POPOVER.md), or in a [Drawer](DRAWER.md) on narrow screens. A full-page inbox renders `NotificationList` on its own.

Each notification is plain data: `id`, a one-line `title`, an optional `description`, the `actor` who caused it (an avatar identity), an `icon` used when there is no actor, its `time` (an ISO 8601 date and time), the `href` it leads to and `isRead`. The caller owns loading, reading and dismissing: the list reports what the reader asks for and draws the items it is given.

## UIC-NOTIFICATION-CENTER-1 - Notification list

### UIC-NOTIFICATION-CENTER-1.1 - Rows

`NotificationList` shall render a `ui-notification-list` `<div>` drawing each shown notification as a `ListRow` that also carries `ui-notification-list__item`: the `title` as its title, the actor's decorative small `Avatar` (`ui-notification-list__actor`) as its leading media, or the `icon` when there is no actor, and a `MetaLine` of the actor's name, the `description` and a `RelativeTime` of `time` (`ui-notification-list__time`, read against `getNow`, without a tooltip of its own because the row's control holds it). A notification with `href` is a link row; without one it is a button row while the list has `onAction`, and a read-only row otherwise. Opening a row, by link or button, calls `onAction` with its `id`.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/notification-center/notification-list.tsx`, `src/components/notification-center/notification-row.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.2 - Grouped by day

The rows shall be grouped by the calendar day of their `time` (today read from the provider's clock and time zone, and every day headed by its date on a server and while hydrating), each day a `ui-notification-list__group` `<section>` publishing `data-day` (the day as `YYYY-MM-DD`) and starting with a `ui-notification-list__group-title` heading, which reads the provider's relative words for today and yesterday (`Today`, `Yesterday`) and the weekday, month and day for older days, with the year when it is not the current one. Each group holds a divided `List` (`ui-notification-list__list`) named by the heading; the section itself stays unnamed, so a page holding several lists repeats no day landmark. Groups follow the order of their first notification and keep the given order inside, so items given newest first read newest first; notifications whose time cannot be read share a last group reading the provider's `earlier` string, without `data-day`. The heading's level is one below the enclosing section's, else 3.

Implementation: `src/components/notification-center/notification-list.tsx`, `src/components/notification-center/group-by-day.ts`, `src/utils/calendar-day.ts`
Verification: `src/components/notification-center/notification-list.test.tsx`, `src/components/notification-center/group-by-day.test.ts`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.3 - Unread notifications

Each row whose notification is not read shall publish `data-unread` and show an `info` dot `Badge` (`ui-notification-list__unread`) that assistive technology reads as the provider's `unread` string.

Implementation: `src/components/notification-center/notification-row.tsx`, `src/core/strings/content.ts`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.4 - Row actions

With `onReadChange`, each row shall end with an `Button` (`ui-notification-list__read-toggle`) named and hinted by the provider's `markRead` string with the `envelope-open` glyph while unread, or `markUnread` with the `envelope` glyph while read, which calls `onReadChange(id, isRead)` with the opposite state. With `onDismiss`, a `close` `Button` (`ui-notification-list__dismiss`) named by the provider's `dismiss` string calls `onDismiss(id)`. `renderActions(item)` draws the caller's controls for a notification, such as Accept and Decline, in `ui-notification-list__item-actions` before them. These controls follow the row's link or button, never inside it. When a row leaves the list while focus is inside it, such as after a dismissal or a read toggle under the unread filter, focus shall move to the same control of the next row, else of the previous row (across days), else to the filter's chosen option, so it never falls to the page.

Implementation: `src/components/notification-center/notification-row.tsx`, `src/components/notification-center/use-removal-focus.ts`, `src/core/glyphs.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.5 - Filter

The `ui-notification-list__toolbar` shall start with a small `SegmentedChoice` (`ui-notification-list__filter`) named by the provider's `notificationFilter` string, offering All (`allNotifications`) and Unread (`unread`) with the unread count: `unreadCount`, or the number of unread `items` without it. `filter` (controlled) or `defaultFilter` (`all` by default) picks which notifications show, `unread` showing only those not read; `onFilterChange` receives the reader's pick, and the root publishes `data-filter`.

Implementation: `src/components/notification-center/notification-list.tsx`, `src/core/strings/content.ts`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.6 - Mark all read and caller controls

With `onMarkAllRead`, the toolbar shall show a small ghost button (`ui-notification-list__mark-all-read`) reading the provider's `markAllRead` string that calls it, disabled while the unread count is 0. `actions` render after it in `ui-notification-list__actions`, for controls such as a link to notification settings.

Implementation: `src/components/notification-center/notification-list.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.7 - Empty and loading

While no notification shows, the list shall show a small `EmptyState` (`ui-notification-list__empty`): the loading state reading the provider's `loading` string while `isLoading`, else the `bell` glyph with `noUnreadNotifications` and `unreadNotificationsEmpty` under the unread filter, or `noNotifications` and `notificationsEmpty`. The root carries `aria-busy="true"` while `isLoading`.

Implementation: `src/components/notification-center/notification-list.tsx`, `src/core/strings/content.ts`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.8 - Loading more

With `hasMore` and at least one row shown, the list shall end with a `LoadMore` (`ui-notification-list__load-more`) that calls `onLoadMore` when pressed and each time it comes into view (`autoLoad`), pending while `isLoading` or while the promise `onLoadMore` returns is unsettled.

Implementation: `src/components/notification-center/notification-list.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-1.9 - List hooks and caller attributes

`NotificationList` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/notification-center/notification-list.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`

## UIC-NOTIFICATION-CENTER-2 - Notification centre

### UIC-NOTIFICATION-CENTER-2.1 - Bell

`NotificationCenter` shall render a `ui-notification-center` `<span>` holding a `bell` `Button` (`ui-notification-center__trigger`) named by the provider's `notificationsWithCount` string for the unread count (`Notifications, 3 unread`, or `Notifications` with none), and an overlay `info` count `Badge` (`ui-notification-center__count`) of that count, capped at `countMax` (99 by default), hidden from assistive technology because the bell's name carries the count, and absent while the count is 0. The count is `unreadCount`, or the number of unread `items`.

Implementation: `src/components/notification-center/notification-center.tsx`, `src/core/strings/content.ts`, `src/core/glyphs.tsx`
Verification: `src/components/notification-center/notification-center.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-2.2 - Panel

Pressing the bell shall open a `NotificationList` with every list prop of the centre in a `Popover` (`ui-notification-center__panel`) placed at `placement` (`bottom end` by default), or with `presentation="drawer"` in a small `Drawer` from the end edge with a close button, for narrow screens. The panel's heading, which names its dialog, is `title`, else the provider's `notifications` string. `isOpen` (controlled), `defaultOpen` and `onOpenChange` control it. Focus moves into the panel on open; Escape and an outside press close it and return focus to the bell. The root publishes `data-presentation` and `data-open`.

Implementation: `src/components/notification-center/notification-center.tsx`
Verification: `src/components/notification-center/notification-center.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-2.3 - Centre hooks and caller attributes

`NotificationCenter` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its root, not on the list inside its panel.

Implementation: `src/components/notification-center/notification-center.tsx`
Verification: `src/components/notification-center/notification-center.test.tsx`

## UIC-NOTIFICATION-CENTER-3 - Accessibility

### UIC-NOTIFICATION-CENTER-3.1 - Announcing arrivals

A visually hidden polite status (`ui-notification-list__announcement`) shall announce the unread notifications that appear in `items` and are newer than every notification shown before: one by the provider's `newNotifications` string with its title (`New notification: …`), several by their count. Notifications present at first, the first page a list that started empty receives, older pages loaded later and notifications already read are not announced. With `announcesArrivals={false}` the list renders no status and keeps no arrival record, for a host that announces them elsewhere. `NotificationCenter` announces in its own status (`ui-notification-center__announcement`) whether its panel is open or not, and the list inside its panel takes `announcesArrivals={false}`, so one status per centre announces each arrival.

Implementation: `src/components/notification-center/arrival-announcement.tsx`, `src/components/notification-center/notification-list.tsx`, `src/components/notification-center/notification-center.tsx`, `src/core/strings/content.ts`
Verification: `src/components/notification-center/notification-list.test.tsx`, `src/components/notification-center/notification-center.test.tsx`, `e2e/notification-center.spec.ts`

### UIC-NOTIFICATION-CENTER-3.2 - Keyboard

Each day's `List` shall be one tab stop whose rows the arrow keys move between ([UIC-LIST-ROW-1.3](LIST-ROW.md#uic-list-row-13---arrow-navigation)); the row actions are ordinary buttons after each row's control, and the filter and toolbar buttons come first.

Implementation: `src/components/notification-center/notification-list.tsx`, `src/components/list-row/list-row.tsx`
Verification: `src/components/notification-center/notification-list.test.tsx`, `e2e/notification-center.spec.ts`

## Hooks

| Hook                                   | Kind      | Values              | Description                                              |
| -------------------------------------- | --------- | ------------------- | -------------------------------------------------------- |
| `ui-notification-list`                 | root      |                     | The inbox (`<div>`).                                     |
| `ui-notification-list__toolbar`        | slot      |                     | The filter, Mark all as read and the caller's controls.  |
| `ui-notification-list__filter`         | slot      |                     | All or Unread (also `ui-segmented-choice`).              |
| `ui-notification-list__mark-all-read`  | slot      |                     | The Mark all as read button (also `ui-button`).          |
| `ui-notification-list__actions`        | slot      |                     | The caller's toolbar controls.                           |
| `ui-notification-list__group`          | slot      |                     | One day's notifications (`<section>`).                   |
| `ui-notification-list__group-title`    | slot      |                     | The day's heading.                                       |
| `ui-notification-list__list`           | slot      |                     | The day's rows (also `ui-list`).                         |
| `ui-notification-list__item`           | slot      |                     | One notification (also `ui-list-row`).                   |
| `ui-notification-list__actor`          | slot      |                     | The actor's avatar (also `ui-avatar`).                   |
| `ui-notification-list__time`           | slot      |                     | When it happened (also `ui-relative-time`).              |
| `ui-notification-list__unread`         | slot      |                     | The unread dot (also `ui-badge`).                        |
| `ui-notification-list__item-actions`   | slot      |                     | The caller's controls for one notification.              |
| `ui-notification-list__read-toggle`    | slot      |                     | Mark as read or unread (also `ui-button`).               |
| `ui-notification-list__dismiss`        | slot      |                     | Dismiss (also `ui-button`).                              |
| `ui-notification-list__empty`          | slot      |                     | The empty or loading state (also `ui-empty-state`).      |
| `ui-notification-list__load-more`      | slot      |                     | Load more (also `ui-load-more`).                         |
| `ui-notification-list__announcement`   | slot      |                     | The polite status announcing arrivals (visually hidden). |
| `ui-notification-center`               | root      |                     | The bell and its count (`<span>`).                       |
| `ui-notification-center__trigger`      | slot      |                     | The bell (also `ui-button`).                             |
| `ui-notification-center__count`        | slot      |                     | The unread count over the bell (also `ui-badge`).        |
| `ui-notification-center__panel`        | slot      |                     | The popover or drawer holding the list.                  |
| `ui-notification-center__announcement` | slot      |                     | The polite status announcing arrivals (visually hidden). |
| `data-filter`                          | state     | `all`, `unread`     | Which notifications show (on the list).                  |
| `data-day`                             | state     |                     | A group's day as `YYYY-MM-DD` (on a group).              |
| `data-unread`                          | state     | `true`              | The notification is not read (on a row).                 |
| `data-presentation`                    | attribute | `popover`, `drawer` | How the centre opens its list (on the centre).           |
| `data-open`                            | state     | `true`              | While the centre's panel is open.                        |
