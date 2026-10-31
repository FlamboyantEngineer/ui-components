# Chat

`Chat` is a whole conversation drawn from the host's messages and callbacks: an optional header with the participants, a search within the conversation and the host's controls; a [Chat Transcript](CHAT-TRANSCRIPT.md) whose messages hold their [Chat Parts](CHAT-PARTS.md) and the [Chat Message Actions](CHAT-MESSAGE-ACTIONS.md) the host allows, a streaming reply saying what the assistant is thinking or doing; who is typing; the queue of follow-ups; and the rich [Message Composer](MESSAGE-COMPOSER.md), with an optional [Chat Model Picker](CHAT-MODEL-PICKER.md) among its tools. It serves assistant chats (an assistant among the participants: streaming, tool calls, approvals, questions, plans) and chats between people (one to one or in groups: delivery, replies, edits, reactions, read receipts, unread messages). It holds no conversation state of its own: the host owns the messages, or spreads a [Chat Controller](CHAT-CONTROLLER.md)'s `props` into it. `Chat` is inline; a host places it in a page, a [Drawer](DRAWER.md) or a [Popover](POPOVER.md). `ChatHeader` is the header, also usable on its own.

The conversation's model is [Chat Parts](CHAT-PARTS.md)' `ChatMessageData` and `ChatParticipant`. A conversation is an assistant chat when a participant's `kind` is `assistant`, and a chat between people otherwise.

## UIC-CHAT-1 - Conversation

### UIC-CHAT-1.1 - Entry point

`Chat`, `ChatHeader` and their prop types shall be exported only from `@flamboyantengineer/ui-components/chat`, not from the package root, since the composer is the rich composer ([UIC-MESSAGE-COMPOSER-4.1](MESSAGE-COMPOSER.md#uic-message-composer-41---entry-point-and-engine)) and loads ProseMirror; the root and every other component stay free of it.

Implementation: `src/components/chat/index.ts`, `src/index.ts`
Verification: `src/components/chat/chat.test.tsx`

### UIC-CHAT-1.2 - Layout

`Chat` shall render a `ui-chat` root holding, in order: the header ([UIC-CHAT-5.1](#uic-chat-51---header)), the search bar while open ([UIC-CHAT-5.3](#uic-chat-53---search)), the transcript (`ui-chat__transcript`), the typing indicator (`ui-chat__typing`, [UIC-CHAT-4.1](#uic-chat-41---typing)), the queue ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)) and the composer ([UIC-CHAT-3.1](#uic-chat-31---composer)). The transcript's feed is named by the caller's `aria-label` or `aria-labelledby`, else by `title`, else by the provider string `conversation`; `aria-describedby` and `aria-details` go to it too. The typing indicator sits outside the feed, which holds only messages and their separators; what the assistant is thinking or doing shows inside its reply ([UIC-CHAT-4.2](#uic-chat-42---thinking)).

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

Each message's content shall be its `parts` drawn by `ChatParts` with the message's id as `messageId`, streaming while the message's status is `streaming`, and the chat's `textFormat`, `expandsActivity`, `toolRenderers`, `onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`, `questionAnsweredMark`, `onApplyCode` and `renderPart`. The chat keeps the reader's open and closed choices of each message's parts and passes them back as `expandedParts`, so they survive the message being unmounted and mounted again, as in a virtualized history. `onAnswerQuestion` and `onDismissQuestion` may return a promise, which the question card awaits ([UIC-CHAT-QUESTION-2.7](CHAT-QUESTION.md)); without `onAnswerQuestion` question cards are read-only. When `conversationId` changes, every message's parts start afresh, so a card's drafts and unsettled request never carry over to another conversation, even where message and part ids repeat. A message that did not change does not render again while a reply streams, whatever the identity of these callbacks, `getNow` and the command callbacks: each is present while the chat's is and calls the one of the latest render, and a message that renders again draws with the latest `renderPart`, `getReference` and tool renderers. `thinkingIcon` and `feedbackReasons` are compared by what they hold, so an icon element or a list written inline keeps the messages too.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-chat-state.ts`, `src/components/chat/use-message-context.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-message-memo.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.6 - Days, groups and unread

The messages shall be laid out by `groupChatMessages` ([UIC-CHAT-TRANSCRIPT-6](CHAT-TRANSCRIPT.md)): a `ChatDateSeparator` (read against `getNow`) before each day, the `ChatUnreadDivider` before `firstUnreadId`, and each message's group position.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.7 - Transcript behaviour

The transcript shall scroll in `scrollMode`, by default `anchor` in an assistant chat and `follow` otherwise, and take `presentation`, `virtualized`, `emptyState`, `onLoadOlder`, `hasOlder`, `isLoadingOlder`, `firstUnreadId` and `onRead` as [Chat Transcript](CHAT-TRANSCRIPT.md) does. Escape from a focused message (the transcript's second Escape) moves focus to the composer.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.8 - Message display

`showAvatars={false}` and `showAuthorNames={false}` shall hide every message's avatar and author's name, both defaulting to `true`, and `timePlacement` shall place every message's time in its header (`header`, the default), under it in its footer (`footer`), which the reference stylesheet shows with the message's actions while it is hovered or holds focus, in a tooltip while it is hovered or holds focus (`tooltip`), or nowhere (`none`) ([UIC-CHAT-TRANSCRIPT-2.13](CHAT-TRANSCRIPT.md#uic-chat-transcript-213---avatar-name-time-and-background)); `activityTimePlacement`, with the same choices and defaulting to `timePlacement`, shall place instead the time of a message without written text: one with no text part holding more than spaces, unless deleted, such as tool calls, reasoning, plans, sources, files or custom parts alone or together, or a streaming reply with nothing written yet, so a chat can show its written messages' times and leave out its activity's. A written message with sources keeps its one time; sources have no time of their own. `collapseFooterTime` (default `false`) shall pass to every message, so a time alone in a footer takes no room until it shows. `streamingCaret` (default `false`) shall show the caret after a streaming reply ([UIC-CHAT-TRANSCRIPT-2.13](CHAT-TRANSCRIPT.md#uic-chat-transcript-213---avatar-name-time-and-background)) only while text streams in: its latest part is text with more than spaces, it has no status text, and no thinking or writing line shows; a reply that is thinking, running tools or other activity, a completed or cancelled reply and the reader's own messages show none. Without it no message shows a caret, while every streaming reply stays busy and keeps its thinking line, Stop and announcements. Each message's name keeps its author and time. The date separators between days stay. `sentVariant` shall be the variant of the reader's messages and `receivedVariant` that of everyone else's, an assistant's included, each `bubble` (the default) or `plain`; a notice keeps the default. `receivedVariant="plain"` with avatars and names hidden and times in the footer draws an assistant chat as a column of replies on the page with the reader's messages in bubbles.

Implementation: `src/components/chat/chat-message-display.ts`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat-message-display.test.tsx`, `e2e/chat-display.spec.ts`

## UIC-CHAT-2 - Message commands

### UIC-CHAT-2.1 - Commands offered

Each message shall offer, through `ChatMessageActionsMenu` (an action bar and a context menu), only the commands whose callback the chat has, and none on a deleted message or a notice: Copy (`onCopy`) and the ratings (`onFeedback`, on an assistant's messages) once the message's status is `complete`; in chats between people, Reply (`onReply`) and React (`onReact`) on every message, and Edit (`onEdit`, on the reader's messages that have text) and Delete (`onDelete`) on the reader's own messages; and in an assistant chat, Reply (`onReply`) on every message that has text once its status is `complete`, the reader's and the assistant's alike, so the reader can quote an answer in a follow-up. An assistant chat never offers React, Edit or Delete. A host names Reply as it likes, for example Quote, through the provider strings `reply`, `chatReplyingTo` and `chatCancelReply`.

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

Reply shall move focus to the composer and show above its input a banner (`ui-chat__banner`) that reads the provider string `chatReplyingTo` (`ui-chat__banner-label`) and quotes the message (`ChatQuote`, its author and an excerpt of its text), with a Cancel reply button (`ui-chat__banner-cancel`, the `close` glyph, the `chatCancelReply` string); the banner describes the input. Cancel reply, or Escape in the composer, ends the reply. Sending while replying calls `onReply` with the replied message's id, the text and its tokens instead of `onSend`, and the reply ends once the host accepts it ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)). Reply works the same in an assistant chat. A message whose `replyTo` names a loaded message shows its quote; pressing the quote highlights that message ([UIC-CHAT-TRANSCRIPT-4.3](CHAT-TRANSCRIPT.md)) and moves focus to it.

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

With `onSend`, `Chat` shall end with a `RichMessageComposer` (`ui-chat__composer`) that sends through `onSend` with the text and its tokens; without `onSend` there is no composer. It takes the chat's `placeholder`, `isDisabled`, `isPending` and `onStop`; `@` mentions the participants other than the reader and `/` inserts the chat's `commands`. With a `conversationId` it keeps its draft in the provider's storage under `chat-draft:<conversationId>`, so each conversation has its own draft. Its row of controls holds the chat's composer controls ([UIC-CHAT-3.8](#uic-chat-38---composer-controls)). It takes the chat's `shortcuts` (the chords that send, queue and send at once, [UIC-MESSAGE-COMPOSER-1.2](MESSAGE-COMPOSER.md#uic-message-composer-12---sending)), `minRows` and `maxRows`, and sends a blank message while `allowsEmptySubmit` holds, as when context the host adds carries the request, or while an attachment is complete ([UIC-CHAT-3.5](#uic-chat-35---attachments)); without them it behaves as the composer's defaults say.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.2 - Mention and command tokens

`Chat` shall send each token with its trigger in its `label` (`@Ana Lopez`, `/summarize`), the text the message's pill shows ([UIC-CHAT-PARTS-2.4](CHAT-PARTS.md#uic-chat-parts-24---mention-and-command-tokens)), and give the composer a message's or queued message's tokens by their bare labels when it edits them. A record reference has no trigger: it goes out and comes back with its `id`, `label` and `recordType` unchanged, through `onSend`, `onReply`, `onEdit`, `onQueueChange`, the conversation's stored draft and a refused send.

Implementation: `src/components/chat/chat-model.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-model.test.ts`, `src/components/chat/chat-composer.test.tsx`

### UIC-CHAT-3.3 - Up arrow

In an assistant chat, Up in the empty composer shall recall the chat's `history` ([UIC-MESSAGE-COMPOSER-3.5](MESSAGE-COMPOSER.md#uic-message-composer-35---recalling-earlier-messages)); in a chat between people it edits the reader's last message ([UIC-CHAT-2.5](#uic-chat-25---edit)). While a message waits in the queue, Up edits the newest queued message first ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)).

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.4 - Queue of follow-ups

With a non-empty `queue`, a `ui-chat__queue` shall show above the composer: a label (`ui-chat__queue-label`, the provider string `chatQueuedMessages` with the count) naming an ordered list (`ui-chat__queue-list`) of the queued messages (`ui-chat__queue-item`), each its text (`ui-chat__queue-text`, left out when it has none), its files as a [Chat Attachment](CHAT-ATTACHMENT.md) list (`ui-chat__queue-attachments`, images as thumbnails that open the media viewer) and, with `onQueueChange`, an Edit button (`ui-chat__queue-edit`, the `edit` glyph, `chatEditQueued`) and a Remove button (`ui-chat__queue-remove`, the `close` glyph, `chatRemoveQueued`). Remove calls `onQueueChange` without the message, and focus moves to the next message's Remove, else the previous one's, else the composer. Edit puts the composer in edit mode with the queued text and the banner reading `chatEditingQueued`, and marks the item with `data-editing`; Save calls `onQueueChange` with the new text and tokens, keeping the message's files. When the queued message being edited leaves the queue (sent, removed by the host), or the reader's message being edited is deleted, the edit ends: the banner and `data-editing` go, and the composer sends its text as a new message through `onSend` rather than calling `onQueueChange` or `onEdit`. With `onQueueChange`, the composer also sends while a reply is pending ([UIC-MESSAGE-COMPOSER-3.8](MESSAGE-COMPOSER.md#uic-message-composer-38---sending-while-a-reply-is-pending)), so the host can queue the message. With `onQueueChange` and a queued message, the Up arrow in an empty composer edits the newest queued message, before it edits the reader's last message or recalls earlier prompts ([UIC-CHAT-3.3](#uic-chat-33---up-arrow)); Escape cancels the edit. With `onSendNow`, the composer's `sendNow` chord (Ctrl+Enter by default) while a reply runs calls `onSendNow` with the text and its tokens instead of `onSend`, for a host that stops the reply and sends the message ahead of the queue ([UIC-MESSAGE-COMPOSER-3.10](MESSAGE-COMPOSER.md#uic-message-composer-310---queueing-and-sending-now)); it settles as `onSend` does ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)).

Implementation: `src/components/chat/chat-queue.tsx`, `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-submit.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.5 - Attachments

With `onAttach`, the composer shall attach files from a drop, a paste and an attach button among its controls (the default start controls hold one, [UIC-CHAT-3.8](#uic-chat-38---composer-controls)), or from a "+" menu item ([UIC-CHAT-3.9](#uic-chat-39---composer-menu)), as [UIC-MESSAGE-COMPOSER-3.2](MESSAGE-COMPOSER.md#uic-message-composer-32---attaching-files) says; without it there is no attach button. The chat's `attachments` show above the input as a `ChatAttachmentList` with `onRemoveAttachment` and `onRetryAttachment`, focus going to the composer when the last one is removed; while one of them is `complete`, the message may be sent without text.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.6 - Model picker

A [Chat Model Picker](CHAT-MODEL-PICKER.md) the host places among the composer's controls ([UIC-CHAT-3.8](#uic-chat-38---composer-controls)) shall be disabled while the chat's `isDisabled` holds as well as with its own `isDisabled`, and show its icon alone while the composer is compact ([UIC-CHAT-MODEL-PICKER-1.5](CHAT-MODEL-PICKER.md#uic-chat-model-picker-15---in-a-composer)). The chat holds no choice of its own: the host reads the current model and effort, controlled or reported through `onModelChange` and `onEffortChange`, when it sends the reader's message.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.7 - Accepting a message

`onSend`, `onReply` and `onEdit` may return a promise that resolves once the host accepts the message (a request is stored, for example) and rejects when it does not. While it is pending, the composer publishes `data-submitting` and sends nothing more from that conversation's draft, however often the reader presses Send or the chord ([UIC-MESSAGE-COMPOSER-3.9](MESSAGE-COMPOSER.md#uic-message-composer-39---accepting-a-message)); the reader may keep typing. Once it resolves, the draft empties unless the reader has changed it since, and the reply or the edit ends. When it rejects, or the callback throws, the text, its tokens and the reply's quote stay for another try, and `onSendError` receives the error (without `onSendError` the error is rethrown). A message settles in the conversation it was sent from: switching `conversationId` while it is pending neither clears nor restores another conversation's draft, reply or edit, and returning to the conversation finds its draft emptied once the message was accepted, or kept. A callback that returns nothing is accepted at once, as before. Acceptance is not the reply that follows: once accepted, `isPending` and `onStop` govern the running reply.

Implementation: `src/components/chat/chat-submit.ts`, `src/components/chat/use-chat-state.ts`, `src/utils/use-draft-submission.ts`
Verification: `src/components/chat/chat-submit.test.tsx`, `src/components/message-composer/use-submission.test.tsx`

### UIC-CHAT-3.8 - Composer controls

`composerStartControls` and `composerEndControls` shall fill the start and end of the composer's row of controls ([UIC-MESSAGE-COMPOSER-6](MESSAGE-COMPOSER.md#uic-message-composer-6---controls)), in their order, such as a "+" menu button, an approval select, a plan toggle, a model picker or a checkbox that authorizes the request, so a host adds controls without replacing the composer. Without `composerStartControls`, the start holds the attach button (shown with `onAttach`) and, in a chat between people, the emoji button. Send or Stop ends the row unless the host placed the send button among its controls.

Implementation: `src/components/chat/chat-composer.tsx`, `labs/reference/message-composer.css`
Verification: `src/components/chat/chat-submit.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.9 - Composer menu

A "+" menu button ([UIC-MESSAGE-COMPOSER-5](MESSAGE-COMPOSER.md#uic-message-composer-5---menu)) the host places among the composer's controls shall act on the chat's composer: the text and pills they insert are part of the message `onSend` receives, `attachFiles` hands the chosen files to `onAttach`, and toggles report to the host, which holds their state. The button is disabled while the chat's `isDisabled` holds.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat-host.spec.ts`

### UIC-CHAT-3.10 - Record references

With `getReference`, `Chat` shall draw the record chips of reference tokens with it in the composer ([UIC-MESSAGE-COMPOSER-4.9](MESSAGE-COMPOSER.md#uic-message-composer-49---record-references)) and in every message ([UIC-CHAT-PARTS-2.5](CHAT-PARTS.md#uic-chat-parts-25---record-references)). References come into the composer from the menu's `insertPill` ([UIC-CHAT-3.9](#uic-chat-39---composer-menu)) or a message being edited. A quote's excerpt and copied text read a reference as its label.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/use-message-context.ts`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `src/components/chat/chat-model.test.ts`, `e2e/chat.spec.ts`

### UIC-CHAT-3.11 - Inserting from outside the chat

`composerHandleRef` shall receive a `ChatComposerHandle` bound to the conversation the chat shows, so a host's own control, such as a "+" button beside a record in a sidebar, adds a token to that conversation's draft without replacing the composer. `insertToken({ kind, id, label, recordType? }, { conversationId })` takes the token as `onSend` sends it, such as a record reference ([UIC-CHAT-3.10](#uic-chat-310---record-references)), and inserts it as [UIC-MESSAGE-COMPOSER-4.10](MESSAGE-COMPOSER.md#uic-message-composer-410---inserting-from-outside-the-composer) says, keeping the text, the other pills and the reply's quote, then moves focus to the composer as the chat's own commands do. It returns `inserted`, or changes nothing and returns why: `other-conversation` when the chat no longer shows the conversation the handle was made for or the one `conversationId` names (a delayed callback never reaches another conversation's draft), `disabled`, `editing` while a message or a queued message is edited, `submitting` while a sent message waits for acceptance ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)), or `unavailable` without `onSend`. While a reply runs it inserts. `getDraft()` returns the shown conversation's draft, `{ conversationId, text, tokens }`, and `onDraftChange` receives it when it loads (on mount and on each change of `conversationId`) and after each edit, so the host can skip a token already in the draft and see when one is removed; nothing is deduplicated across conversations or the message history.

Implementation: `src/components/chat/chat-composer-handle.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer-handle.test.tsx`, `e2e/chat-host.spec.ts`

## UIC-CHAT-4 - Activity and receipts

### UIC-CHAT-4.1 - Typing

The typing indicator (`ChatTypingIndicator`) shall show the names of the participants in `typingIds`, the reader left out, whether or not an assistant is thinking. It stays mounted, empty, while nobody types.

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-4.2 - Thinking

An assistant's reply that streams shall end with a status line (`ChatStatusLine`, `ui-chat__status`) while the assistant thinks or acts, as long as `thinkingUntil` asks: while the reply has no parts yet and whenever it has a `statusText`, always; while its latest part is not text (reasoning or a tool call, for example), unless `thinkingUntil` is `content`. With `thinkingUntil` `end` the line also shows while the reply's text streams in, as the `writing` activity: the busy indicator or `thinkingIcon` alone, without text. `thinkingUntil` defaults to `text`. While thinking, the line reads the reply's `statusText`, else the chat's `thinkingText`, else the provider string `chatThinking` ("Thinking…"), and shows `thinkingIcon`, when given, in place of its busy indicator. It is gone once the reply's text streams in without a `statusText` (unless `thinkingUntil` is `end`), once the reply ends, and while it waits for the reader (it then shows as `complete`, [UIC-CHAT-1.4](#uic-chat-14---message-states)).

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`, `e2e/chat.spec.ts`

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

`ChatHeader` shall render a `ui-chat-header` element holding the participants' avatar (`ui-chat-header__avatar`), then the `title` as a heading (`ui-chat-header__title`) one level below its section's (3 outside a section) with the `status` line under it (`ui-chat-header__status`), both in `ui-chat-header__text`, then the `actions` (`ui-chat-header__actions`). One participant shows as a small `Avatar` with their presence, or a decorative one without it; several show as an `AvatarGroup` of three and a count that lists everyone, their presence in words as each person's second line, when pressed. The status line is shown and kept from assistive technology, since the conversation announces the same news where it happens. It forwards `className`, `id` and caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-header.tsx`
Verification: `src/components/chat/chat-header.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-5.3 - Search

With `showSearch`, the header shall offer a search button (`ui-chat__search-toggle`, the `search` glyph, the provider string `chatSearch`, `aria-expanded` and `aria-controls`) that opens a [Find Bar](FIND-BAR.md) under the header (`ui-chat__search`, labelled `chatSearch`) with focus in its find box, and closes it again. The search reads the conversation's data, not its mounted messages, so a virtualized history is searched whole: a message matches when its text holds every term of the query, ignoring case and accents (deleted messages never match). The newest match is current first; Next and Previous (Enter and Shift+Enter) step through the matches and wrap around. The current match is the transcript's highlighted message, so it is mounted, scrolled into view and marked while focus stays in the find box, and the terms are marked in the messages through `TextMatch`. Closing the bar (Escape, Close or the search button) clears the query and moves focus to the current match, or to the search button when there is none.

Implementation: `src/components/chat/chat-search.tsx`, `src/components/chat/chat-model.ts`, `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat-search.test.tsx`, `e2e/chat.spec.ts`

## UIC-CHAT-6 - Attributes

### UIC-CHAT-6.1 - Hooks, strings and caller attributes

`Chat` shall carry the hooks below, append the caller's `className` and forward `id` and caller `data-*` attributes to its root. Its parts keep their own components' hooks beside the slot classes. Its own strings come from the provider (`src/core/strings/chat-widget.ts`).

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-hooks.ts`, `src/core/strings/chat-widget.ts`
Verification: `src/components/chat/chat.test.tsx`

## Hooks

| Hook                         | Kind  | Values | Description                                                                       |
| ---------------------------- | ----- | ------ | --------------------------------------------------------------------------------- |
| `ui-chat`                    | root  |        | The conversation.                                                                 |
| `ui-chat__search-toggle`     | slot  |        | The header's search button (also `ui-button`).                                    |
| `ui-chat__search`            | slot  |        | The search bar under the header (also `ui-find-bar`).                             |
| `ui-chat__transcript`        | slot  |        | The transcript (also `ui-chat-transcript`).                                       |
| `ui-chat__typing`            | slot  |        | Who is typing (also `ui-chat-typing-indicator`).                                  |
| `ui-chat__status`            | slot  |        | In a reply: what the assistant is thinking or doing (also `ui-chat-status-line`). |
| `ui-chat__queue`             | slot  |        | The queue of follow-ups above the composer.                                       |
| `ui-chat__queue-label`       | slot  |        | The queue's label, with its count.                                                |
| `ui-chat__queue-list`        | slot  |        | The ordered list of queued messages.                                              |
| `ui-chat__queue-item`        | slot  |        | One queued message.                                                               |
| `ui-chat__queue-text`        | slot  |        | A queued message's text.                                                          |
| `ui-chat__queue-attachments` | slot  |        | A queued message's files (also `ui-chat-attachment-list`).                        |
| `ui-chat__queue-edit`        | slot  |        | Edit a queued message (also `ui-button`).                                         |
| `ui-chat__queue-remove`      | slot  |        | Remove a queued message (also `ui-button`).                                       |
| `ui-chat__composer`          | slot  |        | The composer (also `ui-message-composer`).                                        |
| `ui-chat__banner`            | slot  |        | The reply or edit banner's text, inside the composer's banner.                    |
| `ui-chat__banner-label`      | slot  |        | What the banner is about: replying, or editing.                                   |
| `ui-chat__banner-cancel`     | slot  |        | Cancel reply (also `ui-button`).                                                  |
| `data-editing`               | state | `true` | On a queued message the composer edits.                                           |
| `ui-chat-header`             | root  |        | The header.                                                                       |
| `ui-chat-header__avatar`     | slot  |        | The participants' avatar or avatar group.                                         |
| `ui-chat-header__text`       | slot  |        | The title and the status line.                                                    |
| `ui-chat-header__title`      | slot  |        | The title, a heading.                                                             |
| `ui-chat-header__status`     | slot  |        | Who is typing, or what the assistant is doing.                                    |
| `ui-chat-header__actions`    | slot  |        | The search button and the host's controls.                                        |
