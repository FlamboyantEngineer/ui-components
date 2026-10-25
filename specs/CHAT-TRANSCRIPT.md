# Chat Transcript

`ChatTranscript` is a conversation: messages from people, an assistant or the system, oldest first, in a `feed` that is one tab stop. It follows the latest message as messages arrive and stream in (or, in anchor mode, keeps the reader's sent message at the top while the reply fills in below), stops when the reader scrolls away, offers a "jump to latest" control that counts what arrived meanwhile, announces new messages through its own live region, loads older history at the top while keeping the reader's place, jumps to a highlighted message, marks the unread and reports what the reader has seen, and can virtualize a very long history. `ChatMessage` is one message: the author's avatar and name, a [Relative Time](RELATIVE-TIME.md), the content, its actions and its status. A [Message Composer](MESSAGE-COMPOSER.md) usually sits below it.

## UIC-CHAT-TRANSCRIPT-1 - Transcript

### UIC-CHAT-TRANSCRIPT-1.1 - Feed

`ChatTranscript` shall render a `ui-chat-transcript` root holding a [Scroll Region](SCROLL-REGION.md) (`ui-chat-transcript__log`) whose viewport holds a `feed` (`ui-chat-transcript__feed`) named by `aria-label`, `aria-labelledby` or else the provider string `conversation` (its other labelling props pass to it too), holding the children: `ChatMessage` articles and the parts between them, such as separators, which carry no role of their own. The feed is not a live region; new messages are announced separately (UIC-CHAT-TRANSCRIPT-3.6). While there are no children the root publishes `data-empty` and there is no feed: `emptyState` shows in the viewport in `ui-chat-transcript__empty`, such as suggested first questions.

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

With `virtualized`, the root shall publish `data-virtualized` and mount only the children within one viewport height above and below the visible area, plus the focused message, the anchored one, the one about to be focused, the highlighted one, the newest two children and those that just arrived; each run of unmounted children is replaced by a spacer as tall as their measured heights (the average measured height until measured, with the feed's row gap between them). Following, anchoring, keeping the reader's place as history loads, the keyboard model, unread counts and announcements work as without it: moving focus to an unmounted message mounts it first, then brings it into view and focuses it.

Implementation: `src/components/chat-transcript/transcript-window.ts`, `src/components/chat-transcript/transcript-parts.tsx`, `src/components/chat-transcript/use-transcript.ts`
Verification: `src/components/chat-transcript/transcript-virtual.test.tsx`, `e2e/chat-transcript.spec.ts`

## UIC-CHAT-TRANSCRIPT-2 - Message

### UIC-CHAT-TRANSCRIPT-2.1 - Parts

`ChatMessage` shall render an `<article>` (`ui-chat-message`) with, given an `author`, a decorative small `Avatar` (`ui-chat-message__avatar`) and their name (`ui-chat-message__author`, or the provider's `unnamed` string for a blank name), given a `time`, a `RelativeTime` (`ui-chat-message__time`, read against `getNow`), both in `ui-chat-message__header`; then the children in `ui-chat-message__content` and `actions` in `ui-chat-message__actions`, all inside `ui-chat-message__body`. Without an author or a time there is no header.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.2 - Origin and status

`ChatMessage` shall publish `origin` as `data-origin`: `sent` by the reader, `received` from someone else (the default), or a `system` notice, and `status` as `data-status`: `complete` (the default), `streaming` or `error`. A streaming message is busy (`aria-busy="true"`), so assistive technology reads it once it completes.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-2.3 - Hooks and caller attributes

`ChatMessage` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/chat-transcript.test.tsx`

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

Implementation: `src/components/chat-transcript/transcript-keyboard.ts`, `src/components/chat-transcript/transcript-tabbables.ts`
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

Each child is found by its `id` prop, else its React key, else its position; that key is the message id the transcript's props and callbacks use (`highlightedMessageId`, `firstUnreadId`, `onRead`). A `ChatMessage` inside a transcript registers through context its author's display name, origin and status (with an optional plain-text summary to announce), which is how the transcript tells messages from the parts between them, and takes from it the props for its `<article>`: the roving `tabindex`, `aria-posinset`, `aria-setsize` and `data-highlighted`. Outside a transcript a `ChatMessage` takes none of them.

Implementation: `src/components/chat-transcript/transcript-context.ts`, `src/components/chat-transcript/transcript-registry.ts`, `src/components/chat-transcript/transcript-items.ts`, `src/components/chat-transcript/chat-message.tsx`
Verification: `src/components/chat-transcript/transcript-keyboard.test.tsx`, `src/components/chat-transcript/transcript-items.test.ts`

## UIC-CHAT-TRANSCRIPT-4 - History and unread

### UIC-CHAT-TRANSCRIPT-4.1 - Loading older messages

While `hasOlder` is set and `isLoadingOlder` is not, the transcript shall call `onLoadOlder` once when the reader comes within one view's height of the top, by scrolling, moving focus or from the start when the messages do not fill that much, and again only after older messages arrived, loading ended, or the reader left that zone and came back. While `isLoadingOlder`, `ui-chat-transcript__history` shows above the feed with a [Spinner](PROGRESS-BAR.md) named by the provider's `loadingOlderMessages` string, the feed is busy (`aria-busy="true"`) and the announcer reads that string once; when older messages arrive it announces the provider's `olderMessagesLoaded` with their count. The transcript loads from its own scroll position rather than through a [Load More](LOAD-MORE.md) control: a button above the messages would be a second tab stop before the feed's, and focusing it would scroll to the top.

Implementation: `src/components/chat-transcript/transcript-sync.ts`, `src/components/chat-transcript/transcript-commit.ts`, `src/components/chat-transcript/transcript-parts.tsx`, `src/core/chat-strings.ts`
Verification: `src/components/chat-transcript/transcript-history.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.2 - Keeping the reader's place

While the reader is scrolled away from the bottom (and no message is anchored), content added or resized above the first message in view (older history, the loading indicator, a message that grew) shall leave that message where it was in the view, so the reader keeps their place and the focused message keeps focus.

Implementation: `src/components/chat-transcript/transcript-scroll.ts`, `src/components/chat-transcript/use-transcript.ts`
Verification: `src/components/chat-transcript/transcript-history.test.tsx`, `e2e/chat-transcript.spec.ts`

### UIC-CHAT-TRANSCRIPT-4.3 - Highlighted message

When `highlightedMessageId` names a message (once it is among the children), the transcript shall scroll it to the middle of the view (its top to the top when it is taller than the view), focus it and publish `data-highlighted` on it while the prop names it. Changing the prop to another message moves there; the transcript does not clear it.

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

## Hooks

| Hook                            | Kind      | Values                           | Description                                           |
| ------------------------------- | --------- | -------------------------------- | ----------------------------------------------------- |
| `ui-chat-transcript`            | root      |                                  | The transcript's frame.                               |
| `ui-chat-transcript__log`       | slot      |                                  | The scrolling log (also `ui-scroll-region`).          |
| `ui-chat-transcript__empty`     | slot      |                                  | The empty state inside the log.                       |
| `ui-chat-transcript__jump`      | slot      |                                  | The jump to latest button (also `ui-button`).         |
| `ui-chat-transcript__feed`      | slot      |                                  | The `feed` of messages.                               |
| `ui-chat-transcript__history`   | slot      |                                  | The loading indicator above the feed.                 |
| `ui-chat-transcript__spacer`    | slot      |                                  | In anchor mode: the space after the feed.             |
| `ui-chat-transcript__unread`    | slot      |                                  | The unread bar, with its jump button.                 |
| `ui-chat-transcript__announcer` | slot      |                                  | The visually hidden live region.                      |
| `data-empty`                    | state     | `true`                           | On the transcript: there are no messages.             |
| `data-virtualized`              | state     | `true`                           | On the transcript: it mounts only messages near view. |
| `data-highlighted`              | state     | `true`                           | On a message: the transcript's highlighted message.   |
| `ui-chat-message`               | root      |                                  | A message (`<article>`).                              |
| `ui-chat-message__avatar`       | slot      |                                  | The author's avatar (also `ui-avatar`).               |
| `ui-chat-message__body`         | slot      |                                  | The header, content and actions.                      |
| `ui-chat-message__header`       | slot      |                                  | The author's name and the time.                       |
| `ui-chat-message__author`       | slot      |                                  | The author's name.                                    |
| `ui-chat-message__time`         | slot      |                                  | The time (also `ui-relative-time`).                   |
| `ui-chat-message__content`      | slot      |                                  | The message's content.                                |
| `ui-chat-message__actions`      | slot      |                                  | The message's actions.                                |
| `data-origin`                   | attribute | `sent`, `received`, `system`     | On a message: who it is from, relative to the reader. |
| `data-status`                   | attribute | `complete`, `streaming`, `error` | On a message: whether it is complete.                 |
