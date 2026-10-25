# Chat

`Chat` is a whole conversation drawn from the host's messages and callbacks: an optional header with the participants, a search within the conversation and the host's controls; a [Chat Transcript](CHAT-TRANSCRIPT.md) whose messages hold their [Chat Parts](CHAT-PARTS.md) and the [Chat Message Actions](CHAT-MESSAGE-ACTIONS.md) the host allows; who is typing and what the assistant is doing; the queue of follow-ups; and the rich [Message Composer](MESSAGE-COMPOSER.md). It serves assistant chats (an assistant among the participants: streaming, tool calls, approvals, questions, plans) and chats between people (one to one or in groups: delivery, replies, edits, reactions, read receipts, unread messages). It holds no conversation state of its own: the host owns the messages, or spreads a [Chat Controller](CHAT-CONTROLLER.md)'s `props` into it. `Chat` is inline; a host places it in a page, a [Drawer](DRAWER.md) or a [Popover](POPOVER.md). `ChatHeader` is the header, also usable on its own.

The conversation's model is [Chat Parts](CHAT-PARTS.md)' `ChatMessageData` and `ChatParticipant`. A conversation is an assistant chat when a participant's `kind` is `assistant`, and a chat between people otherwise.

## UIC-CHAT-1 - Conversation

### UIC-CHAT-1.1 - Entry point

`Chat`, `ChatHeader` and their prop types shall be exported only from `@flamboyantengineer/ui-components/chat`, not from the package root, since the composer is the rich composer ([UIC-MESSAGE-COMPOSER-4.1](MESSAGE-COMPOSER.md#uic-message-composer-41---entry-point-and-engine)) and loads ProseMirror; the root and every other component stay free of it.

Implementation: `src/components/chat/index.ts`, `src/index.ts`
Verification: `src/components/chat/chat.test.tsx`

### UIC-CHAT-1.2 - Layout

`Chat` shall render a `ui-chat` root holding, in order: the header ([UIC-CHAT-5.1](#uic-chat-51---header)), the search bar while open ([UIC-CHAT-5.3](#uic-chat-53---search)), the transcript (`ui-chat__transcript`), the typing indicator (`ui-chat__typing`, [UIC-CHAT-4.1](#uic-chat-41---typing-and-thinking)), the status line (`ui-chat__status`, [UIC-CHAT-4.2](#uic-chat-42---status-line)), the queue ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)) and the composer ([UIC-CHAT-3.1](#uic-chat-31---composer)). The transcript's feed is named by the caller's `aria-label` or `aria-labelledby`, else by `title`, else by the provider string `conversation`; `aria-describedby` and `aria-details` go to it too. The typing indicator and the status line sit outside the feed, which holds only messages and their separators.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.3 - Messages and their authors

Each message shall render as a `ChatMessage` whose DOM `id` is the message's `id` (unique in the document), with its author drawn from the participant named by `authorId`: the participant's identity and presence, without the participant's `kind`, an assistant's avatar `rounded` unless the participant names its own `shape`. The origin is `sent` for the reader's messages (`currentUserId`), `system` for a message without an author and `received` otherwise; the time is `createdAt`, read against `getNow`.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-1.4 - Message states

Each message shall show its `status`, `delivery`, `error`, `isEdited` and `isDeleted` through `ChatMessage`. A reply whose status is `streaming` while one of its parts waits for the reader ([UIC-CHAT-CONTROLLER-3.5](CHAT-CONTROLLER.md)) shows as `complete`, so it is not busy and assistive technology does not hide the card that asks. With `onRetry`, a message whose status is `error` or whose delivery is `failed` offers Retry, which calls `onRetry` with its id.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-1.5 - Parts

Each message's content shall be its `parts` drawn by `ChatParts` with the message's id as `messageId`, streaming while the message's status is `streaming`, and the chat's `textFormat`, `toolRenderers`, `onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`, `onApplyCode` and `renderPart`. The chat keeps the reader's open and closed choices of each message's parts and passes them back as `expandedParts`, so they survive the message being unmounted and mounted again, as in a virtualized history. Pass stable callbacks: the messages that did not change then do not render again while a reply streams.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-chat-state.ts`, `src/components/chat/use-message-context.ts`
Verification: `src/components/chat/chat.test.tsx`

### UIC-CHAT-1.6 - Days, groups and unread

The messages shall be laid out by `groupChatMessages` ([UIC-CHAT-TRANSCRIPT-6](CHAT-TRANSCRIPT.md)): a `ChatDateSeparator` (read against `getNow`) before each day, the `ChatUnreadDivider` before `firstUnreadId`, and each message's group position.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.7 - Transcript behaviour

The transcript shall scroll in `scrollMode`, by default `anchor` in an assistant chat and `follow` otherwise, and take `virtualized`, `emptyState`, `onLoadOlder`, `hasOlder`, `isLoadingOlder`, `firstUnreadId` and `onRead` as [Chat Transcript](CHAT-TRANSCRIPT.md) does. Escape from a focused message (the transcript's second Escape) moves focus to the composer.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

## UIC-CHAT-2 - Message commands

### UIC-CHAT-2.1 - Commands offered

Each message shall offer, through `ChatMessageActionsMenu` (an action bar and a context menu), only the commands whose callback the chat has, and none on a deleted message or a notice: Copy (`onCopy`) and the ratings (`onFeedback`, on an assistant's messages) once the message's status is `complete`; and in chats between people only, Reply (`onReply`) and React (`onReact`) on every message, and Edit (`onEdit`, on the reader's messages that have text) and Delete (`onDelete`) on the reader's own messages. An assistant chat never offers Reply, React, Edit or Delete.

Implementation: `src/components/chat/chat-commands.ts`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-message-context.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`

### UIC-CHAT-2.2 - Copy and feedback

Copy shall put the message's text on the clipboard, its text parts then its code, one block each, and call `onCopy` with the message's id once it is there. The ratings show the message's `feedback`, offer the chat's `feedbackReasons`, and call `onFeedback` with the message's id and the reader's feedback.

Implementation: `src/components/chat/chat-commands.ts`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`

### UIC-CHAT-2.3 - Reactions

A message's `reactions` shall show in a [Reaction Bar](REACTION-BAR.md). In a chat between people with `onReact`, toggling a chip and choosing an emoji through React call `onReact` with the message's id, the emoji and whether the reader now reacts with it.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-commands.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`

### UIC-CHAT-2.4 - Reply

Reply shall move focus to the composer and show above its input a banner (`ui-chat__banner`) that reads the provider string `chatReplyingTo` (`ui-chat__banner-label`) and quotes the message (`ChatQuote`, its author and an excerpt of its text), with a Cancel reply button (`ui-chat__banner-cancel`, the `close` glyph, the `chatCancelReply` string); the banner describes the input. Cancel reply, or Escape in the composer, ends the reply. Sending while replying calls `onReply` with the replied message's id, the text and its tokens instead of `onSend`. A message whose `replyTo` names a loaded message shows its quote; pressing the quote highlights that message ([UIC-CHAT-TRANSCRIPT-4.3](CHAT-TRANSCRIPT.md)) and moves focus to it.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-chat-state.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-2.5 - Edit

Edit, and Up in the empty composer of a chat between people with `onEdit` (on the reader's last message that has text), shall put the composer in edit mode ([UIC-MESSAGE-COMPOSER-3.3](MESSAGE-COMPOSER.md#uic-message-composer-33---edit-mode)) with the message's first text part and its tokens, move focus to it, and show the banner reading the provider string `chatEditingMessage`. Save calls `onEdit` with the message's id, the text and its tokens; Cancel and Escape leave edit mode. The edit holds while the message's words stay the same, as when a reaction arrives.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/use-chat-state.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-2.6 - Delete

Delete shall call `onDelete` with the message's id once the reader confirms ([UIC-CHAT-MESSAGE-ACTIONS-3.3](CHAT-MESSAGE-ACTIONS.md)).

Implementation: `src/components/chat/chat-commands.ts`
Verification: `src/components/chat/chat-commands.test.ts`

## UIC-CHAT-3 - Composer

### UIC-CHAT-3.1 - Composer

With `onSend`, `Chat` shall end with a `RichMessageComposer` (`ui-chat__composer`) that sends through `onSend` with the text and its tokens; without `onSend` there is no composer. It takes the chat's `placeholder`, `isDisabled`, `isPending` and `onStop`; `@` mentions the participants other than the reader and `/` inserts the chat's `commands`. With a `conversationId` it keeps its draft in the provider's storage under `chat-draft:<conversationId>`, so each conversation has its own draft. In a chat between people it offers the emoji picker.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.2 - Mention and command tokens

`Chat` shall send each token with its trigger in its `label` (`@Ana Lopez`, `/summarize`), the text the message's pill shows ([UIC-CHAT-PARTS-2.4](CHAT-PARTS.md#uic-chat-parts-24---mention-and-command-tokens)), and give the composer a message's or queued message's tokens by their bare labels when it edits them.

Implementation: `src/components/chat/chat-model.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-model.test.ts`, `src/components/chat/chat-composer.test.tsx`

### UIC-CHAT-3.3 - Up arrow

In an assistant chat, Up in the empty composer shall recall the chat's `history` ([UIC-MESSAGE-COMPOSER-3.5](MESSAGE-COMPOSER.md#uic-message-composer-35---recalling-earlier-messages)); in a chat between people it edits the reader's last message ([UIC-CHAT-2.5](#uic-chat-25---edit)).

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.4 - Queue of follow-ups

With a non-empty `queue`, a `ui-chat__queue` shall show above the composer: a label (`ui-chat__queue-label`, the provider string `chatQueuedMessages` with the count) naming an ordered list (`ui-chat__queue-list`) of the queued messages (`ui-chat__queue-item`), each its text (`ui-chat__queue-text`) and, with `onQueueChange`, an Edit button (`ui-chat__queue-edit`, the `edit` glyph, `chatEditQueued`) and a Remove button (`ui-chat__queue-remove`, the `close` glyph, `chatRemoveQueued`). Remove calls `onQueueChange` without the message, and focus moves to the next message's Remove, else the previous one's, else the composer. Edit puts the composer in edit mode with the queued text and the banner reading `chatEditingQueued`, and marks the item with `data-editing`; Save calls `onQueueChange` with the new text and tokens. With `onQueueChange`, the composer also sends while a reply is pending ([UIC-MESSAGE-COMPOSER-3.8](MESSAGE-COMPOSER.md#uic-message-composer-38---sending-while-a-reply-is-pending)), so the host can queue the message.

Implementation: `src/components/chat/chat-queue.tsx`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.5 - Attachments

With `onAttach`, the composer shall attach files from its attach button, a drop and a paste ([UIC-MESSAGE-COMPOSER-3.2](MESSAGE-COMPOSER.md#uic-message-composer-32---attaching-files)); without it there is no attach button. The chat's `attachments` show above the input as a `ChatAttachmentList` with `onRemoveAttachment` and `onRetryAttachment`, focus going to the composer when the last one is removed; while one of them is `complete`, the message may be sent without text.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

## UIC-CHAT-4 - Activity and receipts

### UIC-CHAT-4.1 - Typing and thinking

The typing indicator (`ChatTypingIndicator`) shall show the assistant as thinking (`thinking` variant, with its name) while the last message is an assistant's reply that streams and has no parts yet, and otherwise the names of the participants in `typingIds`, the reader left out. It stays mounted, empty, while nobody types.

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-4.2 - Status line

The status line (`ChatStatusLine`) shall show the `statusText` of the last message while it streams, and nothing otherwise.

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-4.3 - Read receipts

`readPositions` maps a participant's id to the last message they read. Under each message, `ChatReadReceipts` shall show the participants, the reader left out, whose read position is that message.

Implementation: `src/components/chat/chat-model.ts`, `src/components/chat/chat-message-view.tsx`
Verification: `src/components/chat/chat-model.test.ts`, `src/components/chat/chat.test.tsx`

## UIC-CHAT-5 - Header and search

### UIC-CHAT-5.1 - Header

With a `title`, `headerActions` or `showSearch`, `Chat` shall start with a `ChatHeader` showing the title, the participants other than the reader, a line reading who is typing (the provider string `chatTyping`) or else the status text of the reply that streams, and as actions the search button (with `showSearch`) followed by `headerActions`.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-5.2 - ChatHeader

`ChatHeader` shall render a `ui-chat-header` element holding the participants' avatar (`ui-chat-header__avatar`), then the `title` as a heading (`ui-chat-header__title`) one level below its section's (3 outside a section) with the `status` line under it (`ui-chat-header__status`), both in `ui-chat-header__text`, then the `actions` (`ui-chat-header__actions`). One participant shows as a small `PresenceAvatar` with their presence, or a decorative `Avatar` without one; several show as an `AvatarGroup` of three and a count that lists everyone, their presence in words as each person's second line, when pressed. The status line is shown and kept from assistive technology, since the conversation announces the same news where it happens. It forwards `className`, `id` and caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-header.tsx`
Verification: `src/components/chat/chat-header.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-5.3 - Search

With `showSearch`, the header shall offer a search button (`ui-chat__search-toggle`, the `search` glyph, the provider string `chatSearch`, `aria-expanded` and `aria-controls`) that opens a [Find Bar](FIND-BAR.md) under the header (`ui-chat__search`, labelled `chatSearch`) with focus in its find box, and closes it again. The search reads the conversation's data, not its mounted messages, so a virtualized history is searched whole: a message matches when its text holds every term of the query, ignoring case and accents (deleted messages never match). The newest match is current first; Next and Previous (Enter and Shift+Enter) step through the matches and wrap around. The current match is the transcript's highlighted message, so it is mounted, scrolled into view and marked while focus stays in the find box, and the terms are marked in the messages through `TextMatch`. Closing the bar (Escape, Close or the search button) clears the query and moves focus to the current match, or to the search button when there is none.

Implementation: `src/components/chat/chat-search.tsx`, `src/components/chat/chat-model.ts`, `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat-search.test.tsx`, `e2e/chat.spec.ts`

## UIC-CHAT-6 - Attributes

### UIC-CHAT-6.1 - Hooks, strings and caller attributes

`Chat` shall carry the hooks below, append the caller's `className` and forward `id` and caller `data-*` attributes to its root. Its parts keep their own components' hooks beside the slot classes. Its own strings come from the provider (`chat-widget-strings.ts`).

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-hooks.ts`, `src/core/chat-widget-strings.ts`
Verification: `src/components/chat/chat.test.tsx`

## Hooks

| Hook                      | Kind  | Values | Description                                                                 |
| ------------------------- | ----- | ------ | --------------------------------------------------------------------------- |
| `ui-chat`                 | root  |        | The conversation.                                                           |
| `ui-chat__search-toggle`  | slot  |        | The header's search button (also `ui-icon-button`).                         |
| `ui-chat__search`         | slot  |        | The search bar under the header (also `ui-find-bar`).                       |
| `ui-chat__transcript`     | slot  |        | The transcript (also `ui-chat-transcript`).                                 |
| `ui-chat__typing`         | slot  |        | Who is typing, or the assistant thinking (also `ui-chat-typing-indicator`). |
| `ui-chat__status`         | slot  |        | What the assistant is doing (also `ui-chat-status-line`).                   |
| `ui-chat__queue`          | slot  |        | The queue of follow-ups above the composer.                                 |
| `ui-chat__queue-label`    | slot  |        | The queue's label, with its count.                                          |
| `ui-chat__queue-list`     | slot  |        | The ordered list of queued messages.                                        |
| `ui-chat__queue-item`     | slot  |        | One queued message.                                                         |
| `ui-chat__queue-text`     | slot  |        | A queued message's text.                                                    |
| `ui-chat__queue-edit`     | slot  |        | Edit a queued message (also `ui-icon-button`).                              |
| `ui-chat__queue-remove`   | slot  |        | Remove a queued message (also `ui-icon-button`).                            |
| `ui-chat__composer`       | slot  |        | The composer (also `ui-message-composer`).                                  |
| `ui-chat__banner`         | slot  |        | The reply or edit banner's text, inside the composer's banner.              |
| `ui-chat__banner-label`   | slot  |        | What the banner is about: replying, or editing.                             |
| `ui-chat__banner-cancel`  | slot  |        | Cancel reply (also `ui-icon-button`).                                       |
| `data-editing`            | state | `true` | On a queued message the composer edits.                                     |
| `ui-chat-header`          | root  |        | The header.                                                                 |
| `ui-chat-header__avatar`  | slot  |        | The participants' avatar or avatar group.                                   |
| `ui-chat-header__text`    | slot  |        | The title and the status line.                                              |
| `ui-chat-header__title`   | slot  |        | The title, a heading.                                                       |
| `ui-chat-header__status`  | slot  |        | Who is typing, or what the assistant is doing.                              |
| `ui-chat-header__actions` | slot  |        | The search button and the host's controls.                                  |
