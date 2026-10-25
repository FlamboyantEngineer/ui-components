# Chat Transcript

`ChatTranscript` is a conversation log: messages from people, an assistant or the system, oldest first, that follows the latest message as messages arrive and stream in, stops following when the reader scrolls up, and offers a "jump to latest" control. `ChatMessage` is one message: the author's avatar and name, a [Relative Time](RELATIVE-TIME.md), the content, its actions and its status. A [Message Composer](MESSAGE-COMPOSER.md) usually sits below it.

Around the messages sit the conversation parts: `ChatQuote` (a quoted reply), `ChatDateSeparator`, `ChatUnreadDivider`, `ChatTypingIndicator` and `ChatReadReceipts`. `groupChatMessages` turns a host's messages into the sequence to render: date separators, the unread divider and each message with its group position.

## UIC-CHAT-TRANSCRIPT-1 - Transcript

### UIC-CHAT-TRANSCRIPT-1.1 - Log

`ChatTranscript` shall render a `ui-chat-transcript` root holding a [Scroll Region](SCROLL-REGION.md) (`ui-chat-transcript__log`) whose viewport is a focusable `log` (announced politely as messages are added) named by `aria-label`, `aria-labelledby` or else the provider string `conversation`, holding the children (usually `ChatMessage` elements). While there are no children the root publishes `data-empty`, and `emptyState` shows in the log in `ui-chat-transcript__empty`, such as suggested first questions.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.2 - Following the latest message

The log shall start at its latest message and keep it in view as messages arrive or grow while the reader is at the bottom (the Scroll Region's `stickToBottom`, [UIC-SCROLL-REGION-4.4](SCROLL-REGION.md#uic-scroll-region-44---stick-to-bottom)). Scrolling up stops the following, so the reader keeps their place while a reply streams.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/components/scroll-region/use-scroll-edges.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.3 - Jump to latest

While the reader is scrolled away from the bottom, a button (`ui-chat-transcript__jump`, a `Button` with the `arrow-down` glyph named by the provider string `jumpToLatest`) shall show after the log. Pressing it scrolls to the latest message, which follows again, moves focus to the log and hides the button. Scrolling back to the bottom hides it too.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.4 - Hooks and caller attributes

`ChatTranscript` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the log.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

## UIC-CHAT-TRANSCRIPT-2 - Message

### UIC-CHAT-TRANSCRIPT-2.1 - Parts

`ChatMessage` shall render an `<article>` (`ui-chat-message`) with, given an `author`, a decorative small `Avatar` (`ui-chat-message__avatar`) and their name (`ui-chat-message__author`, or the provider's `unnamed` string for a blank name), given a `time`, a `RelativeTime` (`ui-chat-message__time`, read against `getNow`), both in `ui-chat-message__header`; then the children in `ui-chat-message__content` and `actions` in `ui-chat-message__actions`, all inside `ui-chat-message__body`. Without an author or a time there is no header.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.2 - Origin and status

`ChatMessage` shall publish `origin` as `data-origin`: `sent` by the reader, `received` from someone else (the default), or a `system` notice, and `status` as `data-status`: `complete` (the default), `streaming`, `error`, or `cancelled` when the reader stopped it. A streaming message is busy (`aria-busy="true"`), so assistive technology reads it once it completes. A cancelled message keeps its partial content and shows the provider string `chatStopped` (`Stopped`) in `ui-chat-message__stopped`, inside `ui-chat-message__footer` after the content.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.3 - Hooks and caller attributes

`ChatMessage` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

### UIC-CHAT-TRANSCRIPT-2.4 - Name and id

`ChatMessage` shall be named, through `aria-labelledby`, by a `hidden` element holding the provider string `chatMessageLabel` of the author's display name and the time's absolute date and time (the absolute text the time's tooltip shows, [UIC-RELATIVE-TIME-1.3](RELATIVE-TIME.md#uic-relative-time-13---absolute-date)), so the name keeps the author and the time while the header hides them; with neither the article has no name. The `id` is the article's DOM id, by which a transcript finds the message.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.5 - Author presence

An `author` with a presence `status` shall draw a small [Presence Avatar](PRESENCE-AVATAR.md) with that `status` and `statusLabel` in `ui-chat-message__avatar`, named by the author and the status label (`Maria Santos, Away`), in place of the decorative `Avatar`.

Implementation: `src/components/chat-transcript/chat-message-parts.tsx`
Verification: `src/components/chat-transcript/chat-message.test.tsx`

### UIC-CHAT-TRANSCRIPT-2.6 - Grouped messages

`ChatMessage` shall publish `groupPosition` as `data-group-position`: `single` (the default), `first`, `middle` or `last` in a run of messages by one author ([UIC-CHAT-TRANSCRIPT-6.2](#uic-chat-transcript-62---groups)). A `middle` or `last` message has no avatar and no author's name; its header holds only the time, which a stylesheet shows while the message is hovered or holds focus (UIC-CHAT-TRANSCRIPT-2.7), and its name still gives the author and the time (UIC-CHAT-TRANSCRIPT-2.4).

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `labs/reference/chat-transcript.css`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.7 - Hover and focus

`ChatMessage` shall publish `data-hovered` while a pointer rests on it and `data-focus-within` while it or an element inside it has focus, so a stylesheet can show the actions bar and a grouped message's time on hover and on keyboard focus alike. Focus in an overlay a part opened elsewhere in the page, such as an actions menu, does not count; the part keeps its own trigger shown while its overlay is open.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `labs/reference/chat-transcript.css`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.8 - Delivery

A message with `delivery` shall publish it as `data-delivery` (`sending`, `sent`, `delivered`, `read` or `failed`) and show, in its footer, `ui-chat-message__delivery` holding a decorative glyph (`ui-chat-message__delivery-icon`: `clock`, `check`, `success`, `eye` or `error`) and the provider string `chatDelivery` (`Sending`, `Sent`, `Delivered`, `Read`, `Not sent`) in `ui-chat-message__delivery-label`, so the status never depends on colour or shape alone. A `failed` message with `onRetry` and no `error` adds a Retry `Button` (`ui-chat-message__retry`, named by the provider string `retry`) to the footer, which calls `onRetry`.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.9 - Error

A message with `error` shall show `ui-chat-message__error` after the footer, holding the text in a `role="alert"` element and, with `onRetry`, the Retry button (UIC-CHAT-TRANSCRIPT-2.8), which then leaves the footer.

Implementation: `src/components/chat-transcript/chat-message-parts.tsx`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.10 - Edited and deleted

`isEdited` shall show the provider string `edited` in `ui-chat-message__edited` in the footer. `isDeleted` shall publish `data-deleted` and replace the content with the provider string `chatMessageDeleted` (`Message deleted`) in `ui-chat-message__content`, leaving out the quote, the footer, the error, the reactions and the actions; the avatar, the header and the readers stay.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.11 - Quote

A message with `quote` (`ChatQuoteData`: `authorName`, `excerpt`, `messageId`) shall show a `ChatQuote` ([UIC-CHAT-TRANSCRIPT-5.1](#uic-chat-transcript-51---quote)) in `ui-chat-message__quote` before the content. With a `messageId` and `onQuotePress`, the quote is a button that calls `onQuotePress(messageId)`, so the host can jump to the quoted message.

Implementation: `src/components/chat-transcript/chat-message-parts.tsx`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.12 - Reactions and readers

`reactions` (usually a [Reaction Bar](REACTION-BAR.md)) shall render in `ui-chat-message__reactions` after the error and before the actions, and `readers` (usually `ChatReadReceipts`, [UIC-CHAT-TRANSCRIPT-5.5](#uic-chat-transcript-55---read-receipts)) in `ui-chat-message__readers`, last in the body. Each slot renders only with content.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-transcript.spec.ts`

## UIC-CHAT-TRANSCRIPT-5 - Conversation parts

### UIC-CHAT-TRANSCRIPT-5.1 - Quote

`ChatQuote` shall render the quoted message's `authorName` (`ui-chat-quote__author`, the provider's `unnamed` string for a blank name) and `excerpt` (`ui-chat-quote__excerpt`) in a `ui-chat-quote` `<blockquote>`. With `onPress` it is instead a React Aria button named by the provider string `chatQuoteLabel` (`Quote from Ana Lopez: …`, which holds the visible text), calling `onPress` on click, Enter or Space. The composer's reply banner reuses it.

Implementation: `src/components/chat-transcript/chat-quote.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-quote.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-5.2 - Date separator

`ChatDateSeparator` shall render a `ui-chat-date-separator` holding a [Relative Time](RELATIVE-TIME.md) (`ui-chat-date-separator__label`, without a tooltip) for the local day of `date` (a `YYYY-MM-DD` date, or a date and time read as the reader's local day) against `getNow`: `Today`, `Yesterday`, or the full date in the provider's locale (`Saturday, April 18, 2026`). Its words move on at midnight. It has no role, so it may sit between the articles of a feed. An unreadable `date` renders nothing.

Implementation: `src/components/chat-transcript/chat-date-separator.tsx`
Verification: `src/components/chat-transcript/chat-date-separator.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-5.3 - Unread divider

`ChatUnreadDivider` shall render a `ui-chat-unread-divider` holding the provider string `chatNewMessages` (`New messages`) in `ui-chat-unread-divider__label`. It has no role, so it may sit between the articles of a feed.

Implementation: `src/components/chat-transcript/chat-unread-divider.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-unread-divider.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-5.4 - Typing indicator

`ChatTypingIndicator` shall render a `ui-chat-typing-indicator` with `role="status"`, so changes are announced politely, publishing `variant` as `data-variant`. With `typing` (the default) it says who is typing through the provider string `chatTyping` of their display names (`Ana is typing…`, `Ana and Ben are typing…`, `Ana and 2 others are typing…`); with `thinking` it says the assistant (the first name, if any) is working on its reply through `chatThinking` (`Helper is thinking…`, `Thinking…`). The text sits in `ui-chat-typing-indicator__text` after `ui-chat-typing-indicator__dots`, a decorative element holding three `ui-chat-typing-indicator__dot` elements for a stylesheet to animate. With nobody typing it stays mounted, empty, and publishes `data-empty`, so the next change is announced.

Implementation: `src/components/chat-transcript/chat-typing-indicator.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-typing-indicator.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-5.5 - Read receipts

`ChatReadReceipts` shall render an [Avatar Group](AVATAR-GROUP.md) (also carrying `ui-chat-read-receipts`) of the `readers` (each an `id` and avatar identity fields) at size `xs`, showing at most `maxVisible` avatars (3 by default) with a `+N` count, named by the provider string `chatSeenBy` of their display names (`Seen by Ana, Ben and 3 others`). Its avatars form one button that opens a popover listing every reader.

Implementation: `src/components/chat-transcript/chat-read-receipts.tsx`, `src/core/chat-message-strings.ts`
Verification: `src/components/chat-transcript/chat-read-receipts.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-5.6 - Hooks and caller attributes

`ChatQuote`, `ChatDateSeparator`, `ChatUnreadDivider`, `ChatTypingIndicator` and `ChatReadReceipts` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to their roots.

Implementation: `src/components/chat-transcript/chat-quote.tsx`, `src/components/chat-transcript/chat-date-separator.tsx`, `src/components/chat-transcript/chat-unread-divider.tsx`, `src/components/chat-transcript/chat-typing-indicator.tsx`, `src/components/chat-transcript/chat-read-receipts.tsx`
Verification: `src/components/chat-transcript/chat-quote.test.tsx`, `src/components/chat-transcript/chat-date-separator.test.tsx`, `src/components/chat-transcript/chat-unread-divider.test.tsx`, `src/components/chat-transcript/chat-typing-indicator.test.tsx`, `src/components/chat-transcript/chat-read-receipts.test.tsx`

## UIC-CHAT-TRANSCRIPT-6 - Grouping

### UIC-CHAT-TRANSCRIPT-6.1 - Sequence

`groupChatMessages(messages, options)` shall turn messages, oldest first, each with an `id`, an optional `authorId`, a `createdAt` date and time, an optional `isSystem` and an optional `delivery`, into the sequence to render: a `date` item (the day as `YYYY-MM-DD`, keyed `date-<day>`) before the first message of each day, an `unread` item (keyed `unread`) before the message whose id is `options.firstUnreadId`, after that day's `date` item, and a `message` item (keyed by its id) for each message with its `groupPosition`. A message whose `createdAt` cannot be read starts no day.

Implementation: `src/components/chat-transcript/chat-grouping.ts`
Verification: `src/components/chat-transcript/chat-grouping.test.ts`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-6.2 - Groups

Consecutive messages by one author shall form a group while each was written within `options.maxGap` milliseconds (5 minutes by default) of the one before: `first`, any `middle`, then `last`; a message alone is `single`. A date change, the unread divider, a system notice, a message without an author or an unreadable time, and a failed send (`delivery: 'failed'`) each break the group; such a message is `single`.

Implementation: `src/components/chat-transcript/chat-grouping.ts`
Verification: `src/components/chat-transcript/chat-grouping.test.ts`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-6.3 - Local days

Days shall follow the calendar of `options.timeZone` (an IANA time zone, the reader's by default): a `createdAt` with an offset or `Z` is read as that instant, a floating one as wall time in the zone, so two messages either side of midnight in that zone fall on different days even when they are minutes apart.

Implementation: `src/components/chat-transcript/chat-grouping.ts`
Verification: `src/components/chat-transcript/chat-grouping.test.ts`

## Hooks

| Hook                              | Kind      | Values                                           | Description                                                                                     |
| --------------------------------- | --------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `ui-chat-transcript`              | root      |                                                  | The transcript's frame.                                                                         |
| `ui-chat-transcript__log`         | slot      |                                                  | The scrolling log (also `ui-scroll-region`).                                                    |
| `ui-chat-transcript__empty`       | slot      |                                                  | The empty state inside the log.                                                                 |
| `ui-chat-transcript__jump`        | slot      |                                                  | The jump to latest button (also `ui-button`).                                                   |
| `data-empty`                      | state     | `true`                                           | On the transcript: there are no messages.                                                       |
| `ui-chat-message`                 | root      |                                                  | A message (`<article>`).                                                                        |
| `ui-chat-message__avatar`         | slot      |                                                  | The author's avatar (also `ui-avatar`).                                                         |
| `ui-chat-message__body`           | slot      |                                                  | The header, content and actions.                                                                |
| `ui-chat-message__header`         | slot      |                                                  | The author's name and the time.                                                                 |
| `ui-chat-message__author`         | slot      |                                                  | The author's name.                                                                              |
| `ui-chat-message__time`           | slot      |                                                  | The time (also `ui-relative-time`).                                                             |
| `ui-chat-message__content`        | slot      |                                                  | The message's content.                                                                          |
| `ui-chat-message__actions`        | slot      |                                                  | The message's actions.                                                                          |
| `data-origin`                     | attribute | `sent`, `received`, `system`                     | On a message: who it is from, relative to the reader.                                           |
| `data-status`                     | attribute | `complete`, `streaming`, `error`, `cancelled`    | On a message: whether it is complete.                                                           |
| `ui-chat-message__quote`          | slot      |                                                  | The quoted message (also `ui-chat-quote`).                                                      |
| `ui-chat-message__footer`         | slot      |                                                  | The edited and stopped markers and the delivery status, after the content.                      |
| `ui-chat-message__edited`         | slot      |                                                  | The edited marker.                                                                              |
| `ui-chat-message__stopped`        | slot      |                                                  | The stopped marker of a cancelled message.                                                      |
| `ui-chat-message__delivery`       | slot      |                                                  | The delivery status of a message the reader sent.                                               |
| `ui-chat-message__delivery-icon`  | slot      |                                                  | The delivery status glyph (also `ui-glyph`).                                                    |
| `ui-chat-message__delivery-label` | slot      |                                                  | The delivery status words.                                                                      |
| `ui-chat-message__error`          | slot      |                                                  | The error and its Retry button.                                                                 |
| `ui-chat-message__retry`          | slot      |                                                  | The Retry button (also `ui-button`).                                                            |
| `ui-chat-message__reactions`      | slot      |                                                  | The reactions.                                                                                  |
| `ui-chat-message__readers`        | slot      |                                                  | Who has read up to the message.                                                                 |
| `data-group-position`             | attribute | `single`, `first`, `middle`, `last`              | On a message: its place in a run of messages by one author.                                     |
| `data-delivery`                   | attribute | `sending`, `sent`, `delivered`, `read`, `failed` | On a message: where a message the reader sent has got to.                                       |
| `data-deleted`                    | state     | `true`                                           | On a message: it was deleted.                                                                   |
| `data-hovered`                    | state     | `true`                                           | On a message: a pointer rests on it. On a pressable quote: the pointer is over it (React Aria). |
| `data-focus-within`               | state     | `true`                                           | On a message: it or an element inside it has focus.                                             |
| `data-pressed`                    | state     | `true`                                           | On a pressable quote: it is pressed (React Aria).                                               |
| `data-focused`                    | state     | `true`                                           | On a pressable quote: it has focus (React Aria).                                                |
| `data-focus-visible`              | state     | `true`                                           | On a pressable quote: it has keyboard focus (React Aria).                                       |
| `ui-chat-quote`                   | root      |                                                  | A quoted message (`<blockquote>`, or a `<button>` with `onPress`).                              |
| `ui-chat-quote__author`           | slot      |                                                  | The quoted message's author.                                                                    |
| `ui-chat-quote__excerpt`          | slot      |                                                  | The quoted message's excerpt.                                                                   |
| `ui-chat-date-separator`          | root      |                                                  | A day marker between messages.                                                                  |
| `ui-chat-date-separator__label`   | slot      |                                                  | The day's words (also `ui-relative-time`).                                                      |
| `ui-chat-unread-divider`          | root      |                                                  | The marker before the first unread message.                                                     |
| `ui-chat-unread-divider__label`   | slot      |                                                  | The divider's words.                                                                            |
| `ui-chat-typing-indicator`        | root      |                                                  | Who is typing, or that an assistant is thinking (`role="status"`).                              |
| `ui-chat-typing-indicator__dots`  | slot      |                                                  | The decorative dots.                                                                            |
| `ui-chat-typing-indicator__dot`   | slot      |                                                  | Each of the three dots.                                                                         |
| `ui-chat-typing-indicator__text`  | slot      |                                                  | Who is typing, in words.                                                                        |
| `data-variant`                    | attribute | `typing`, `thinking`                             | On a typing indicator: people typing or an assistant thinking.                                  |
| `data-empty`                      | state     | `true`                                           | On a typing indicator: nobody is typing.                                                        |
| `ui-chat-read-receipts`           | root      |                                                  | The readers of a message (also `ui-avatar-group`).                                              |
