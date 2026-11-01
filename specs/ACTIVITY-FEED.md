# Activity Feed

`ActivityFeed` is a chronological feed of events: who did what to what and when, with optional detail such as a comment or a [Change List](CHANGE-LIST.md). Entries are grouped under a heading per calendar day (`Today`, `Yesterday`, then dates), a filter slot sits above them, older events load as the end of the feed comes into view, and an empty state stands in when there is nothing to show. It is a semantic list with no interaction of its own; the caller orders, filters and pages the events.

## UIC-ACTIVITY-FEED-1 - Structure

### UIC-ACTIVITY-FEED-1.1 - Feed list

`ActivityFeed` shall render a `<div>` root (`ui-activity-feed`) holding an ordered list (`<ol>`, `ui-activity-feed__list`) with one `ui-activity-feed__entry` (`<li>`) per item of `items`, in the order given.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-1.2 - Entries

Each entry shall hold a decorative `ui-activity-feed__marker` (hidden from assistive technology) drawing the item's `icon` when it has one, else a small avatar of its `person`, else nothing, and a `ui-activity-feed__body` with:

- a `ui-activity-feed__summary` paragraph reading the person's trimmed name (`ui-activity-feed__actor`, the provider's `unnamed` string for a blank name, left out without a person), the `action` (`ui-activity-feed__action`) and the `target` (`ui-activity-feed__target`, left out when empty), separated by spaces;
- the item's `time` as an [Attribution](ATTRIBUTION.md) of the time alone (`ui-activity-feed__time`) read against `getNow` with `fallbackAfterDays` and `timeZone`, an unreadable time reading as the provider's `unknownTime` string;
- the item's `detail` in `ui-activity-feed__detail`, when it has one.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-1.3 - Day groups

With `groupBy="day"` (the default), each run of consecutive items from the same calendar day (`timeZone`, else the provider's, else the browser's, decides today; a server render and its hydration head every day with its date) shall render as a `ui-activity-feed__group` (`<li>`) holding a heading (`ui-activity-feed__day`) and an ordered list of its entries (`ui-activity-feed__entries`) named by that heading. The heading reads `Today`, `Yesterday` or `Tomorrow` as `Intl.RelativeTimeFormat` words them for the locale, capitalized, and the full date (`Tuesday, April 14, 2026`) for other days, read against `getNow`; items whose time cannot be read form runs under the provider's `unknownTime` string, capitalized. The heading level is `headingLevel`, else one below the enclosing section's, else 3. An instant (a time with an offset or a zone) falls on its day in that same time zone, whatever the device's zone, while a floating date and time or a date reads as written. A group is the nth run of its day, not its first entry, so an event added to or removed from a day keeps that day's other entries, with their state and focus, mounted. With `groupBy="none"` the entries sit directly in the list without headings. `groupBy` is published as `data-group-by` on the root.

Implementation: `src/components/activity-feed/activity-feed.tsx`, `src/components/activity-feed/day-groups.ts`, `src/utils/calendar-day.ts`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-1.4 - Filter slot

The `filter` content shall render in `ui-activity-feed__filter` before the list, and nothing renders for empty content. The caller filters `items` itself.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-1.5 - Hooks and caller attributes

`ActivityFeed` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`

## UIC-ACTIVITY-FEED-2 - Loading and empty states

### UIC-ACTIVITY-FEED-2.1 - Loading older events

With `onLoadMore` and at least one entry, a [Load More](LOAD-MORE.md) control with `autoLoad` (`ui-activity-feed__load-more`) shall follow the list and call `onLoadMore` as it comes into view or is pressed ([UIC-COLLECTIONS-1.3](COLLECTIONS.md#uic-collections-13---loading-more-outside-a-collection)); it is pending while `isLoading`. Without `onLoadMore`, which the caller leaves out once there is nothing more, no control renders.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-2.2 - Busy while loading

While `isLoading`, the root shall publish `data-loading` and the list carry `aria-busy="true"`. With no entries, a small loading [Empty State](EMPTY-STATE.md) (a polite status reading the provider's `loading` string) stands in for the list.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-2.3 - Empty feed

With no entries and not loading, the feed shall show what `renderEmptyState` returns, else a small [Empty State](EMPTY-STATE.md) reading the provider's `noActivity` string, in place of the list.

Implementation: `src/components/activity-feed/activity-feed.tsx`, `src/core/strings/history.ts`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

## UIC-ACTIVITY-FEED-3 - Accessibility

### UIC-ACTIVITY-FEED-3.1 - Named list

The list shall be named by `aria-label` or `aria-labelledby`, else by the provider's `activity` string, and carry `aria-describedby` and `aria-details` when given; each day's list is named by its heading.

Implementation: `src/components/activity-feed/activity-feed.tsx`, `src/core/strings/history.ts`
Verification: `src/components/activity-feed/activity-feed.test.tsx`, `e2e/activity-feed.spec.ts`

### UIC-ACTIVITY-FEED-3.2 - Read-only output

The feed shall add no tab stop of its own: its only tab stops are those of its times' tooltips, its load-more control and the content of its filter and details.

Implementation: `src/components/activity-feed/activity-feed.tsx`
Verification: `src/components/activity-feed/activity-feed.test.tsx`

## Hooks

| Hook                          | Kind      | Values        | Description                                                |
| ----------------------------- | --------- | ------------- | ---------------------------------------------------------- |
| `ui-activity-feed`            | root      |               | The feed (`<div>`).                                        |
| `ui-activity-feed__filter`    | slot      |               | The filter controls above the list.                        |
| `ui-activity-feed__list`      | slot      |               | The ordered list of entries or day groups.                 |
| `ui-activity-feed__group`     | slot      |               | One day's group (`<li>`).                                  |
| `ui-activity-feed__day`       | slot      |               | The day's heading.                                         |
| `ui-activity-feed__entries`   | slot      |               | The day's ordered list of entries.                         |
| `ui-activity-feed__entry`     | slot      |               | One event (`<li>`).                                        |
| `ui-activity-feed__marker`    | slot      |               | The decorative glyph or avatar beside the entry.           |
| `ui-activity-feed__body`      | slot      |               | The summary, time and detail.                              |
| `ui-activity-feed__summary`   | slot      |               | Who did what to what (`<p>`).                              |
| `ui-activity-feed__actor`     | slot      |               | The person's name.                                         |
| `ui-activity-feed__action`    | slot      |               | What they did.                                             |
| `ui-activity-feed__target`    | slot      |               | What they did it to.                                       |
| `ui-activity-feed__time`      | slot      |               | When (also `ui-attribution`).                              |
| `ui-activity-feed__detail`    | slot      |               | More about the event, such as a comment.                   |
| `ui-activity-feed__load-more` | slot      |               | The control that loads older events (also `ui-load-more`). |
| `data-group-by`               | attribute | `day`, `none` | Whether entries are grouped by day.                        |
| `data-loading`                | state     | `true`        | While events load.                                         |
