# Chat List

`ChatList` lists conversations to open: a search field, an optional New chat button and one row per conversation with its avatar or participants, title, the time and text of its last message, a muted mark, an unread count and the host's own controls. One conversation is selected at a time. The rows are a React Aria grid list rather than a listbox because a row may hold its own buttons (`renderActions`), which a listbox's options may not contain (WAI-ARIA Authoring Practices, Listbox); the grid list keeps the list one tab stop, moves between rows with the arrow keys and into a row's controls with Left and Right.

## UIC-CHAT-LIST-1 - List

### UIC-CHAT-LIST-1.1 - Parts

`ChatList` shall render a `ui-chat-list` root holding a header (`ui-chat-list__header`) with a [Search Field](SEARCH-FIELD.md) (`ui-chat-list__search`) and, given `onNew`, a New chat button (`ui-chat-list__new`); then a React Aria grid list (`ui-chat-list__list`, `role="grid"`) named by `aria-label`, `aria-labelledby` or else the provider string `conversations`, with one row (`ui-chat-list__conversation`, `role="row"`) per conversation in the order of `conversations`.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-row.tsx`, `src/core/strings/chat-list.ts`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.2 - Rows

Each row shall show, in order: a decorative avatar (`ui-chat-list__avatar`, hidden from assistive technology): the conversation's `avatar`, else its one participant as an [Avatar](AVATAR.md) with their `presence` as its status, else its participants as an [Avatar Group](AVATAR-GROUP.md) of two and a count, else an avatar of the title; the title (`ui-chat-list__title`); given `time`, a [Relative Time](RELATIVE-TIME.md) without a tooltip read against `getNow` (`ui-chat-list__time`); given `lastMessage`, the last message on one line (`ui-chat-list__preview`); for a muted conversation the `bell-slash` glyph named by the provider string `conversationMuted` (`ui-chat-list__muted`); above zero unread messages, a count [Badge](BADGE.md) capped at 99 (`ui-chat-list__unread`) named by `unreadMessages(count)`; then the controls `renderActions` draws for the conversation (`ui-chat-list__actions`). A row carries `data-unread` while it has unread messages and `data-muted` while it is muted.

Implementation: `src/components/chat-list/chat-list-row.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.3 - Row names

A row shall be named by the provider string `conversationLabel` from its title, the presence of its one participant in words (unless it has its own `avatar`): their `presenceLabel`, or the provider's `presenceStatus` string for their `presence`, its unread count, whether it is muted and its time as the row shows it, followed by its last message. Typing the first letters of a title moves to that row.

Implementation: `src/components/chat-list/chat-list-row.tsx`, `src/core/strings/chat-list.ts`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.4 - Selection

One conversation shall be selected at a time (`aria-selected`, `data-selected`): a press, Enter or Space on a row selects it and calls `onSelectionChange` with its id, and pressing the selected row keeps it selected. `selectedKey` controls the selection (`null` for none); left out, the list keeps the reader's choice.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.5 - Keyboard

The grid list shall be one stop in the Tab sequence, entering on the selected or last focused row. Up and Down move focus between rows without selecting, Home and End move to the first and last row, Page Up and Page Down move by a page, and Left and Right move into and out of the row's controls.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.6 - Search

The search field shall be named and hinted by the provider string `searchConversations`. Without `onSearchChange`, the list keeps the conversations whose title or last message contains the search text, ignoring case and accents, and marks the matching text ([Text Match](TEXT-MATCH.md)). With `onSearchChange`, it reports each change, shows `conversations` as given and still marks the matching text.

Implementation: `src/components/chat-list/chat-list.tsx`, `src/components/chat-list/chat-list-row.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.7 - New chat

The New chat button shall show the `plus` glyph and the provider string `newChat`, and call `onNew` when pressed.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`

### UIC-CHAT-LIST-1.8 - Loading

While `isLoading`, the root shall carry `data-loading` and be busy (`aria-busy`), and four placeholder rows (`ui-chat-list__skeleton`, each a circle [Skeleton](SKELETON.md) and two text lines) stand in for the rows, with a status reading the provider string `loadingConversations`.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.9 - Empty

A list without rows that is not loading shall show `ui-chat-list__empty` inside the grid list: the provider string `noMatchingConversations` while the search text is not blank, otherwise `emptyState` or, by default, an [Empty State](EMPTY-STATE.md) reading the provider string `noConversations`.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`, `e2e/chat-list.spec.ts`

### UIC-CHAT-LIST-1.10 - Hooks and caller attributes

`ChatList` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the grid list.

Implementation: `src/components/chat-list/chat-list.tsx`
Verification: `src/components/chat-list/chat-list.test.tsx`

## Hooks

| Hook                         | Kind  | Values     | Description                                                    |
| ---------------------------- | ----- | ---------- | -------------------------------------------------------------- |
| `ui-chat-list`               | root  |            | The list's frame.                                              |
| `ui-chat-list__header`       | slot  |            | The search field and the New chat button.                      |
| `ui-chat-list__search`       | slot  |            | The search field (also `ui-search-field`).                     |
| `ui-chat-list__new`          | slot  |            | The New chat button (also `ui-button`).                        |
| `ui-chat-list__list`         | slot  |            | The grid list (`role="grid"`).                                 |
| `ui-chat-list__conversation` | slot  |            | A conversation row (`role="row"`).                             |
| `ui-chat-list__avatar`       | slot  |            | The decorative avatar, with presence, or avatar group.         |
| `ui-chat-list__title`        | slot  |            | The title.                                                     |
| `ui-chat-list__time`         | slot  |            | The time of the last message (also `ui-relative-time`).        |
| `ui-chat-list__preview`      | slot  |            | The last message, on one line.                                 |
| `ui-chat-list__muted`        | slot  |            | The muted mark (also `ui-icon`).                               |
| `ui-chat-list__unread`       | slot  |            | The unread count (also `ui-badge`).                            |
| `ui-chat-list__actions`      | slot  |            | The host's controls in a row.                                  |
| `ui-chat-list__empty`        | slot  |            | The empty or no-match notice.                                  |
| `ui-chat-list__skeleton`     | slot  |            | A placeholder row while loading.                               |
| `data-loading`               | state | `true`     | On the root: the conversations are loading.                    |
| `data-unread`                | state | `true`     | On a row: it has unread messages.                              |
| `data-muted`                 | state | `true`     | On a row: its notifications are off.                           |
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
