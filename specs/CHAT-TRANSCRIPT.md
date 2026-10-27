# Chat Transcript

`ChatTranscript` is a conversation: messages from people, an assistant or the system, oldest first, in a `feed` that is one tab stop. It follows the latest message as messages arrive and stream in (or, in anchor mode, keeps the reader's sent message at the top while the reply fills in below), stops when the reader scrolls away, offers a "jump to latest" control that counts what arrived meanwhile, announces new messages through its own live region, loads older history at the top while keeping the reader's place, jumps to a highlighted message, marks the unread and reports what the reader has seen, and can virtualize a very long history. `ChatMessage` is one message: the author's avatar and name, a [Relative Time](RELATIVE-TIME.md), the content, its actions and its status. A [Message Composer](MESSAGE-COMPOSER.md) usually sits below it.

Around the messages sit the conversation parts: `ChatQuote` (a quoted reply), `ChatDateSeparator`, `ChatUnreadDivider`, `ChatTypingIndicator` and `ChatReadReceipts`. `groupChatMessages` turns a host's messages into the sequence to render: date separators, the unread divider and each message with its group position.

## UIC-CHAT-TRANSCRIPT-1 - Transcript

### UIC-CHAT-TRANSCRIPT-1.1 - Feed

`ChatTranscript` shall render a `ui-chat-transcript` root holding a [Scroll Region](SCROLL-REGION.md) (`ui-chat-transcript__log`) whose viewport holds a `feed` (`ui-chat-transcript__feed`) named by `aria-label`, `aria-labelledby` or else the provider string `conversation` (its other labelling props pass to it too), holding the children: `ChatMessage` articles and the parts between them, such as separators, which carry no role of their own (a status, such as a typing indicator, sits outside the transcript). The feed is not a live region; new messages are announced separately (UIC-CHAT-TRANSCRIPT-3.6). While there are no children the root publishes `data-empty` and there is no feed: `emptyState` shows in the viewport in `ui-chat-transcript__empty`, such as suggested first questions.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/components/chat-transcript/transcript-parts.tsx`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.2 - Following the latest message

With `scrollMode="follow"` (the default) the transcript shall start at its latest message and keep the bottom in view as messages arrive or grow while the reader is there, after each render and whenever the content or the viewport resizes. Scrolling up stops the following, so the reader keeps their place while a reply streams; scrolling back to the bottom, or sending a message of their own (a `sent` message arriving), follows again. The transcript keeps the scroll position itself, so the reference stylesheet turns the browser's own scroll anchoring off in the viewport (`overflow-anchor: none`).

Implementation: `src/components/chat-transcript/transcript-scroll.ts`, `src/components/chat-transcript/use-transcript.ts`, `src/components/chat-transcript/transcript-commit.ts`, `labs/reference/chat-transcript.css`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `src/components/chat-transcript/transcript-anchor.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.3 - Jump to latest

While the reader is scrolled away from the bottom, a button (`ui-chat-transcript__jump`, a `Button` with the `arrow-down` glyph) shall show after the log, reading the provider string `jumpToLatest`, or the count of new messages (UIC-CHAT-TRANSCRIPT-4.4). Pressing it scrolls to the latest message, which follows again, moves focus to the latest message and hides the button. Scrolling back to the bottom hides it too.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/components/chat-transcript/use-transcript.ts`, `src/core/content-strings.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.4 - Hooks and caller attributes

`ChatTranscript` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the feed.

Implementation: `src/components/chat-transcript/chat-transcript.tsx`, `src/components/chat-transcript/transcript-hooks.ts`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

### UIC-CHAT-TRANSCRIPT-1.5 - Anchoring the reader's message

With `scrollMode="anchor"`, when a `sent` message arrives the transcript shall scroll it to the top of the view (the top of the viewport's content box) and keep it there while the reply and anything after it fill in below, even once they outgrow the view. To keep that scroll range, a spacer (`ui-chat-transcript__spacer`, after the feed) takes the height the content below the anchored message lacks, shrinking as the reply grows, with its height set inline. Scrolling away stops the anchoring as it stops the following, and the spacer keeps the scroll range so the view does not jump; reaching the bottom then follows. Switching to `follow` drops the anchor and the spacer.

Implementation: `src/components/chat-transcript/transcript-scroll.ts`, `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/chat-transcript.tsx`
Verification: `src/components/chat-transcript/transcript-anchor.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-1.6 - Virtualized history

With `virtualized`, the root shall publish `data-virtualized` and mount only the children within one view height above and below the visible area (the viewport's height, or the window's when the viewport is taller), plus the focused message, the anchored one, the one about to be focused, the highlighted one, the newest two children and those that just arrived; each run of unmounted children is replaced by a spacer as tall as their measured heights (the average measured height until measured, with the feed's row gap between them). Following, anchoring, keeping the reader's place as history loads, the keyboard model, unread counts and announcements work as without it: moving focus to an unmounted message mounts it first, then brings it into view and focuses it.

Implementation: `src/components/chat-transcript/transcript-window.ts`, `src/components/chat-transcript/transcript-parts.tsx`, `src/components/chat-transcript/use-transcript.ts`
Verification: `src/components/chat-transcript/transcript-virtual.test.tsx`, `e2e/chat-transcript.spec.ts`

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

An `author` with a presence `status` shall draw the small [Avatar](AVATAR.md) in `ui-chat-message__avatar` with that `status` and `statusLabel`, named by the author and the status label (`Maria Santos, Away`), instead of a decorative one.

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

`isEdited` shall show the provider string `edited` in `ui-chat-message__edited` in the footer. `isDeleted` shall publish `data-deleted` and replace the content with the provider string `chatMessageDeleted` (`Message deleted`) in `ui-chat-message__content`, leaving out the quote, the footer's markers, the error, the reactions and the actions; the avatar, the header, a time placed in the footer and the readers stay.

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

### UIC-CHAT-TRANSCRIPT-2.13 - Avatar, name, time and background

`showAvatar={false}` shall leave out the avatar and publish `data-avatar-hidden`, so a stylesheet lines grouped messages up without the avatar's space; `showAuthorName={false}` shall leave out the author's name, the header keeping the time; both default to `true`. `timePlacement` shall place the time: in the header (`header`, the default); in `ui-chat-message__footer`, before the markers, under the content (`footer`), also for a grouped or deleted message, so a stylesheet shows it with the actions while the message is hovered or holds focus (UIC-CHAT-TRANSCRIPT-2.7), as the reference stylesheet does; or nowhere (`none`), also not in a grouped message. With neither a name nor a time in the header there is no header. The message's name keeps the author and the time either way (UIC-CHAT-TRANSCRIPT-2.4). `ChatMessage` shall publish `variant` as `data-variant`: `bubble` (the default), whose content the reference stylesheet draws on a background, or `plain`, whose content it draws as text on the page without a background, a plain `received` message taking the transcript's whole width.

Implementation: `src/components/chat-transcript/chat-message.tsx`, `src/components/chat-transcript/chat-message-parts.tsx`, `labs/reference/chat-transcript.css`
Verification: `src/components/chat-transcript/chat-message.test.tsx`, `e2e/chat-display.spec.ts`

## UIC-CHAT-TRANSCRIPT-3 - Navigation and announcements

### UIC-CHAT-TRANSCRIPT-3.1 - One tab stop

The feed shall be one tab stop with a roving `tabindex`: the newest message has `tabindex="0"` and every other message `-1`, until the reader focuses a message, which then holds the tab stop while focus stays in the feed; once focus leaves the feed the newest message is the entry point again. Controls inside messages (links, buttons, fields) are out of the tab order (`tabindex="-1"`, their own value restored when the reader enters the message, and reapplied to controls that render or change later), so Tab passes from the feed to what follows it. Each message carries `aria-posinset` (its position among the messages, from 1) and `aria-setsize` (their count, or `-1` while `hasOlder`).

Implementation: `src/components/chat-transcript/transcript-tabbables.ts`, `src/components/chat-transcript/transcript-keyboard.ts`, `src/components/chat-transcript/transcript-runtime.ts`, `src/components/chat-transcript/transcript-context.ts`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-3.2 - Moving between messages

On a focused message, Up and Down shall move focus to the previous and next message and Home and End to the first and last, skipping the parts between messages and stopping at either end, and bring the newly focused message into view: just far enough to show it whole, or with its top at the top when it is taller than the view or for Home (a separator right before it comes into view with it). Arrow keys with a modifier are left alone.

Implementation: `src/components/chat-transcript/transcript-keyboard.ts`, `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-geometry.ts`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-3.3 - Entering a message

Enter on a focused message shall put its controls in the tab order and move focus to the first of them (a message without controls keeps focus). Inside, Tab and Shift+Tab cycle through the message's controls, wrapping at either end, a composite control such as a toolbar counting as its one tab stop; Escape returns focus to the message and takes its controls out of the tab order again. Focusing a control inside a message by other means, such as a click, enters that message too. Keys from content portalled out of the message, such as an open menu, are left alone.

Implementation: `src/components/chat-transcript/transcript-keyboard.ts`, `src/components/chat-transcript/transcript-tabbables.ts`, `src/utils/tabbable.ts`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-3.4 - Leaving for the composer

Escape on a focused message (so a second Escape after leaving its controls) shall call `onEscape`, with which a chat moves focus to its composer; the key then goes no further, so an enclosing overlay stays open. Without `onEscape` the key is left to the page.

Implementation: `src/components/chat-transcript/transcript-keyboard.ts`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`

### UIC-CHAT-TRANSCRIPT-3.5 - Paging

Page Up and Page Down on a focused message shall scroll the viewport natively, so a message taller than the view can still be read; once scrolling has paused for 150 milliseconds, focus moves without scrolling to the first message whose top is in view, or to the message covering the top of the view.

Implementation: `src/components/chat-transcript/transcript-keyboard.ts`, `src/components/chat-transcript/transcript-sync.ts`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-3.6 - Announcing new messages

New messages shall be announced through a visually hidden polite live region (`ui-chat-transcript__announcer`, `role="status"`, after the log), never by making the feed live. A message that arrives (added after the messages already there, not the history present when the transcript mounts, older history added above, or another conversation's messages replacing every child) is announced as the provider's `newMessageAnnouncement`, from its author's name (`null` for a system notice) and its summary, or its content's text; the reader's own (`sent`) messages are not announced, a streaming message is announced once, when it completes, and a failed one is left to its error. Announcements are at most one a second: the first is read at once, and what arrives in the next second is grouped into one announcement (several messages read as the provider's `newMessageCount`), together with any status, such as older messages loading. A repeated announcement still changes the region so it is read again.

Implementation: `src/components/chat-transcript/transcript-announcer.tsx`, `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-items.ts`, `src/core/chat-strings.ts`
Verification: `src/components/chat-transcript/transcript-announcer.test.tsx`, `src/components/chat-transcript/transcript-items.test.ts`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-3.7 - Messages register with the transcript

Each child is found by its `id` prop, else its React key, else its position (fragments are flattened into their children); that key is the message id the transcript's props and callbacks use (`highlightedMessageId`, `firstUnreadId`, `onRead`), except that a message registering its own `id` (its DOM id), such as a `ChatMessage` inside a wrapper component, is known by that id once it has mounted. A `ChatMessage` inside a transcript registers through context its `id`, its author's display name, origin and status (with an optional plain-text summary to announce), which is how the transcript tells messages from the parts between them, and takes from it the props for its `<article>`: the roving `tabindex`, `aria-posinset`, `aria-setsize` and `data-highlighted`. Outside a transcript a `ChatMessage` takes none of them.

Implementation: `src/components/chat-transcript/transcript-context.ts`, `src/components/chat-transcript/transcript-registry.ts`, `src/components/chat-transcript/transcript-items.ts`, `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `src/components/chat-transcript/transcript-items.test.ts`, `src/components/chat-transcript/transcript-history.test.tsx`

## UIC-CHAT-TRANSCRIPT-4 - History and unread

### UIC-CHAT-TRANSCRIPT-4.1 - Loading older messages

While `hasOlder` is set and `isLoadingOlder` is not, the transcript shall call `onLoadOlder` once when the reader comes within one view's height of the top, by scrolling, moving focus or from the start when the messages do not fill that much, and again only after older messages arrived, loading ended, or the reader left that zone and came back. While `hasOlder` (or `isLoadingOlder`), `ui-chat-transcript__history` sits above the feed, so the reader at the top sees it; while `isLoadingOlder` it holds a [Spinner](PROGRESS-BAR.md) named by the provider's `loadingOlderMessages` string, the feed is busy (`aria-busy="true"`) and the announcer reads that string once; when older messages arrive it announces the provider's `olderMessagesLoaded` with their count. The transcript loads from its own scroll position rather than through a [Load More](LOAD-MORE.md) control: a button above the messages would be a second tab stop before the feed's, and focusing it would scroll to the top.

Implementation: `src/components/chat-transcript/transcript-sync.ts`, `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-parts.tsx`, `src/core/chat-strings.ts`
Verification: `src/components/chat-transcript/transcript-history.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.2 - Keeping the reader's place

While the reader is scrolled away from the bottom (and no message is anchored), content added or resized above the first message in view (older history, the loading indicator, a message that grew) shall leave that message where it was in the view, so the reader keeps their place and the focused message keeps focus.

Implementation: `src/components/chat-transcript/transcript-scroll.ts`, `src/components/chat-transcript/use-transcript.ts`
Verification: `src/components/chat-transcript/transcript-history.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.3 - Highlighted message

When `highlightedMessageId` names a message (once it is among the children), the transcript shall scroll it to the middle of the view (its top to the top when it is taller than the view), focus it (unless the reader is typing in a field outside the transcript, such as a find box, which keeps focus) and publish `data-highlighted` on it while the prop names it. Changing the prop to another message moves there; the transcript does not clear it.

Implementation: `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-runtime.ts`, `src/components/chat-transcript/transcript-context.ts`
Verification: `src/components/chat-transcript/transcript-history.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.4 - New messages while away

Messages from others that arrive below the view while the reader is scrolled away shall be counted, and the jump button (UIC-CHAT-TRANSCRIPT-1.3) reads the provider's `newMessageCount` for them ("3 new messages") instead of `jumpToLatest`. Reaching the bottom, jumping or sending a message clears the count.

Implementation: `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-sync.ts`, `src/core/chat-strings.ts`
Verification: `src/components/chat-transcript/transcript-unread.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.5 - Unread bar

While `firstUnreadId` names a message wholly above the view, a bar (`ui-chat-transcript__unread`, before the log) shall read the provider's `unreadMessageCount` for the messages from that one to the end ("12 unread") and hold a `Button` with the `arrow-up` glyph reading the provider's `jumpToUnread`, described by the count. Pressing it brings the first unread message to the top of the view, with the part right before it (such as an unread divider), and focuses it. The transcript places nothing among the children itself.

Implementation: `src/components/chat-transcript/transcript-parts.tsx`, `src/components/chat-transcript/transcript-sync.ts`, `src/components/chat-transcript/use-transcript.ts`, `src/core/chat-strings.ts`
Verification: `src/components/chat-transcript/transcript-unread.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.6 - Read position

`onRead` shall receive the id of the newest message that has been in view (at least half of it, or half the view for a taller one) or focused, once it has stayed the newest seen for 500 milliseconds; it is called again only when a newer message is seen.

Implementation: `src/components/chat-transcript/transcript-sync.ts`, `src/components/chat-transcript/use-transcript.ts`
Verification: `src/components/chat-transcript/transcript-unread.test.tsx`

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

`ChatTypingIndicator` shall render a `ui-chat-typing-indicator` with `role="status"`, so changes are announced politely. It says who is typing through the provider string `chatTyping` of their display names (`Ana is typing…`, `Ana and Ben are typing…`, `Ana and 2 others are typing…`). An assistant thinking shows inside its reply instead ([Chat Activity](CHAT-ACTIVITY.md) `ChatStatusLine`). The text sits in `ui-chat-typing-indicator__text` after `ui-chat-typing-indicator__dots`, a decorative element holding three `ui-chat-typing-indicator__dot` elements for a stylesheet to animate. With nobody typing it stays mounted, empty, and publishes `data-empty`, so the next change is announced.

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
| `ui-chat-transcript__feed`        | slot      |                                                  | The `feed` of messages.                                                                         |
| `ui-chat-transcript__history`     | slot      |                                                  | Above the feed while older messages remain: the loading indicator.                              |
| `ui-chat-transcript__spacer`      | slot      |                                                  | In anchor mode: the space after the feed.                                                       |
| `ui-chat-transcript__unread`      | slot      |                                                  | The unread bar, with its jump button.                                                           |
| `ui-chat-transcript__announcer`   | slot      |                                                  | The visually hidden live region.                                                                |
| `data-empty`                      | state     | `true`                                           | On the transcript: there are no messages. On a typing indicator: nobody is typing.              |
| `data-virtualized`                | state     | `true`                                           | On the transcript: it mounts only messages near view.                                           |
| `data-highlighted`                | state     | `true`                                           | On a message: the transcript's highlighted message.                                             |
| `ui-chat-message`                 | root      |                                                  | A message (`<article>`).                                                                        |
| `ui-chat-message__avatar`         | slot      |                                                  | The author's avatar (also `ui-avatar`).                                                         |
| `ui-chat-message__body`           | slot      |                                                  | The header, content and actions.                                                                |
| `ui-chat-message__header`         | slot      |                                                  | The author's name and the time.                                                                 |
| `ui-chat-message__author`         | slot      |                                                  | The author's name.                                                                              |
| `ui-chat-message__time`           | slot      |                                                  | The time (also `ui-relative-time`), in the header or the footer.                                |
| `ui-chat-message__content`        | slot      |                                                  | The message's content.                                                                          |
| `ui-chat-message__actions`        | slot      |                                                  | The message's actions.                                                                          |
| `data-origin`                     | attribute | `sent`, `received`, `system`                     | On a message: who it is from, relative to the reader.                                           |
| `data-status`                     | attribute | `complete`, `streaming`, `error`, `cancelled`    | On a message: whether it is complete.                                                           |
| `data-variant`                    | attribute | `bubble`, `plain`                                | On a message: its content on a background, or as plain text.                                    |
| `data-avatar-hidden`              | state     | `true`                                           | On a message: the caller hides the author's avatar.                                             |
| `ui-chat-message__quote`          | slot      |                                                  | The quoted message (also `ui-chat-quote`).                                                      |
| `ui-chat-message__footer`         | slot      |                                                  | A time placed in the footer, the markers and the delivery status, after the content.            |
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
| `ui-chat-typing-indicator`        | root      |                                                  | Who is typing (`role="status"`).                                                                |
| `ui-chat-typing-indicator__dots`  | slot      |                                                  | The decorative dots.                                                                            |
| `ui-chat-typing-indicator__dot`   | slot      |                                                  | Each of the three dots.                                                                         |
| `ui-chat-typing-indicator__text`  | slot      |                                                  | Who is typing, in words.                                                                        |
| `ui-chat-read-receipts`           | root      |                                                  | The readers of a message (also `ui-avatar-group`).                                              |
