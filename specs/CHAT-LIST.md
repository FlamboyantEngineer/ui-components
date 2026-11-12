# Chat List

`ChatList` lists conversations to open: an optional New chat row, search field and heading, one row per conversation and an optional Load more row. A row shows its title and only what else the conversation gives: an icon, avatar or participants at its start, the time and text of its last message, a muted mark, the host's status mark, what a participant is doing (typing or working) and an unread count. A chat history passes titles alone; a list of people's conversations adds avatars, last messages and counts. One conversation is selected at a time. Rows hold no controls: the host's commands for a conversation live in its context menu ([UIC-CHAT-LIST-2](#uic-chat-list-2---row-menus)). The rows are a React Aria grid list, which keeps the list one tab stop and moves between rows with the arrow keys.

## UIC-CHAT-LIST-1 - List

### UIC-CHAT-LIST-1.1 - Parts

`ChatList` shall render a `ui-chat-list` root holding, given `onNew` or `showSearch`, a header (`ui-chat-list__header`) with, given `onNew`, a New chat button (`ui-chat-list__new`) and below it, given `showSearch`, a [Search Field](SEARCH-FIELD.md) (`ui-chat-list__search`); then a body (`ui-chat-list__body`) holding, given a `heading`, the heading (`ui-chat-list__heading`), a React Aria grid list (`ui-chat-list__list`, `role="grid"`) and, given `onLoadMore`, the Load more row ([UIC-CHAT-LIST-1.11](#uic-chat-list-111---load-more)). The grid list is named by `aria-label`, `aria-labelledby`, else the heading, else the provider string `conversations`, and holds one row (`ui-chat-list__conversation`, `role="row"`) per conversation in the order of `conversations`.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-row.tsx`, `src/core/strings/chat-list.ts`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.2 - Rows

Each row shall show, in order: given an `avatar`, participants or an `icon`, a decorative start (`ui-chat-list__avatar`, hidden from assistive technology): the conversation's `avatar`, else its one participant as an [Avatar](AVATAR.md) with their `presence` as its status, else its participants as an [Avatar Group](AVATAR-GROUP.md) of two and a count, else its `icon`; a conversation with none of them has no start; the title (`ui-chat-list__title`); given `time`, an [Attribution](ATTRIBUTION.md) without a person or a tooltip, read against `getNow` (the provider's clock by default) with `fallbackAfterDays` (7 by default) in `timeZone` (`ui-chat-list__time`), the same reading the row's name gives; given `lastMessage`, the last message on one line (`ui-chat-list__preview`); for a muted conversation the `bell-slash` glyph named by the provider string `conversationMuted` (`ui-chat-list__muted`); given a `status`, its `icon` named by its `label` (`ui-chat-list__status`), a mark whose meaning the host chooses, such as the `history` glyph for a conversation with earlier versions; given an `activity`, the words for what a participant is doing right now (such as "Typing" or "Working"), three dots (`ui-chat-list__activity`, each `ui-chat-list__activity-dot`, hidden from assistive technology) that the reference stylesheet pulses in turn and holds still under reduced motion; above zero unread messages, a count [Badge](BADGE.md) capped at 99 (`ui-chat-list__unread`) named by `unreadMessages(count)`. A row carries `data-unread` while it has unread messages and `data-muted` while it is muted. The reference stylesheet keeps the unread count of a row without a last message on its one line.

Implementation: `src/components/chat-list/chat-list-row.tsx`, `src/core/glyphs.tsx`, `labs/reference/chat-list.css`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.3 - Row names

A row shall be named by the provider string `conversationLabel` from its title, the presence of its one participant in words (unless it has its own `avatar`): their `presenceLabel`, or the provider's `presenceStatus` string for their `presence`, its unread count, whether it is muted, its `status` label, its `activity` and its time as the row shows it, followed by its last message. Typing the first letters of a title moves to that row. The time reads as the row shows it ([UIC-RELATIVE-TIME-2.3](RELATIVE-TIME.md)): the stable absolute text on the server and while hydrating, written with runtime-independent spaces ([UIC-INTL-FORMAT-1.3](INTL-FORMAT.md)), then the words against `getNow` (the provider's clock by default) in the reader's time zone, renamed on the shared clock when they change.

Implementation: `src/components/chat-list/chat-list-row.tsx`, `src/core/strings/chat-list.ts`, `src/components/chat-list/chat-list.tsx`, `src/core/clock.ts`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`, `src/components/chat-list/chat-list-server.test.tsx`

### UIC-CHAT-LIST-1.4 - Selection

One conversation shall be selected at a time (`aria-selected`, `data-selected`): a press, Enter or Space on a row selects it and calls `onSelectionChange` with its id, and pressing the selected row keeps it selected. `selectedKey` controls the selection (`null` for none); left out, the list keeps the reader's choice.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.5 - Keyboard

The grid list shall be one stop in the Tab sequence, entering on the selected or last focused row. Up and Down move focus between rows without selecting, Home and End move to the first and last row, and Page Up and Page Down move by a page.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.6 - Search

Given `showSearch`, the list shall show a search field named and hinted by the provider string `searchConversations`; without it, the list has no search. Without `onSearchChange`, the list keeps the conversations whose title or last message contains the search text, ignoring case and accents, and marks the matching text ([Text Match](TEXT-MATCH.md)). With `onSearchChange`, it reports each change, shows `conversations` as given and still marks the matching text.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-row.tsx`, `src/components/chat-list/chat-list-parts.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.7 - New chat

The New chat button shall show the `plus` glyph and the provider string `newChat`, and call `onNew` when pressed.

Implementation: `src/components/chat-list/chat-list-parts.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`

### UIC-CHAT-LIST-1.8 - Loading

While `isLoading`, the root shall carry `data-loading` and nothing in the list is marked busy (`aria-busy`), since the rows are replaced and a busy ancestor would hold back the status; four placeholder rows (`ui-chat-list__skeleton`, each a line of [Skeleton](SKELETON.md) text) stand in for the rows, no Load more row shows, with a status reading the provider string `loadingConversations`.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-parts.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.9 - Empty

A list without rows that is not loading shall show `ui-chat-list__empty` inside the grid list: the provider string `noMatchingConversations` while the search text is not blank, otherwise `emptyState` or, by default, an [Empty State](EMPTY-STATE.md) reading the provider string `noConversations`.

Implementation: `src/components/chat-list/chat-list-parts.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.10 - Hooks and caller attributes

`ChatList` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the grid list.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`

### UIC-CHAT-LIST-1.11 - Load more

Given `onLoadMore`, and while not loading, a [Load More](LOAD-MORE.md) row (`ui-chat-list__load-more`, a `ghost` button reading the provider string `loadMore`) shall follow the rows and call `onLoadMore` when pressed, pending while a promise it returns settles; the root carries `data-has-more` meanwhile, by which the reference stylesheet fades the last two rows to hint that the list goes on. The host leaves `onLoadMore` out once nothing is left to load.

Implementation: `src/components/chat-list/chat-list.tsx`, `labs/reference/chat-list.css`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.12 - Heading

Given a `heading`, the list shall show it above the rows (`ui-chat-list__heading`) and name the grid list by it (`aria-labelledby`), unless `aria-label` or `aria-labelledby` names the list.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

## UIC-CHAT-LIST-2 - Row menus

### UIC-CHAT-LIST-2.1 - Opening a row's menu

Given `renderContextMenu`, a secondary click or a long touch on a row shall open a [Context Menu](CONTEXT-MENU.md) at the pointer, and the Context Menu key or Shift+F10 with focus on the row or a control inside it (not a text control) shall open it below the row, showing the `Menu` that `renderContextMenu` returns for that row's conversation and named by the provider string `conversationMenu` with its title. A pointer that opens the menu first moves focus to the row, without selecting it, and focus returns to the row when the menu closes, whether by an action, Escape or a press outside. While the menu is open for a row, the row carries `data-menu-open`. The list opens one menu at a time: opening it for another row moves it there. The list itself handles the keys for its rows, so the host needs no event handlers of its own.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-menu.ts`, `src/components/chat-list/chat-list-row.tsx`, `src/core/strings/chat-list.ts`, `labs/reference/chat-list.css`
Verification: `src/components/chat-list/chat-list-menu.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-2.2 - Rows without a menu

A row whose conversation `renderContextMenu` returns nothing for, and every row without `renderContextMenu`, shall leave the browser's own menu and the keys alone. When the conversation whose menu is open leaves the list, or its menu becomes empty, the menu closes.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-menu.ts`
Verification: `src/components/chat-list/chat-list-menu.test.tsx`

## Hooks

| Hook                         | Kind  | Values     | Description                                                    |
| ---------------------------- | ----- | ---------- | -------------------------------------------------------------- |
| `ui-chat-list`               | root  |            | The list's frame.                                              |
| `ui-chat-list__header`       | slot  |            | The New chat button and the search field.                      |
| `ui-chat-list__search`       | slot  |            | The search field (also `ui-search-field`).                     |
| `ui-chat-list__new`          | slot  |            | The New chat button (also `ui-button`).                        |
| `ui-chat-list__body`         | slot  |            | The heading, the grid list and the Load more row.              |
| `ui-chat-list__heading`      | slot  |            | The heading above the rows, which names the grid list.         |
| `ui-chat-list__list`         | slot  |            | The grid list (`role="grid"`).                                 |
| `ui-chat-list__conversation` | slot  |            | A conversation row (`role="row"`).                             |
| `ui-chat-list__avatar`       | slot  |            | The decorative icon, avatar with presence, or avatar group.    |
| `ui-chat-list__title`        | slot  |            | The title.                                                     |
| `ui-chat-list__time`         | slot  |            | The time of the last message (also `ui-attribution`).          |
| `ui-chat-list__preview`      | slot  |            | The last message, on one line.                                 |
| `ui-chat-list__muted`        | slot  |            | The muted mark (also `ui-icon`).                               |
| `ui-chat-list__status`       | slot  |            | The host's status mark (also `ui-icon`).                       |
| `ui-chat-list__activity`     | slot  |            | The dots showing a participant typing or working.              |
| `ui-chat-list__activity-dot` | slot  |            | One of the activity's three dots.                              |
| `ui-chat-list__unread`       | slot  |            | The unread count (also `ui-badge`).                            |
| `ui-chat-list__empty`        | slot  |            | The empty or no-match notice.                                  |
| `ui-chat-list__skeleton`     | slot  |            | A placeholder row while loading.                               |
| `ui-chat-list__load-more`    | slot  |            | The Load more row (also `ui-load-more`, `ui-button`).          |
| `data-loading`               | state | `true`     | On the root: the conversations are loading.                    |
| `data-has-more`              | state | `true`     | On the root: more conversations can load (`onLoadMore`).       |
| `data-unread`                | state | `true`     | On a row: it has unread messages.                              |
| `data-muted`                 | state | `true`     | On a row: its notifications are off.                           |
| `data-menu-open`             | state | `true`     | On a row: its context menu is open.                            |
| `data-selected`              | state | `true`     | On a row: the selected conversation (React Aria).              |
| `data-selection-mode`        | state | `single`   | On a row: the list's selection mode (React Aria).              |
| `data-hovered`               | state | `true`     | On a row: under the pointer (React Aria).                      |
| `data-pressed`               | state | `true`     | On a row: being pressed (React Aria).                          |
| `data-focused`               | state | `true`     | On the grid list or a row: has focus (React Aria).             |
| `data-focus-visible`         | state | `true`     | On the grid list or a row: has keyboard focus (React Aria).    |
| `data-focus-visible-within`  | state | `true`     | On a row: keyboard focus inside it (React Aria).               |
| `data-empty`                 | state | `true`     | On the grid list: it has no rows (React Aria).                 |
| `data-layout`                | state | `stack`    | On the grid list: its layout (React Aria).                     |
| `data-orientation`           | state | `vertical` | On the grid list: its orientation (React Aria).                |
| `data-collection`            | state |            | React Aria's collection marker, on the grid list and its rows. |
| `data-key`                   | state |            | On a row: opaque collection key (React Aria); not for styling. |
