# Chat

`Chat` is a whole conversation drawn from the host's messages and callbacks: an optional header with the participants, a search within the conversation and the host's controls; a [Chat Transcript](CHAT-TRANSCRIPT.md) whose messages hold their [Chat Parts](CHAT.md) and the [Chat Message Actions](CHAT.md) the host allows, a streaming reply saying what the assistant is thinking or doing; who is typing; the queue of follow-ups; and the rich [Message Composer](MESSAGE-COMPOSER.md), with an optional [Chat Model Picker](CHAT.md) among its tools. It serves assistant chats (an assistant among the participants: streaming, tool calls, approvals, questions, plans) and chats between people (one to one or in groups: delivery, replies, edits, reactions, read receipts, unread messages). It holds no conversation state of its own: the host owns the messages, or spreads a [Chat Controller](CHAT.md)'s `props` into it. `Chat` is inline; a host places it in a page, a [Drawer](DRAWER.md) or a [Popover](POPOVER.md). `ChatHeader` is the header, also usable on its own.

The conversation's model is [Chat Parts](CHAT.md)' `ChatMessageData` and `ChatParticipant`. A conversation is an assistant chat when a participant's `kind` is `assistant`, and a chat between people otherwise.

The [full Chat lab](../labs/chat.html) links to focused family examples: [activity](../labs/chat-activity.html), [controller](../labs/chat-controller.html), [conversation list](../labs/chat-list.html), [message actions](../labs/chat-message-actions.html), [model picker](../labs/chat-model-picker.html), [message parts](../labs/chat-parts.html), [questions](../labs/chat-question.html), [sources](../labs/chat-sources.html) and [tool calls](../labs/chat-tool-call.html). They share this contract and the Chat reference partial, while keeping their example pages independently usable.

## UIC-CHAT-1 - Conversation

### UIC-CHAT-1.1 - Entry point

`Chat`, `ChatHeader` and their prop types shall be exported only from `@flamboyantengineer/ui-components/chat`, not from the package root, since the composer is the rich composer ([UIC-MESSAGE-COMPOSER-4.1](MESSAGE-COMPOSER.md#uic-message-composer-41---entry-point-and-engine)) and loads ProseMirror; the root and every other component stay free of it.

Implementation: `src/components/chat/index.ts`, `src/index.ts`
Verification: `src/components/chat/chat.test.tsx`

### UIC-CHAT-1.2 - Layout

`Chat` shall render a `ui-chat` root holding, in order: the header ([UIC-CHAT-5.1](#uic-chat-51---header)), the search bar while open ([UIC-CHAT-5.3](#uic-chat-53---search)), the transcript (`ui-chat__transcript`), the typing indicator (`ui-chat__typing`, [UIC-CHAT-4.1](#uic-chat-41---typing)), the queue ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)), the progress line (`ui-chat__progress`, [UIC-CHAT-3.13](#uic-chat-313---waiting-for-the-host)), the composer ([UIC-CHAT-3.1](#uic-chat-31---composer)) and the disclaimer ([UIC-CHAT-1.9](#uic-chat-19---disclaimer)). The transcript's feed is named by the caller's `aria-label` or `aria-labelledby`, else by `title`, else by the provider string `conversation`; `aria-describedby` and `aria-details` go to it too. The typing indicator sits outside the feed, which holds only messages and their separators; what the assistant is thinking or doing shows inside its reply ([UIC-CHAT-4.2](#uic-chat-42---thinking)).

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.3 - Messages and their authors

Each message shall render as a `ChatMessage` with a generated instance-unique DOM `id`, keeping its opaque message identity in `data-message-id` and its transcript child key, with its author drawn from the participant named by `authorId`: the participant's identity and presence, without the participant's `kind`, an assistant's avatar `rounded` unless the participant names its own `shape`. The origin is `sent` for the reader's messages (`currentUserId`), `system` for a message without an author and `received` otherwise; the time is `createdAt`, read against `getNow`.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`, `src/components/chat/chat-instance-identity.test.tsx`

### UIC-CHAT-1.4 - Message states

Each message shall show its `status`, `delivery`, `error`, `isEdited` and `isDeleted` through `ChatMessage`. A reply whose status is `streaming` while one of its parts waits for the reader ([UIC-CHAT-13.5](CHAT.md)) shows as `complete`, so it is not busy and assistive technology does not hide the card that asks. With `onRetry`, a message whose status is `error` or whose delivery is `failed` offers Retry, which calls `onRetry` with its id.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-1.5 - Parts

Standalone tool rows shall use the same expansion store as grouped calls, keyed by conversation, message and part identity. Pending question choices, literal free text and selected step shall survive virtual unmounts through a conversation-owned ephemeral store; another conversation starts fresh even when IDs repeat. Polling and unrelated additions shall preserve these choices.

Each message's content shall be its `parts` drawn by `ChatParts` with the message's id as `messageId`, streaming while the message's status is `streaming`, and the chat's `textFormat`, `expandsActivity`, `toolRenderers`, `toolGlyphs`, `onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`, `questionAnsweredMark`, `onApplyCode` and `renderPart`. The chat keeps the reader's open and closed choices of each message's parts and passes them back as `expandedParts`, so they survive the message being unmounted and mounted again, as in a virtualized history. `onAnswerQuestion` and `onDismissQuestion` may return a promise, which the question card awaits ([UIC-CHAT-32.7](CHAT.md)); without `onAnswerQuestion` question cards are read-only. When `conversationId` changes, every message's parts start afresh, so a card's drafts and unsettled request never carry over to another conversation, even where message and part ids repeat. The transcript starts over too ([UIC-CHAT-TRANSCRIPT-3.7](CHAT-TRANSCRIPT.md#uic-chat-transcript-37---messages-register-with-the-transcript)): the new conversation asks for its older messages and reports what is read on its own, and the previous one's pending reports never arrive. A message that did not change does not render again while a reply streams, whatever the identity of these callbacks, `getNow` and the command callbacks. Event callbacks (`onApprove`, the command callbacks and the like) are present while the chat's are and call the one of the latest render. The options a message calls while it renders (`renderPart`, `getReference`, `getNow` and the tool renderers) are the ones of the render it last rendered in: a message that renders again draws with the latest ones, and every message renders again when one of them is set or unset or a tool renderer is added, removed or replaces another layout. `thinkingIcon`, `feedbackReasons` and `toolGlyphs` are compared by what they hold, so an icon element, a list or a map written inline keeps the messages too.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-chat-state.ts`, `src/components/chat/use-message-context.ts`, `src/utils/use-retained-state.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-message-memo.test.tsx`, `e2e/chat.spec.ts`, `src/components/chat/chat-retained-inputs.test.tsx`, `e2e/chat-native.spec.ts`

### UIC-CHAT-1.6 - Days, groups and unread

The messages shall be laid out by `groupChatMessages` ([UIC-CHAT-TRANSCRIPT-6](CHAT-TRANSCRIPT.md)): a `ChatDateSeparator` (read against `getNow`) before each day, the `ChatUnreadDivider` before `firstUnreadId`, and each message's group position. Days follow the reader's time zone from the provider ([UIC-PROVIDER](PROVIDER.md)): the provider's `timeZone`, else UTC on the server and while hydrating and the device's after, so a server render and its hydration lay out the same days.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`, `src/components/chat/chat-server.test.tsx`

### UIC-CHAT-1.7 - Transcript behaviour

The transcript shall scroll in `scrollMode`, by default `anchor` in an assistant chat and `follow` otherwise, and take `presentation`, `emptyState`, `onLoadOlder`, `hasOlder`, `isLoadingOlder`, `firstUnreadId` and `onRead` as [Chat Transcript](CHAT-TRANSCRIPT.md) does. Its history is virtualized ([UIC-CHAT-TRANSCRIPT-1.6](CHAT-TRANSCRIPT.md#uic-chat-transcript-16---virtualized-history)) unless `virtualized={false}`, so a long conversation opens, scrolls and answers the pointer as quickly as a short one; the chat's search ([UIC-CHAT-5.3](#uic-chat-53---search)) reads the history whole, while the browser's own find reaches only the mounted messages. `virtualized={false}` keeps every message in the page, at a cost that grows with the conversation. Escape from a focused message (the transcript's second Escape) moves focus to the composer. `emptyState` shows only while there are no messages and is never one of them: an assistant chat's welcome composes it from stock parts, an [Empty State](EMPTY-STATE.md) whose title and description say what the assistant is for and whose `actions` are suggested first questions that send themselves through the host, or none, so the first message replaces it, nothing of it enters the history, and a new empty conversation (a [Chat Controller](CHAT.md)'s `resetConversation`) shows it again. The host writes the welcome and the questions; the disclaimer ([UIC-CHAT-1.9](#uic-chat-19---disclaimer)) stays apart from it.

Implementation: `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-virtualization.test.tsx`, `e2e/chat.spec.ts`, `e2e/chat-empty.spec.ts`, `e2e/chat-long.spec.ts`, `labs/src/chat-native-samples.test.tsx`

### UIC-CHAT-1.8 - Message display

`showAvatars={false}` and `showAuthorNames={false}` shall hide every message's avatar and author's name, both defaulting to `true`, and `timePlacement` shall place every message's time in its header (`header`, the default), under it in its footer (`footer`), which the reference stylesheet shows with the message's actions while it is hovered or holds focus, in a tooltip while it is hovered or holds focus (`tooltip`), or nowhere (`none`) ([UIC-CHAT-TRANSCRIPT-2.13](CHAT-TRANSCRIPT.md#uic-chat-transcript-213---avatar-name-time-and-background)); `activityTimePlacement`, with the same choices and defaulting to `timePlacement`, shall place instead the time of a message without written text: one with no text part holding more than spaces, unless deleted, such as tool calls, reasoning, plans, sources, files or custom parts alone or together, or a streaming reply with nothing written yet, so a chat can show its written messages' times and leave out its activity's. A written message with sources keeps its one time; sources have no time of their own. `collapseFooterTime` (default `false`) shall pass to every message, so a time alone in a footer takes no room until it shows. `streamingCaret` (default `false`) shall show the caret after a streaming reply ([UIC-CHAT-TRANSCRIPT-2.13](CHAT-TRANSCRIPT.md#uic-chat-transcript-213---avatar-name-time-and-background)) only while text streams in: its latest part is text with more than spaces, it has no status text, and no thinking or writing line shows; a reply that is thinking, running tools or other activity, a completed or cancelled reply and the reader's own messages show none. Without it no message shows a caret, while every streaming reply stays busy and keeps its thinking line, Stop and announcements. Each message's name keeps its author and time. The date separators between days stay. `sentVariant` shall be the variant of the reader's messages and `receivedVariant` that of everyone else's, an assistant's included, each `bubble` (the default) or `plain`; a notice keeps the default. `receivedVariant="plain"` with avatars and names hidden and times in the footer draws an assistant chat as a column of replies on the page with the reader's messages in bubbles.

Implementation: `src/components/chat/chat-message-display.ts`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat-message-display.test.tsx`, `e2e/chat-display.spec.ts`

### UIC-CHAT-1.9 - Disclaimer

With a non-empty `disclaimer`, `Chat` shall draw it last, in `ui-chat__disclaimer`, below the composer and outside both the scrolling transcript and the composer's frame, so it stays in view in an empty conversation and while a reply streams, and never takes room from the composer's controls. The caller writes and translates it, as in an assistant chat's "AI can make mistakes. Check important information."; the library adds no wording of its own, so a chat between people shows none unless its host asks. It is ordinary content: not a live region, so a streaming reply never announces it again. Without a disclaimer (omitted, `null`, `false` or empty text) nothing is drawn. The reference sheet sets it in small muted text, centred, wrapping within a narrow panel.

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-hooks.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-1.10 - Embedded reference layout

The reference styles shall let Chat fill a bounded flex-column LoadingRegion, constrain long titles while preserving actions, align plain received content to the logical start, center Jump to latest and keep end controls at the trailing edge, including RTL and wrapping. The host supplies a bounded height and flex sizing/minimums for its own ancestor panels; page placement, sidebars and breakpoints belong to the host. The queue shall sit on the composer's top edge as a box a little narrower than the composer, with only its top corners rounded, without file-change summaries or unrelated host actions.

Implementation: `labs/reference/chat.css`, `labs/reference/chat-transcript.css`, `labs/reference/message-composer.css`, `labs/reference/loading-overlay.css`
Verification: `e2e/chat-native.spec.ts`

## UIC-CHAT-2 - Message commands

### UIC-CHAT-2.1 - Commands offered

Each message shall offer, through `ChatMessageActionsMenu` (an action bar and a context menu), only the commands whose callback the chat has, and none on a deleted message or a notice: Copy (`onCopy`) and the ratings (`onFeedback`, on an assistant's messages) once the message's status is `complete`; in chats between people, Reply (`onReply`) and React (`onReact`) on every message, and Edit (`onEdit`, on the reader's messages that have text) and Delete (`onDelete`) on the reader's own messages; and in an assistant chat, Reply (`onReply`) on every message that has text once its status is `complete`, the reader's and the assistant's alike, so the reader can quote an answer in a follow-up. An assistant chat never offers React, Edit or Delete. A host names Reply as it likes, for example Quote, through the provider strings `reply`, `chatReplyingTo` and `chatCancelReply`. `messageMenuIcons` sets the icons of every message's menu commands, as `ChatMessageActionsMenu`'s `menuIcons` ([UIC-CHAT-21.1](CHAT.md#uic-chat-211---menu)); a map written inline keeps the messages, as `feedbackReasons` does.

Implementation: `src/components/chat/chat-commands.ts`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-message-context.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`

### UIC-CHAT-2.2 - Copy and feedback

Copy shall put the message's text on the clipboard, its text parts then its code, one block each, and call `onCopy` with the message's id once it is there. The ratings show the message's `feedback`, offer the chat's `feedbackReasons`, and call `onFeedback` with the message's id and the reader's feedback.

Implementation: `src/components/chat/chat-commands.ts`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`, `src/components/chat/chat-instance-identity.test.tsx`

### UIC-CHAT-2.3 - Reactions

A message's `reactions` (`ChatReaction` values) shall show in a [Reaction Bar](REACTION-BAR.md), in every chat, whoever reacted: the reader, other people or an assistant. A reaction names who reacted as participants (`participantIds`), by name (`people`, a `ReactionEntry`'s field), or both: each chip is named by the participants' names first, then `people` ([UIC-REACTION-BAR-1.2](REACTION-BAR.md#uic-reaction-bar-12---who-reacted)), such as `👍 1, reacted by Trip planner`, and counts them both when `count` is missing; a participant missing from `participants` still counts. The reader reacts, and the chip is pressed, when `isReacted` is true or `participantIds` holds `currentUserId`. In a chat between people with `onReact`, toggling a chip and choosing an emoji through React call `onReact` with the message's id, the emoji and whether the reader now reacts with it; in an assistant chat the reactions are read-only.

`setChatReaction(messages, { messageId, emoji, participantId, isReacted? })` shall return the conversation with that participant's reaction added (`isReacted` defaults to true) or taken back: it joins the end of the reaction's `participantIds`, a new reaction joins the end of the message's reactions, an explicit `count` steps by one, and a reaction that no longer counts anyone leaves the message. It returns the same array, and leaves the messages unchanged, when the participant already reacts that way or no message has the id. Hosts use it for agents' reactions and for the reader's `onReact`.

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-commands.ts`, `src/components/chat/chat-reactions.ts`
Verification: `src/components/chat/chat-commands.test.ts`, `src/components/chat/chat.test.tsx`, `src/components/chat/chat-reactions.test.tsx`

### UIC-CHAT-2.4 - Reply

Reply shall move focus to the composer and show above its input a banner (`ui-chat__banner`) that reads the provider string `chatReplyingTo` (`ui-chat__banner-label`) and quotes the message (`ChatQuote`, its author and an excerpt of its text), with a Cancel reply button (`ui-chat__banner-cancel`, the `close` glyph, the `chatCancelReply` string); the banner describes the input. Cancel reply, or Escape in the composer, ends the reply; an Escape that belongs to an input method composition (`isComposing`, or key code 229) is the input method's and keeps the reply. The Escape that ends a reply is marked handled, so a Dialog or Drawer around the chat stays open until the next Escape. Sending while replying calls `onReply` with the replied message's id, the text and its tokens instead of `onSend`, and the reply ends once the host accepts it ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)). A reply whose message leaves `messages` or is deleted (`isDeleted`) ends at once: the banner goes, the composer keeps its text and sends it through `onSend`, and the message coming back does not bring the reply back. Reply works the same in an assistant chat. A message whose `replyTo` names a loaded message shows its quote; pressing the quote highlights that message ([UIC-CHAT-TRANSCRIPT-4.3](CHAT-TRANSCRIPT.md)) and moves focus to it. The highlight is a mark of the jump and ends after two seconds, so pressing the quote again jumps there again, and a search that ends or loses its match ([UIC-CHAT-5.3](#uic-chat-53---search)) never falls back to a message a quote jumped to earlier.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-banner.tsx`, `src/components/chat/chat-message-view.tsx`, `src/components/chat/use-chat-state.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`, `src/components/chat/chat-reply-target.test.tsx`, `src/components/chat/chat-quote-jump.test.tsx`, `src/components/chat/chat-instance-identity.test.tsx`

### UIC-CHAT-2.5 - Edit

Edit, and Up in the empty composer of a chat between people with `onEdit` (on the reader's last message that has text), shall put the composer in edit mode ([UIC-MESSAGE-COMPOSER-3.3](MESSAGE-COMPOSER.md#uic-message-composer-33---edit-mode)) with the message's first text part and its tokens, move focus to it, and show the banner reading the provider string `chatEditingMessage`. Edit and Reply move focus at once and again two frames later, for a command run from a menu that hands focus back to where it opened only then; a key or a pointer the reader presses in between keeps focus where they put it. Save calls `onEdit` with the message's id, the text and its tokens; Cancel and Escape leave edit mode. The edit holds while it stays the same session and target (the conversation, whether it edits a message or a queued one, and its id), whatever else changes in the message, as when a reaction arrives or the host applies a save the reader goes on editing after; Edit on another message, or on a queued message with the same id, starts again from that message's words even when they are the same, so an unsaved edit is never saved to another message.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-banner.tsx`, `src/components/chat/use-chat-state.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`, `src/components/chat/chat-edit-target.test.tsx`, `src/components/chat/chat-progress.test.tsx`

### UIC-CHAT-2.6 - Delete

Delete shall call `onDelete` with the message's id once the reader confirms ([UIC-CHAT-20.3](CHAT.md)).

Implementation: `src/components/chat/chat-commands.ts`
Verification: `src/components/chat/chat-commands.test.ts`

## UIC-CHAT-3 - Composer

### UIC-CHAT-3.1 - Composer

With `onSend`, `Chat` shall end with a `RichMessageComposer` (`ui-chat__composer`) that sends through `onSend` with the text and its tokens; without `onSend` there is no composer. It takes the chat's `placeholder`, `isDisabled`, `isPending` and `onStop`; `@` mentions the participants other than the reader and `/` inserts the chat's `commands`. With a `conversationId` it keeps its draft in the provider's storage under `chat-draft:<conversationId>`, so each conversation has its own draft. Its row of controls holds the chat's composer controls ([UIC-CHAT-3.8](#uic-chat-38---composer-controls)). It takes the chat's `shortcuts` (the chords that send, queue and send at once, [UIC-MESSAGE-COMPOSER-1.2](MESSAGE-COMPOSER.md#uic-message-composer-12---sending)), `minRows` and `maxRows`, and sends a blank message while `allowsEmptySubmit` holds, as when context the host adds carries the request, or while an attachment is complete ([UIC-CHAT-3.5](#uic-chat-35---attachments)); without them it behaves as the composer's defaults say.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.2 - Mention and command tokens

`Chat` shall send each token with its trigger in its `label` (`@Ana Lopez`, `/summarize`), the text the message's pill shows ([UIC-CHAT-26.4](CHAT.md#uic-chat-264---mention-and-command-tokens)), and give the composer a message's or queued message's tokens by their bare labels when it edits them. A record reference has no trigger: it goes out and comes back with its `id`, `label` and `recordType` unchanged, through `onSend`, `onReply`, `onEdit`, `onQueueChange`, the conversation's stored draft and a refused send.

Implementation: `src/components/chat/chat-model.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-model.test.ts`, `src/components/chat/chat-composer.test.tsx`

### UIC-CHAT-3.3 - Up arrow

In an assistant chat, Up in the empty composer shall recall the chat's `history` ([UIC-MESSAGE-COMPOSER-3.5](MESSAGE-COMPOSER.md#uic-message-composer-35---recalling-earlier-messages)); in a chat between people it edits the reader's last message ([UIC-CHAT-2.5](#uic-chat-25---edit)). While a message waits in the queue, Up edits the newest queued message first ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)).

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.4 - Queue of follow-ups

Each editable queue row shall order its controls as a reorder handle (`queue-handle`, `chatReorderQueued`), truncated text, Steer, Delete, and a three-dot menu (`queue-menu`, `chatQueueActions`) containing Edit (`queue-edit`). The count remains the accessible list label. React Aria supplies pointer and keyboard drag/drop; only the handle arms pointer dragging. Accepted reorders call `onQueueChange` with the full reordered queue, preserving IDs, quotes, tokens and attachments. Queued messages are not transcript children: the host admits through `onSend`, and the controller appends to `queue` directly while pending, adding a transcript message only on dequeue or Steer.

The reference stylesheet shall keep reorder handles at the same square button size when text truncates, aligning handles and message starts across rows. The queue uses a compact leading inset without additional row indentation, following the document direction.

With a non-empty `queue`, a `ui-chat__queue` shall show above the composer: a label (`ui-chat__queue-label`, the provider string `chatQueuedMessages` with the count) naming an ordered list (`ui-chat__queue-list`) of the queued messages (`ui-chat__queue-item`), each its text (`ui-chat__queue-text`, left out when it has none), its files as a [Chat Attachment](ATTACHMENT.md) list (`ui-chat__queue-attachments`, images as thumbnails that open the media viewer) with `onSteer`, a Steer button (`ui-chat__queue-steer`, the `send` glyph, `chatSteerQueued`) on every message but the one the composer edits, and, with `onQueueChange`, an Edit menu item (`ui-chat__queue-edit`, the `edit` glyph, `chatEditQueued`) and a Remove button (`ui-chat__queue-remove`, the `delete` glyph, `chatRemoveQueued`). Steer calls `onSteer` with the message's id, whatever its place in the queue, for a host that sends it into the conversation now, ahead of the rest of the queue (the [Chat Controller](CHAT.md#uic-chat-125---queue) stops the running reply and sends it); the message the composer edits has none, so an unsaved edit is never sent or lost. `onSteer` and `onQueueChange` may return a promise that settles once the host has done it: while a steer's promise is pending its message publishes `data-steering` and the other messages' Steer buttons are disabled, in the conversation (`conversationId`) the steer started in only, and a Steer or Remove button whose promise is still pending after 400 ms shows itself busy ([UIC-BUTTON-2.2](BUTTON.md#uic-button-22---pending)); a rejection, or a throw, goes to `onSendError` (without it the error is rethrown), and the message stays. Remove calls `onQueueChange` without the message; removing the message the composer edits ends the edit at once, without waiting for the host's new `queue`. While the promise of a removal is pending, the next queue the chat builds (another removal, a saved edit, a reorder) leaves that message out too, so a change made before the host's new `queue` arrives never brings a removed message back. When a message leaves the queue through Steer or Remove, focus moves to the next message's Remove, else the previous one's, else the composer. Edit puts the composer in edit mode with the queued text and the banner reading `chatEditingQueued`, marks the item with `data-editing` and calls `onQueuedEditChange` with the message's id, and the edit's end (Save, Cancel, Escape, Remove, the message leaving the queue, another edit or reply) calls it with `undefined`, so the host holds that message back meanwhile, from the queue and from Steer; Save calls `onQueueChange` with the new text and tokens, keeping the message's files, and the edit ends once the host accepts it, as an edit of a message does ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)). When the queued message being edited leaves the queue (sent, removed by the host), or the reader's message being edited is deleted, the edit ends: the banner and `data-editing` go, and the composer sends its text as a new message through `onSend` rather than calling `onQueueChange` or `onEdit`. With `onQueueChange`, the composer also sends while a reply is pending ([UIC-MESSAGE-COMPOSER-3.8](MESSAGE-COMPOSER.md#uic-message-composer-38---sending-while-a-reply-is-pending)), so the host can queue the message. With `onQueueChange` and a queued message, the Up arrow in an empty composer edits the newest queued message, before it edits the reader's last message or recalls earlier prompts ([UIC-CHAT-3.3](#uic-chat-33---up-arrow)); Escape cancels the edit. With `onSendNow`, the composer's `sendNow` chord (Ctrl+Enter by default) while a reply runs calls `onSendNow` with the text and its tokens instead of `onSend`, for a host that stops the reply and sends the message ahead of the queue ([UIC-MESSAGE-COMPOSER-3.10](MESSAGE-COMPOSER.md#uic-message-composer-310---queueing-and-sending-now)); it settles as `onSend` does ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)).

Implementation: `src/components/chat/chat-queue.tsx`, `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-submit.ts`, `src/components/chat/chat-queue-item.tsx`, `src/components/chat/chat-queue-reorder.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`, `e2e/chat-native.spec.ts`, `e2e/chat-queue-layout.spec.ts`

### UIC-CHAT-3.5 - Attachments

With `onAttach`, the composer shall attach files from a drop, a paste and an attach button among its controls (the default start controls hold one, [UIC-CHAT-3.8](#uic-chat-38---composer-controls)), or from a "+" menu item ([UIC-CHAT-3.9](#uic-chat-39---composer-menu)), as [UIC-MESSAGE-COMPOSER-3.2](MESSAGE-COMPOSER.md#uic-message-composer-32---attaching-files) says; without it there is no attach button. The chat's `attachments` show above the input as a `AttachmentList` with `onRemoveAttachment` and `onRetryAttachment` (left out while the chat is disabled, so a locked message offers no Remove or Retry, and restored when it is enabled again), focus going to the composer when the last one is removed; while one of them is `complete`, the message may be sent without text.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.6 - Model picker

A [Chat Model Picker](CHAT.md) the host places among the composer's controls ([UIC-CHAT-3.8](#uic-chat-38---composer-controls)) shall be disabled while the chat's `isDisabled` holds as well as with its own `isDisabled`, and show its icon alone while the composer is compact ([UIC-CHAT-22.5](CHAT.md#uic-chat-225---in-a-composer)). The chat holds no choice of its own: the host reads the current model and effort, controlled or reported through `onModelChange` and `onEffortChange`, when it sends the reader's message.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.7 - Accepting a message

`onSendNow(text: string, tokens?: readonly ChatTextToken[], replyTo?: string): void | Promise<unknown>` shall receive the active quoted message ID through both its immediate chord and automatic steering. It submits text, tokens and quote exactly once. Synchronous acceptance clears the submitted draft and quote synchronously; a throw or rejected promise preserves them. Late acceptance respects the original conversation, reply session and any draft typed meanwhile.

`onSend`, `onSendNow`, `onReply`, `onEdit` and, for a queued message's edit, `onQueueChange` may return a promise that resolves once the host accepts the message (a request is stored, for example) and rejects when it does not. While it is pending, the composer publishes `data-submitting` and sends nothing more from that conversation's draft, however often the reader presses Send or the chord ([UIC-MESSAGE-COMPOSER-3.9](MESSAGE-COMPOSER.md#uic-message-composer-39---accepting-a-message)); the reader may keep typing. Once it resolves, the draft empties unless the reader has changed it since (even to the same words again), and the reply or the edit ends only if it is the same session (the reader has not left it, the conversation included, or started an edit or reply again since sending, even on the same message with the same words) and the composer still shows the message that was sent: words the reader added to the edit or reply while it waited stay, with its banner, for another Save or Send. When it rejects, or the callback throws, the text, its tokens and the reply's quote stay for another try, and `onSendError` receives the error (without `onSendError` the error is rethrown). A message settles in the conversation it was sent from: switching `conversationId` while it is pending neither clears nor restores another conversation's draft, reply or edit, and returning to the conversation finds its draft emptied once the message was accepted, or kept. A callback that returns nothing is accepted at once, as before. Acceptance is not the reply that follows: once accepted, `isPending` and `onStop` govern the running reply.

Implementation: `src/components/chat/chat-submit.ts`, `src/components/chat/use-chat-state.ts`, `src/utils/use-draft-submission.ts`, `src/components/message-composer/composer-message.ts`
Verification: `src/components/chat/chat-submit.test.tsx`, `src/components/message-composer/use-submission.test.tsx`, `src/components/chat/chat-edit-session.test.tsx`, `src/components/chat/chat-immediate-reply.test.tsx`

### UIC-CHAT-3.8 - Composer controls

`composerStartControls` and `composerEndControls` shall fill the start and end of the composer's row of controls ([UIC-MESSAGE-COMPOSER-6](MESSAGE-COMPOSER.md#uic-message-composer-6---controls)), in their order, such as a "+" menu button, an approval select, a plan toggle, a model picker or a checkbox that authorizes the request, so a host adds controls without replacing the composer. Without `composerStartControls`, the start holds the attach button (shown with `onAttach`) and, in a chat between people, the emoji button. Send or Stop ends the row unless the host placed the send button among its controls.

Implementation: `src/components/chat/chat-composer.tsx`, `labs/reference/message-composer.css`
Verification: `src/components/chat/chat-submit.test.tsx`, `e2e/chat.spec.ts`

### UIC-CHAT-3.9 - Composer menu

A "+" menu button ([UIC-MESSAGE-COMPOSER-5](MESSAGE-COMPOSER.md#uic-message-composer-5---menu)) the host places among the composer's controls shall act on the chat's composer: the text and pills they insert are part of the message `onSend` receives, `attachFiles` hands the chosen files to `onAttach`, and toggles report to the host, which holds their state. The button is disabled while the chat's `isDisabled` holds.

Implementation: `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer.test.tsx`, `e2e/chat-host.spec.ts`

### UIC-CHAT-3.10 - Record references

With `getReference`, `Chat` shall draw the record chips of reference tokens with it in the composer ([UIC-MESSAGE-COMPOSER-4.9](MESSAGE-COMPOSER.md#uic-message-composer-49---record-references)) and in every message ([UIC-CHAT-26.5](CHAT.md#uic-chat-265---record-references)). References come into the composer from the menu's `insertPill` ([UIC-CHAT-3.9](#uic-chat-39---composer-menu)) or a message being edited. A quote's excerpt and copied text read a reference as its label.

Implementation: `src/components/chat/chat-composer.tsx`, `src/components/chat/use-message-context.ts`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat-composer.test.tsx`, `src/components/chat/chat-model.test.ts`, `e2e/chat.spec.ts`

### UIC-CHAT-3.11 - Inserting from outside the chat

Focus retries after insertion or an edit/reply command shall yield to a newer pointer or keyboard action, so opening the queue's action menu immediately after insertion remains possible.

`composerHandleRef` shall receive a `ChatComposerHandle` bound to the conversation the chat shows, so a host's own control, such as a "+" button beside a record in a sidebar, adds a token to that conversation's draft without replacing the composer. `insertToken({ kind, id, label, recordType? }, { conversationId })` takes the token as `onSend` sends it, such as a record reference ([UIC-CHAT-3.10](#uic-chat-310---record-references)), and inserts it as [UIC-MESSAGE-COMPOSER-4.10](MESSAGE-COMPOSER.md#uic-message-composer-410---inserting-from-outside-the-composer) says, keeping the text, the other pills and the reply's quote, then moves focus to the composer as the chat's own commands do. It returns `inserted`, or changes nothing and returns why: `other-conversation` when the chat no longer shows the conversation the handle was made for or the one `conversationId` names (a delayed callback never reaches another conversation's draft), `disabled`, `editing` while a message or a queued message is edited, `submitting` while a sent message waits for acceptance ([UIC-CHAT-3.7](#uic-chat-37---accepting-a-message)), or `unavailable` without `onSend`. While a reply runs it inserts. `getDraft()` returns the shown conversation's draft, `{ conversationId, text, tokens }`, and `onDraftChange` receives it when it loads (on mount and on each change of `conversationId`) and after each edit, so the host can skip a token already in the draft and see when one is removed; nothing is deduplicated across conversations or the message history.

Implementation: `src/components/chat/chat-composer-handle.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer-handle.test.tsx`, `e2e/chat-host.spec.ts`

### UIC-CHAT-3.12 - Composer selection, paste and triggers

The chat shall forward the rich composer's range contract ([UIC-MESSAGE-COMPOSER-4.11](MESSAGE-COMPOSER.md#uic-message-composer-411---selection-and-ranges) to [4.13](MESSAGE-COMPOSER.md#uic-message-composer-413---host-triggers)):

- `composerInputId` is the composer's text box id, apart from the chat's `id`.
- `triggers` are the host's own trigger vocabularies.
- `onComposerPaste` is the composer's `onPaste`.
- `onComposerSelectionChange` is its `onSelectionChange`.

The `ChatComposerHandle` adds `getSelection`, `setSelection`, `replaceRange` and `replaceSelection`. Each takes `{ conversationId }` as `insertToken` does. A fragment's tokens may carry their labels as `onSend` sends them, trigger included. When the chat no longer shows the handle's conversation, or the one asked for, `getSelection` returns `null` and the others return `other-conversation`. Otherwise they return what the composer returns.

Implementation: `src/components/chat/chat-composer-handle.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-composer-handle.test.tsx`

### UIC-CHAT-3.13 - Waiting for the host

While the composer is shown, `Chat` shall render, above the queue and the composer, a `ui-chat__progress` polite live region (`role="status"`). While a promise from `onSend`, `onSendNow`, `onReply`, `onEdit`, `onQueueChange` or `onSteer` has been pending for 400 ms, it shows what the chat waits for: an icon (`ui-chat__progress-icon`) and the provider string `chatProgress` (`ui-chat__progress-label`) for the action, which it publishes as `data-action`: `send` ("Sending…", also a reply), `queue` ("Queuing…", a message sent while a reply runs with `onQueueChange`), `steer` ("Steering…", `onSteer`, `onSendNow` and a message that steers, [UIC-CHAT-3.14](#uic-chat-314---sending-options)), `save` ("Saving…", an edit of a message or a queued one) or `remove` ("Removing…"). It is empty otherwise, so a host that answers within 400 ms never shows it, and the reader hears the line once as it appears. The icon is the clock glyph a message waiting for delivery shows ([UIC-CHAT-TRANSCRIPT-2.8](CHAT-TRANSCRIPT.md#uic-chat-transcript-28---delivery)), unless `progressIcon` replaces it: `true` shows the library's `Spinner`, an element shows itself; either is decorative. When several wait, the line shows the latest; a wait belongs to the conversation it started in, so switching `conversationId` shows only the shown conversation's waits. Nothing can be cancelled: Stop still stops the running reply. The composer's own action button shows itself busy after the same delay ([UIC-MESSAGE-COMPOSER-3.9](MESSAGE-COMPOSER.md#uic-message-composer-39---accepting-a-message)), as do the queue's Steer and Remove buttons ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)).

A host that queues a message sent while a reply runs (`onSend` while `isPending`, with `onQueueChange`) adds it to `queue`, not to `messages`, so it never shows in the transcript before it goes out.

Implementation: `src/components/chat/chat-progress.tsx`, `src/components/chat/chat-composer.tsx`, `src/components/chat/chat-queue.tsx`, `src/core/strings/chat-widget.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-progress.test.tsx`, `e2e/chat-progress.spec.ts`

### UIC-CHAT-3.14 - Sending options

Two options, each off by default, shall govern how the reader sends. Steering during a reply (`steersWhilePending`): a new message sent while a reply runs (`isPending`), with Enter, Ctrl+Enter or Send, goes through `onSendNow`, which stops the reply and sends it ahead of the queue ([UIC-CHAT-3.4](#uic-chat-34---queue-of-follow-ups)), instead of through `onSend` to be queued; it settles as `onSend` does and its wait reads "Steering…" ([UIC-CHAT-3.13](#uic-chat-313---waiting-for-the-host)). An edit and a message sent while no reply runs go as before, and without `onSendNow` and `onQueueChange` the option does nothing. Sending with a modifier (`sendsWithModifier`): the composer sends, and queues, with Ctrl+Enter (Command+Enter on macOS) only, overriding the `send` and `queue` chords of `shortcuts`, and Enter breaks the line; the send button's tooltip shows the chord.

Each option is the host's while it passes its value (`steersWhilePending`, `sendsWithModifier`); otherwise the chat holds it, starting from `defaultSteersWhilePending` or `defaultSendsWithModifier`, and keeps the reader's choice in the provider's storage under `chat-steers-while-pending` and `chat-sends-with-modifier`, for every conversation. A change calls `onSteersWhilePendingChange` or `onSendsWithModifierChange` either way.

With `showSendOptions` (off by default), the composer's "+" menu shall end with a section headed by the provider string `chatSendOptions` ("Sending") holding the options as toggles ([UIC-MESSAGE-COMPOSER-5.4](MESSAGE-COMPOSER.md#uic-message-composer-54---toggles)): `chatSteerWhilePending` ("Steer automatically", with the note `chatSteerWhilePendingNote`), always offered, whether or not a reply runs and whatever callbacks the host passes (without `onSendNow` and `onQueueChange` the choice is kept and does nothing until they come), and `chatSendWith` ("Send with") followed by the Ctrl+Enter chord. The section joins the host's own "+" menu button among the composer's controls, after its sections, or a "+" button the composer adds at the start of its row when the host placed none ([UIC-MESSAGE-COMPOSER-5.6](MESSAGE-COMPOSER.md#uic-message-composer-56---the-composers-own-sections)).

Implementation: `src/components/chat/chat-send-options.ts`, `src/components/chat/chat-composer.tsx`, `src/core/strings/chat-widget.ts`
Verification: `src/components/chat/chat-send-options.test.tsx`, `e2e/chat-progress.spec.ts`

### UIC-CHAT-3.15 - Effective composer hint

`placeholder` shall accept a string or `(hint: ChatComposerHint) => string`. The formatter receives the actual submission action (`send`, `queue`, `steer`, `save`), first resolved `shortcut`, available `sendNowShortcut` and localized `text` from `chatComposerHint`. Shortcuts follow the same pointer, modifier, edit and pending rules as the keyboard handler. Key names follow provider localization and Command on macOS. Quotes steer when automatic steering is enabled. The host owns its empty-draft wording.

Implementation: `src/components/chat/chat-composer-hint.ts`, `src/components/chat/chat-composer.tsx`
Verification: `src/components/chat/chat-native-options.test.tsx`, `e2e/chat-native.spec.ts`

## UIC-CHAT-4 - Activity and receipts

### UIC-CHAT-4.1 - Typing

The typing indicator (`ChatTypingIndicator`) shall show the names of the participants in `typingIds`, the reader left out, whether or not an assistant is thinking. It stays mounted, empty, while nobody types.

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`

### UIC-CHAT-4.2 - Thinking

`thinkingIcon` shall follow ChatStatusLine: undefined uses the spinner, null suppresses decoration, and a supplied nonempty node replaces it. Text, busy state and announcements remain.

An assistant's reply that streams shall end with a status line (`ChatStatusLine`, `ui-chat__status`) while the assistant thinks or acts, as long as `thinkingUntil` asks: while the reply has no parts yet and whenever it has a `statusText`, always; while its latest part is not text (reasoning or a tool call, for example), unless `thinkingUntil` is `content`. With `thinkingUntil` `end` the line also shows while the reply's text streams in, as the `writing` activity: the busy indicator or `thinkingIcon` alone, without text. `thinkingUntil` defaults to `text`. While thinking, the line reads the reply's `statusText`, else the chat's `thinkingText`, else the provider string `chatThinking` ("Thinking…"), and shows `thinkingIcon`, when given, in place of its busy indicator. It is gone once the reply's text streams in without a `statusText` (unless `thinkingUntil` is `end`), once the reply ends, and while it waits for the reader (it then shows as `complete`, [UIC-CHAT-1.4](#uic-chat-14---message-states)).

Implementation: `src/components/chat/chat-message-view.tsx`, `src/components/chat/chat-model.ts`
Verification: `src/components/chat/chat.test.tsx`, `src/components/chat/chat-model.test.ts`, `e2e/chat.spec.ts`, `src/components/chat/chat-native-options.test.tsx`

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

`ChatHeader.showIdentity` and the full wrapper's `showHeaderIdentity` shall default to true. False omits participant avatars without changing title, status, search or actions, independently of message `showAvatars`.

`ChatHeader` shall render a `ui-chat-header` element holding the participants' avatar (`ui-chat-header__avatar`), then the `title` as a heading (`ui-chat-header__title`) one level below its section's (3 outside a section) with the `status` line under it (`ui-chat-header__status`), both in `ui-chat-header__text`, then the `actions` (`ui-chat-header__actions`). One participant shows as a small `Avatar` with their presence, or a decorative one without it; several show as an `AvatarGroup` of three and a count that lists everyone, their presence in words as each person's second line, when pressed. The status line is shown and kept from assistive technology, since the conversation announces the same news where it happens. It forwards `className`, `id` and caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-header.tsx`
Verification: `src/components/chat/chat-header.test.tsx`, `e2e/chat.spec.ts`, `src/components/chat/chat-native-options.test.tsx`

### UIC-CHAT-5.3 - Search

With `showSearch`, the header shall offer a search button (`ui-chat__search-toggle`, the `search` glyph, the provider string `chatSearch`, `aria-expanded` and `aria-controls`) that opens a [Find Bar](FIND-BAR.md) under the header (`ui-chat__search`, labelled `chatSearch`) with focus in its find box, and closes it again. The search reads the conversation's data, not its mounted messages, so a virtualized history is searched whole: a message matches when its text holds every term of the query, ignoring case and accents (deleted messages never match). The newest match is current first; Next and Previous (Enter and Shift+Enter) step through the matches and wrap around. The current match is the transcript's highlighted message, so it is mounted, scrolled into view and marked while focus stays in the find box, and the terms are marked in the messages through `TextMatch`. Closing the bar (Escape, Close or the search button) clears the query and moves focus to the current match, or to the search button when there is none.

Implementation: `src/components/chat/chat-search.tsx`, `src/components/chat/chat-model.ts`, `src/components/chat/chat.tsx`
Verification: `src/components/chat/chat-search.test.tsx`, `e2e/chat.spec.ts`

## UIC-CHAT-6 - Attributes

### UIC-CHAT-6.1 - Hooks, strings and caller attributes

`Chat` shall carry the hooks below, append the caller's `className` and forward `id` and caller `data-*` attributes to its root. Its parts keep their own components' hooks beside the slot classes. Its own strings come from the provider (`src/core/strings/chat-widget.ts`).

Implementation: `src/components/chat/chat.tsx`, `src/components/chat/chat-hooks.ts`, `src/core/strings/chat-widget.ts`
Verification: `src/components/chat/chat.test.tsx`

## Chat Activity

The activity family shows what an assistant does while it answers, as parts of a reply in a [Chat Transcript](CHAT-TRANSCRIPT.md). `ChatReasoning` is the assistant's reasoning: open while it streams in, collapsed to how long it took once complete. `ChatSteps` folds the consecutive reasoning and tool calls of one reply into one group: open while the run goes on, collapsed to one line summing up what it did ("Edited files, ran a command") once it ends. `ChatPlan` is the assistant's plan, an ordered list of steps that each say where they stand. `ChatStatusLine` is one live line saying what the assistant is thinking or doing now. The family has no `ChatActivity` component; `chat-activity.ts` holds the data types the parts take (`ChatReasoningData`, `ChatPlanData`, `ChatPlanStep`) and the values they derive from them.

`ChatReasoning` and `ChatSteps` are disclosures without a heading (React Aria `Disclosure`), so a reply's activity does not add to the page's outline. Unlike a `Disclosure`, they open and close on their own as the work progresses, until the reader chooses.

## UIC-CHAT-7 - Reasoning

### UIC-CHAT-7.1 - Disclosure

`ChatReasoning` shall render through the [Trace](TRACE.md) parts: a `ui-chat-reasoning` root (also a `TraceCollapsible`) holding a trigger button (`ui-chat-reasoning__trigger`, also a `TraceCollapsibleTrigger`) with one `TraceLine` holding its label (`ui-chat-reasoning__label`, also a `TraceTitle`), followed by the trace's indicator glyph (`ui-trace__collapsible-indicator`, pointing to the inline end while collapsed and down while open), then the panel (`ui-chat-reasoning__panel`, also a `TraceCollapsibleContent`, a `group` named by the trigger) holding the text (`ui-chat-reasoning__text`). The trigger's `aria-expanded` follows the panel, and the root publishes `data-expanded` while it is open. The root publishes the `status` as `data-status` and the `format` as `data-format`.

Implementation: `src/components/chat/chat-reasoning.tsx`, `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-reasoning.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-7.2 - Streaming

While its `status` is `streaming`, `ChatReasoning` shall be open, labelled by its `title` (what the reasoning is about now, such as "Checking opening hours"), else the provider string `chatReasoningStreaming` ("Thinking…"), with a decorative busy indicator (`ui-chat-reasoning__spinner`) after the label, and its panel shall be busy (`aria-busy="true"`) while the text streams in. With `expandsAutomatically` false it stays closed while it streams, until the reader opens it; it is busy and labelled the same.

Implementation: `src/components/chat/chat-reasoning.tsx`, `src/components/chat/activity-disclosure.tsx`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-reasoning.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-7.3 - Complete

Once its `status` is `complete`, `ChatReasoning` shall collapse, drop the busy indicator and `aria-busy`, and be labelled by the provider string `chatReasoningComplete` with `durationMs` in whole seconds, rounded: "Thought for 4 s", or minutes and seconds from a minute on ("Thought for 1 min 5 s"). Without a duration, or under half a second, the label reads "Thought for a moment".

Implementation: `src/components/chat/chat-reasoning.tsx`, `src/components/chat/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-reasoning.test.tsx`, `src/components/chat/chat-activity.test.ts`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-7.4 - Format

`ChatReasoning` shall render its `text` as Markdown through the [Markdown](MARKDOWN.md) component by default (`format="markdown"`; the text slot is then also `ui-markdown`), in Markdown's streaming mode while its `status` is `streaming`, so incomplete syntax at the end of the text renders as it will once complete ([UIC-MARKDOWN-2.11](MARKDOWN.md#uic-markdown-211---streaming-incomplete-syntax)); and as plain text in a `<div>` with `format="plain"`, where Markdown syntax shows as written.

Implementation: `src/components/chat/chat-reasoning.tsx`
Verification: `src/components/chat/chat-reasoning.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-7.5 - Reader's choice

Pressing the trigger (pointer, Enter or Space) shall open or close `ChatReasoning`, and that choice shall win over the status from then on: reasoning the reader collapsed while it streams stays collapsed, and reasoning the reader opened stays open once complete. `defaultExpanded` starts it open or closed as if the reader had chosen. `isExpanded` controls it; while it is `undefined` the reasoning follows its status and the reader. `onExpandedChange` receives each state the reader requests, also while controlled. While focus is inside the panel, it does not collapse on its own; it collapses once focus leaves.

Implementation: `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-reasoning.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-7.6 - Hooks and caller attributes

`ChatReasoning` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-reasoning.tsx`, `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-reasoning.test.tsx`

## UIC-CHAT-8 - Steps

### UIC-CHAT-8.1 - Group

`ChatSteps` shall render through the [Trace](TRACE.md) parts: a `ui-chat-steps` root (also a `TraceCollapsible`) holding a trigger button (`ui-chat-steps__trigger`, also a `TraceCollapsibleTrigger`) with one `TraceLine` holding the glyph of its first action's kind (`ui-chat-steps__glyph` in a `TraceIcon`, [UIC-CHAT-39.7](CHAT.md#uic-chat-397---kind)) when it has `actions` and its label (`ui-chat-steps__label`, also a `TraceTitle`), followed by the trace's indicator glyph (`ui-trace__collapsible-indicator`), then the panel (`ui-chat-steps__panel`, also a `TraceCollapsibleContent`, a `group` named by the trigger) holding the children: the consecutive reasoning and tool-call parts of one reply. The root publishes `data-expanded` while it is open and `data-running` while `isRunning`.

Implementation: `src/components/chat/chat-steps.tsx`, `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-steps.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-8.2 - Running

While `isRunning`, `ChatSteps` shall be open, with a decorative busy indicator (`ui-chat-steps__spinner`) after its label, which is its `title` (what the run is doing now), else the provider string `chatStepsRunning` ("Working…"). With `expandsAutomatically` false it stays closed while it runs, until the reader opens it.

Implementation: `src/components/chat/chat-steps.tsx`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-steps.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-8.3 - End of the run

Once the run ends (`isRunning` is false, the default), `ChatSteps` shall collapse, drop the busy indicator and be labelled by the provider string `chatStepsComplete` with its `actions`: how many tool calls of each kind it made, kinds in order, each as a phrase in the singular for one call and the plural for more (`read` "read a file" or "read files", `edit` "edited a file", `command` "ran a command", `search` "ran a search", `fetch` "fetched a page", `other` "used a tool"), joined by commas with the first letter in upper case ("Edited files, read files, ran a command"). Without `actions`, the label is how long the run took, `durationMs` in whole seconds, rounded ("Worked for 12 s"), or "Worked for a moment" without a duration.

Implementation: `src/components/chat/chat-steps.tsx`, `src/components/chat/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-steps.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-8.4 - Reader's choice

Pressing the trigger (pointer, Enter or Space) shall open or close `ChatSteps`, and that choice shall win over the run from then on: steps the reader collapsed while running stay collapsed, and steps the reader opened after the run stay open. `defaultExpanded`, `isExpanded`, `onExpandedChange` and focus inside the panel behave as for reasoning ([UIC-CHAT-7.5](#uic-chat-75---readers-choice)).

Implementation: `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-steps.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-8.5 - Hooks and caller attributes

`ChatSteps` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-steps.tsx`, `src/components/chat/activity-disclosure.tsx`
Verification: `src/components/chat/chat-steps.test.tsx`

## UIC-CHAT-9 - Plan

### UIC-CHAT-9.1 - Parts

`ChatPlan` shall render a `ui-chat-plan` root holding a header (`ui-chat-plan__header`) with the `title`, when given (`ui-chat-plan__title`), and the progress (`ui-chat-plan__progress`), then an ordered list (`ui-chat-plan__list`) of the `steps` in order, named by the title or else the provider string `chatPlan` and described by the progress. Each step is a list item (`ui-chat-plan__step`) holding its status glyph (`ui-chat-plan__glyph`) or busy indicator (`ui-chat-plan__spinner`) and its label (`ui-chat-plan__label`).

Implementation: `src/components/chat/chat-plan.tsx`
Verification: `src/components/chat/chat-plan.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-9.2 - Step status

Each step shall publish its `status` as `data-status` and show it with a decorative glyph: `pending` the `pending` glyph, `done` the `success` glyph, `failed` the `error` glyph and `skipped` the `skipped` glyph; a step `in-progress` shows the busy indicator in place of a glyph and is the current step (`aria-current="step"`). After the label, visually hidden status words from the provider string `chatPlanStepStatus` ("Pending", "In progress", "Done", "Failed", "Skipped") say where it stands.

Implementation: `src/components/chat/chat-plan.tsx`, `src/core/strings/chat-activity.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat/chat-plan.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-9.3 - Progress

The progress shall read the provider string `chatPlanProgress` with the number of steps done and of all steps ("2 of 5 done").

Implementation: `src/components/chat/chat-plan.tsx`, `src/components/chat/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-plan.test.tsx`, `src/components/chat/chat-activity.test.ts`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-9.4 - Announcements

`ChatPlan` shall announce the steps whose status changed in a visually hidden polite status, worded by the provider string `chatPlanChanged` ("Book the hotel: done. Pack the bags: in progress"), at most once every two seconds: changes that arrive sooner wait for the rest of the interval and are announced together, each with its latest status. The statuses of the first render, and steps added as pending, are not announced.

Implementation: `src/components/chat/chat-plan.tsx`, `src/components/chat/activity-announcer.tsx`, `src/components/chat/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat/chat-plan.test.tsx`, `src/components/chat/chat-activity.test.ts`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-9.5 - Hooks and caller attributes

`ChatPlan` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat/chat-plan.tsx`
Verification: `src/components/chat/chat-plan.test.tsx`

## UIC-CHAT-10 - Status line

### UIC-CHAT-10.1 - Line

While `isRunning` (the default), `ChatStatusLine` shall render a `ui-chat-status-line` root holding a decorative busy indicator (`ui-chat-status-line__spinner`), or the caller's `icon` in its place (`ui-chat-status-line__icon`, hidden from assistive technology), and its `text` (`ui-chat-status-line__text`), such as "Searching trains…". Without a `text`, or with an empty one, it reads the provider string `chatThinking` ("Thinking…"). A stylesheet may animate the text, such as a shimmer of color across it, or the icon, and should stop under reduced motion. The visible text stays out of the accessibility tree, which hears it through the announcement ([UIC-CHAT-10.2](#uic-chat-102---announcements)). The root publishes `activity` as `data-activity`: with `thinking` (the default) it shows as above; with `writing` (the assistant writes its answer) it shows the busy indicator or icon alone, without text, and announces nothing. Once `isRunning` is false the line renders nothing. An omitted (`undefined`) `icon` uses the busy indicator. Explicit `null`, `false` or empty text suppresses the decorative indicator without changing the text or announcements; `0` draws in the icon slot.

Implementation: `src/components/chat/chat-status-line.tsx`
Verification: `src/components/chat/chat-status-line.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-10.2 - Announcements

`ChatStatusLine` shall announce its text in a visually hidden polite status when the line appears and whenever the text changes, at most once every two seconds: a text that arrives sooner waits for the rest of the interval, and only the latest waiting text is announced.

Implementation: `src/components/chat/chat-status-line.tsx`, `src/components/chat/activity-announcer.tsx`
Verification: `src/components/chat/chat-status-line.test.tsx`, `e2e/chat-chat-activity.spec.ts`

### UIC-CHAT-10.3 - Hooks and caller attributes

`ChatStatusLine` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat/chat-status-line.tsx`
Verification: `src/components/chat/chat-status-line.test.tsx`

## Chat Controller

`useChatController(options)` turns a host's `send` function, which streams an assistant's reply as library events, into the state and callbacks of a chat: the messages with their streaming reply, stop, retry, errors, a queue of follow-ups, approvals, questions, the reader's prompt history and uploads. It has no backend of its own: `send` talks to whatever service the host uses, and an adapter of a few lines maps that service's stream onto the events below. The hook returns the state, imperative `send`, `sendNow`, `steer`, `stop`, `retry`, `updateMessages`, `setReaction` and `resetConversation`, and `props`, everything a chat needs to spread into it. `reduceChatStream`, the pure reducer the hook folds events with, is exported for hosts that keep the conversation themselves.

Messages are [`ChatMessageData`](CHAT.md) values whose content is an ordered list of typed parts ([Chat Parts](CHAT.md)). The reader's messages carry `authorId: currentUserId`, the replies `authorId: assistantId`.

## Stream events

`send(messages, { signal, waitFor })` returns an async iterable of plain objects, one per step of the reply:

| Event              | Fields                                              | Effect on the reply                                                                                                 |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `text-delta`       | `text`                                              | Appends to the open text part, or starts a streaming text part.                                                     |
| `reasoning-delta`  | `id`, `text`                                        | Appends to the reasoning part `id`, or starts it, streaming.                                                        |
| `reasoning-end`    | `id`, `durationMs?`                                 | Completes the reasoning part `id`.                                                                                  |
| `tool-call`        | `id`, `name`, `label?`, `target?`, `kind?`, `args?` | Adds the tool call `id`, running, or updates its name, label, target, kind and arguments.                           |
| `tool-result`      | `id`, `result?`, `error?`, `durationMs?`            | Ends the tool call `id`: `failed` with an `error`, else `succeeded`; a denied call stays denied.                    |
| `approval-request` | `id`, `scopeLabel?`, `await?`                       | Puts the tool call `id` in `approval-requested`, or runs it auto-approved when the reader always allows its tool.   |
| `question`         | `id`, `questions`, `await?`                         | Adds a pending question card.                                                                                       |
| `plan`             | `id`, `title?`, `steps`                             | Adds the plan `id`, or replaces its title and steps.                                                                |
| `plan-step`        | `planId`, `stepId`, `status`                        | Moves one step of a plan.                                                                                           |
| `source`           | `source`                                            | Adds a source to the reply's one sources part, or replaces the source with its `id`.                                |
| `file`             | `attachment`                                        | Adds a file to the files part just before it, or starts a files part.                                               |
| `code`             | `id?`, `code`, `language?`, `title?`, `variant?`    | Adds a code block (`variant: 'terminal'` for terminal output), or replaces the one with its `id`.                   |
| `diff`             | `id?`, `title?`, `oldText`, `newText`               | Adds a diff, or replaces the one with its `id`.                                                                     |
| `custom`           | `id?`, `name`, `data?`                              | Adds a part the host draws itself, or replaces the one with its `id`.                                               |
| `reaction`         | `emoji`, `messageId?`, `isReacted?`                 | None: the assistant reacts to another message, or takes it back ([UIC-CHAT-12.8](#uic-chat-128---agent-reactions)). |
| `status`           | `text`                                              | Sets the reply's `statusText`; an empty text clears it.                                                             |
| `finish`           |                                                     | Ends the reply.                                                                                                     |
| `error`            | `message`                                           | Ends the reply as failed with `message`.                                                                            |

## UIC-CHAT-11 - Reducer

### UIC-CHAT-11.1 - Text

`reduceChatStream(reply, event, context)` shall append a `text-delta` to the reply's open text part, the last part other than its sources list, while that part streams, and start a new streaming text part otherwise. Adding a part of any other kind, except a source, shall complete the open text part, so text after a tool call starts a new text part while sources arriving between citations do not split the text.

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.2 - Reasoning

A `reasoning-delta` shall append to the reasoning part with its `id`, or add that part streaming, and complete any other streaming text or reasoning part. A `reasoning-end`, or any part added after the reasoning, shall complete it with the event's `durationMs`, else the duration `context.getElapsed(id)` reports.

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.3 - Tool calls

A `tool-call` shall add a running tool call, or merge its name, label, target, kind and arguments into the call with its `id` without changing that call's status, so arguments can stream. A `tool-result` shall mark the call `failed` with its `error`, else `succeeded` with its `result`, and set its duration from the event, else from `context.getElapsed(id)`; a denied call keeps its status and takes the result or error.

Implementation: `src/components/chat/chat-stream.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.4 - Approval requests

An `approval-request` shall put the tool call `id` in `approval-requested` with `approval.scopeLabel`. When `context.alwaysAllowed` holds the call's tool name, the call shall run instead, with `approval.isAutoApproved` and no pending decision.

Implementation: `src/components/chat/chat-stream.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.5 - Questions and plans

A `question` shall add a pending question card. A `plan` shall add a plan, or replace the title and steps of the plan with its `id`, and a `plan-step` shall move that step to its status. A part arriving again with an `id` the reply holds shall merge into it in place, keep its status and leave the open text part open, so an answered card stays answered and a plan update does not split the text.

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.6 - Sources, files, code, diffs and custom parts

A `source` shall go into the reply's one sources part, created where the first source arrives with the `id` `sources` (so the reader's choice to open it is kept, [UIC-CHAT-30.1](CHAT.md#uic-chat-301---readers-choices)), replacing a source with the same `id`, so `[n]` markers number the sources in arrival order. A `file` shall join the files part just before it, or start one. `code`, `diff` and `custom` shall add their part, or replace the part of their type with their `id`.

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`

### UIC-CHAT-11.7 - Status, finish and errors

A `status` shall set the reply's `statusText`, and an empty text shall clear it. A `finish`, or natural exhaustion of the controller's event iterator, shall successfully settle the stream: streaming parts complete, the status line clears, and approvals and questions that wait for the reader stay. Running tool calls with `approval.decision: 'approved'` or `'always'`, or `approval.isAutoApproved: true`, shall remain running until a later `tool-result` succeeds or fails them, even if another request delays continuation. Pending calls and other running calls shall be cancelled. An `error` shall end the reply with `status: 'error'` and its `message` as `error`, cancel every unfinished tool call regardless of approval, and dismiss pending questions. Stopping shall likewise cancel unfinished calls. Terminal tool states shall stay unchanged on settlement.

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`, `src/components/chat/chat-continuations.test.ts`

### UIC-CHAT-11.8 - Purity

The reducer shall return a new reply and leave the given one unchanged, keep the identity of the parts an event does not touch, and change nothing for an event about a part the reply does not hold (a result for an unknown call, a step of an unknown plan).

Implementation: `src/components/chat/chat-stream.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-stream.test.ts`

## UIC-CHAT-12 - Runs

### UIC-CHAT-12.1 - Sending

`send(text, tokens?)` shall add the reader's message (a files part with the uploaded attachments, then a text part with the mentions and commands as `tokens`) and an empty assistant reply with `status: 'streaming'`, set `isPending`, and call the host's `send` with the conversation ending with the reader's message, an `AbortSignal` and `waitFor`. Each event shall fold into the reply as it arrives; `finish`, or the iterable ending, completes the reply and clears `isPending`. `finish` completes it at once, exactly once, before the controller waits for the iterable's own cleanup (its `finally` blocks), so queued messages and continuations go ahead meanwhile, and a cleanup that fails afterwards neither turns the reply into an error nor goes unhandled. The folded reply shall reach the conversation once per animation frame (after the current task where there are no frames, as on the server), so a burst of deltas in one frame notifies the controller's readers, and renders `Chat`, once. An approval request or a question, `finish`, an error, a response from the reader and a host's `updateMessages` write what streamed so far at once; a reply that is stopped or replaced drops what it had not written. Blank text without uploaded files sends nothing. An empty streaming reply means the assistant has not answered yet. New messages take ids unique across sessions: a counter after a random UUID for the controller (16 random characters where the browser offers no `crypto.randomUUID`), so they never clash with stored ones.

Implementation: `src/components/chat/chat-controller.ts`, `src/components/chat/chat-engine.ts`, `src/components/chat/chat-run.ts`, `src/components/chat/chat-reply.ts`, `src/components/chat/chat-controller-state.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `src/components/chat/chat-stream-coalescing.test.ts`, `src/components/chat/chat-controller-state.test.ts`

### UIC-CHAT-12.2 - Status line

While a reply runs, `statusText` shall be the reply's status line, which `status` events set; it is `undefined` once the reply ends.

Implementation: `src/components/chat/chat-controller.ts`
Verification: `src/components/chat/chat-controller.test.tsx`

### UIC-CHAT-12.3 - Stop

`stop()` shall abort the signal and end the reply at once with `status: 'cancelled'`, keeping the text it streamed, cancelling unfinished tool calls and approvals and dismissing pending questions; events that still arrive change nothing. Unmounting the hook's component stops the running reply the same way.

Implementation: `src/components/chat/chat-engine.ts`, `src/components/chat/chat-run.ts`, `src/components/chat/chat-stream-parts.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-12.4 - Errors and retry

An `error` event, or `send` throwing or rejecting, shall end the reply with `status: 'error'` and the event's message, the thrown error's message, or the provider string `chatReplyFailed`. `retry()` shall run the failed turn again: it removes the failed reply and streams a new one to the same conversation, or, when the failed run continued an earlier reply, restores that reply as it stood and continues it again. It does nothing while a reply runs or when the last message did not fail. `props.onRetry(messageId)` retries only when `messageId` is that failed reply.

Implementation: `src/components/chat/chat-engine.ts`, `src/components/chat/chat-run.ts`, `src/core/strings/chat-controller.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `src/components/chat/chat-responses.test.ts`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-12.5 - Queue

`sendNow(text, tokens?, replyTo?)` and its `onSendNow` prop carry an optional quoted message ID into the outgoing message. Queued entries also preserve `replyTo` through Steer. Pending ordinary sends enter only the queue until dispatched; they never appear transiently in the transcript.

A message sent while a reply runs shall wait in `queue` (`{ id, text, tokens?, attachments? }`), which `props.onQueueChange` replaces so the reader can edit, reorder or remove queued messages. When a reply finishes, the first queued message goes out as the next turn, and so on in order. A stopped or failed reply holds the queue: the reader's next message joins its end and the first queued message goes out, and a retried reply that finishes resumes it. `sendNow(text, tokens?)` (and `props.onSendNow`) stops the running reply, keeping what it streamed, and sends the message at once as the next turn, ahead of the queue, with the complete attachments as `send` takes them; the queue goes on once that reply finishes. Without a running reply it sends the message as the next turn too, and it sends nothing blank. `steer(id)` (and `props.onSteer`) takes the queued message `id` out of the queue and sends it as `sendNow` does, with its own tokens and attachments: the running reply stops, keeping what it streamed, and the rest of the queue goes on once the new reply finishes. It steers with any queued message, whatever its place; an id that is not queued, or the one being edited, does nothing. `props.onQueuedEditChange(id)` records the queued message the reader edits, and `undefined` the edit's end: while it is edited that message never goes out, so when it is the next to go the queue waits, and goes on with its saved text once the edit ends; the messages before it go out as usual, and the others can still steer. A reply that starts meanwhile (a steer, a message sent now) takes that wait over: how it ends decides whether the queue goes on, so the edit's end sends nothing after a reply the reader stopped or that failed.

Implementation: `src/components/chat/chat-engine.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-12.6 - History

`props.history` shall list the text of the reader's messages that are not deleted, oldest first, for the composer's Up-arrow recall, including messages from `initialMessages`.

Implementation: `src/components/chat/chat-controller.ts`, `src/components/chat/chat-reply.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `src/components/chat/chat-reply.test.ts`

### UIC-CHAT-12.7 - Timing

The controller shall time each reasoning part and tool call from its first event, and give that duration to the reducer for those the stream ends without `durationMs`. It reads the provider clock (`getNow` of [Provider](PROVIDER.md)) for these times and for the `createdAt` of the messages it adds, so a host clock dates them as it dates `RelativeTime`.

Implementation: `src/components/chat/chat-run.ts`, `src/components/chat/chat-engine.ts`, `src/components/chat/chat-controller.ts`
Verification: `src/components/chat/chat-controller.test.tsx`

### UIC-CHAT-12.8 - Agent reactions

A `reaction` event shall add the assistant's (`assistantId`) reaction with `emoji` to the message `messageId`, by default the reader's last message before the reply (the one it answers), or take it back with `isReacted: false`, as `setChatReaction` does ([UIC-CHAT-2.3](#uic-chat-23---reactions)). It writes at once, after what the reply streamed so far, and leaves the reply unchanged; `reduceChatStream` returns the reply as it is. `setReaction({ messageId, emoji, isReacted?, participantId? })` shall do the same at any time, as the assistant unless `participantId` names another participant, such as another agent. Neither changes the conversation when nothing changes.

Implementation: `src/components/chat/chat-run.ts`, `src/components/chat/chat-engine.ts`, `src/components/chat/chat-controller.ts`, `src/components/chat/chat-stream.ts`, `src/components/chat/chat-reactions.ts`
Verification: `src/components/chat/chat-reactions.test.tsx`

## UIC-CHAT-13 - Reader responses

### UIC-CHAT-13.1 - Awaited responses

For an `approval-request` or `question` with `await: true`, the stream stays open and `send` awaits `waitFor(id)`. The reader's response (`props.onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`) shall be recorded on the part and resolve `waitFor` with `{ type: 'approval', decision, reason? }` or `{ type: 'question', status, answers }`; the reply streams on. Stopping or failing the reply rejects every open `waitFor` with an `AbortError`.

Implementation: `src/components/chat/chat-run.ts`, `src/components/chat/chat-reply.ts`, `src/components/chat/chat-engine.ts`
Verification: `src/components/chat/chat-responses.test.ts`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-13.2 - Responses that continue the reply

Without `await`, the turn ends with the part waiting. A response shall be recorded on the part: an approved or always-allowed call runs, a denied one is `denied` with the reason, a card is `answered` with its answers or `dismissed`. Once nothing in the reply waits for the reader any more, `send` shall run again with the updated conversation, which ends with that reply, and stream into the same reply. A response given while the reply still runs continues it once it successfully finishes or its iterator exhausts. Approving before settlement shall pass the same reply and call IDs to `send` with the call still `running` and its approval metadata intact, just as approving after settlement does. The call shall remain running until its result arrives, including while another unanswered request delays continuation. Stop or error shall cancel unfinished calls and start no continuation. A response shall be ignored for a part that does not wait, or that it does not fit (a decision for a question card, answers or a dismissal for an approval request): it changes no part, resolves no `waitFor` and continues no reply, so a later response that fits still does. This holds for awaited parts ([UIC-CHAT-13.1](#uic-chat-131---awaited-responses)) as for parts that continue the reply.

Implementation: `src/components/chat/chat-run.ts`, `src/components/chat/chat-reply.ts`, `src/components/chat/chat-engine.ts`
Verification: `src/components/chat/chat-responses.test.ts`, `src/components/chat/chat-continuations.test.ts`, `src/components/chat/chat-reply.test.ts`, `src/components/chat/chat-response-fit.test.ts`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-13.3 - Always allow

`props.onAlwaysAllow(callId)` shall add the call's tool name to the tools the reader always allows, which the controller keeps unless the host controls them with `alwaysAllowed`, report the new list through `onAlwaysAllowedChange`, and record the decision `always`. Later approval requests for that tool run without asking, with `approval.isAutoApproved`: an awaited one resolves `waitFor` with `{ type: 'approval', decision: 'approved', isAutoApproved: true }`, and one that is not awaited continues the reply once it successfully finishes or its iterator exhausts. Successful settlement shall preserve that call's running status and automatic approval metadata for the continuation, even without an explicit `approval.decision`; stop and error shall still cancel it if unfinished.

Implementation: `src/components/chat/chat-engine.ts`, `src/components/chat/chat-run.ts`, `src/components/chat/chat-stream.ts`
Verification: `src/components/chat/chat-responses.test.ts`, `src/components/chat/chat-continuations.test.ts`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-13.4 - Sending dismisses

Sending a message shall dismiss the question cards and deny the approval requests that wait in the last message, resolving their `waitFor` when awaited, without continuing that reply: the reader's message supersedes them, and goes out or waits in the queue.

Implementation: `src/components/chat/chat-engine.ts`, `src/components/chat/chat-reply.ts`
Verification: `src/components/chat/chat-responses.test.ts`, `src/components/chat/chat-reply.test.ts`

### UIC-CHAT-13.5 - Parts awaiting the reader

`isAwaitingReader(part)` shall tell whether a part waits for the reader: an approval request without a decision, or a pending question card. A running reply that holds such a part waits for the reader rather than streaming, so a chat should not mark it busy (`aria-busy`) while it does.

Implementation: `src/components/chat/chat-reply.ts`
Verification: `src/components/chat/chat-reply.test.ts`, `e2e/chat-chat-controller.spec.ts`

## UIC-CHAT-14 - Attachments

### UIC-CHAT-14.1 - Uploads

With `upload`, `props.onAttach(files)` shall add each file to `props.attachments` as `uploading` with progress 0 and call `upload(file, { signal, onProgress })`; progress updates the attachment, a resolved upload merges its data and marks it `complete`, and a rejected one, or an `upload` that throws before returning its promise, marks it `error` with the error's message, so the other files of the batch still start and Retry can recover it. `props.onRetryAttachment(id)` uploads a failed file again, and `props.onRemoveAttachment(id)` removes a file and aborts its upload. Without `upload`, these three callbacks are `undefined`.

Implementation: `src/components/chat/chat-uploads.ts`, `src/components/chat/chat-controller.ts`
Verification: `src/components/chat/chat-uploads.test.ts`

### UIC-CHAT-14.2 - Files on the next message

The next message the reader sends, or queues, shall carry the complete attachments, without their upload status, and take them out of the composer; files still uploading or failed stay for a later message. Uploaded files send a message without text.

Implementation: `src/components/chat/chat-uploads.ts`, `src/components/chat/chat-engine.ts`
Verification: `src/components/chat/chat-uploads.test.ts`

## UIC-CHAT-15 - Integration

### UIC-CHAT-15.1 - Chat props

`props` shall hold everything a chat needs, with these signatures: `messages`, `isPending`, `onSend(text, tokens?)`, `onSendNow(text, tokens?)`, `onSteer(id)`, `onStop()`, `onRetry(messageId)`, `onApprove(callId)`, `onDeny(callId, reason?)`, `onAlwaysAllow(callId)`, `onAnswerQuestion(questionId, answers)`, `onDismissQuestion(questionId)`, `queue`, `onQueueChange(queue)`, `onQueuedEditChange(id)`, `history`, `attachments`, `onAttach(files)`, `onRemoveAttachment(id)` and `onRetryAttachment(id)`. The callbacks keep their identity across renders, and `props` keeps its identity while the state does not change.

Implementation: `src/components/chat/chat-controller.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `e2e/chat-chat-controller.spec.ts`

### UIC-CHAT-15.2 - Stream adapters

An AG-UI-style event stream and an AI SDK-style UI message stream shall each map onto the stream events in a few lines (examples in the lab, not exports).

Implementation: `labs/src/chat-controller-adapters.ts`
Verification: `labs/src/chat-controller-adapters.test.ts`

### UIC-CHAT-15.3 - Replacing the conversation

`updateMessages(update)` shall edit the conversation as it stands, such as to add a reaction or a page of older messages; the running reply, the queue and the uploads carry on.

`resetConversation(messages)` shall replace the conversation (empty by default), such as to clear it or to load another one, and drop at once everything the old conversation owned: the running reply's signal aborts and its waiters reject, and nothing it streams, settles or continues later reaches the controller; the queue is cleared and never sent; the composer's files are removed and their uploads aborted, so no late upload result returns; and the retry record is cleared, so a retry runs the new conversation's failed turn from scratch. Responses to the old conversation's approvals and questions find nothing and do nothing.

Implementation: `src/components/chat/chat-engine.ts`, `src/components/chat/chat-run.ts`, `src/components/chat/chat-uploads.ts`
Verification: `src/components/chat/chat-controller.test.tsx`, `src/components/chat/chat-uploads.test.ts`, `e2e/chat-chat-controller.spec.ts`

## Markup

`useChatController` renders nothing: the chat it feeds carries the hooks of its own components.

## Chat List

`ChatList` lists conversations to open: an optional New chat row, search field and heading, one row per conversation and an optional Load more row. A row shows its title and only what else the conversation gives: an icon, avatar or participants at its start, the time and text of its last message, a muted mark, the host's status mark, what a participant is doing (typing or working) and an unread count. A chat history passes titles alone; a list of people's conversations adds avatars, last messages and counts. One conversation is selected at a time. Rows hold no controls: the host's commands for a conversation live in its context menu ([UIC-CHAT-17](#uic-chat-17---row-menus)). The rows are a React Aria grid list, which keeps the list one tab stop and moves between rows with the arrow keys.

## UIC-CHAT-16 - List

### UIC-CHAT-16.1 - Parts

`ChatList` shall render a `ui-chat-list` root holding, given `onNew` or `showSearch`, a header (`ui-chat-list__header`) with, given `onNew`, a New chat button (`ui-chat-list__new`) and below it, given `showSearch`, a [Search Field](SEARCH-FIELD.md) (`ui-chat-list__search`); then a body (`ui-chat-list__body`) holding, given a `heading`, the heading (`ui-chat-list__heading`), a React Aria grid list (`ui-chat-list__list`, `role="grid"`) and, given `onLoadMore`, the Load more row ([UIC-CHAT-16.11](#uic-chat-1611---load-more)). The grid list is named by `aria-label`, `aria-labelledby`, else the heading, else the provider string `conversations`, and holds one row (`ui-chat-list__conversation`, `role="row"`) per conversation in the order of `conversations`.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-row.tsx`, `src/core/strings/chat-list.ts`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.2 - Rows

Each row shall show, in order: given an `avatar`, participants or an `icon`, a decorative start (`ui-chat-list__avatar`, hidden from assistive technology): the conversation's `avatar`, else its one participant as an [Avatar](AVATAR.md) with their `presence` as its status, else its participants as an [Avatar Group](AVATAR-GROUP.md) of two and a count, else its `icon`; a conversation with none of them has no start; the title (`ui-chat-list__title`); given `time`, an [Attribution](ATTRIBUTION.md) without a person or a tooltip, read against `getNow` (the provider's clock by default) with `fallbackAfterDays` (7 by default) in `timeZone` (`ui-chat-list__time`), the same reading the row's name gives; given `lastMessage`, the last message on one line (`ui-chat-list__preview`); for a muted conversation the `bell-slash` glyph named by the provider string `conversationMuted` (`ui-chat-list__muted`); given a `status`, its `icon` named by its `label` (`ui-chat-list__status`), a mark whose meaning the host chooses, such as the `history` glyph for a conversation with earlier versions; given an `activity`, the words for what a participant is doing right now (such as "Typing" or "Working"), three dots (`ui-chat-list__activity`, each `ui-chat-list__activity-dot`, hidden from assistive technology) that the reference stylesheet pulses in turn and holds still under reduced motion; above zero unread messages, a count [Badge](BADGE.md) capped at 99 (`ui-chat-list__unread`) named by `unreadMessages(count)`. A row carries `data-unread` while it has unread messages and `data-muted` while it is muted. Collection-item identity and value metadata shall not leak onto its timestamp or other descendant elements. The reference stylesheet keeps the unread count of a row without a last message on its one line.

Implementation: `src/components/chat/chat-list-row.tsx`, `src/core/glyphs.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.3 - Row names

A row shall be named by the provider string `conversationLabel` from its title, the presence of its one participant in words (unless it has its own `avatar`): their `presenceLabel`, or the provider's `presenceStatus` string for their `presence`, its unread count, whether it is muted, its `status` label, its `activity` and its time as the row shows it, followed by its last message. Typing the first letters of a title moves to that row. The time reads as the row shows it ([UIC-RELATIVE-TIME-2.3](RELATIVE-TIME.md)): the stable absolute text on the server and while hydrating, written with runtime-independent spaces ([UIC-INTL-FORMAT-1.3](INTL-FORMAT.md)), then the words against `getNow` (the provider's clock by default) in the reader's time zone, renamed on the shared clock when they change.

Implementation: `src/components/chat/chat-list-row.tsx`, `src/core/strings/chat-list.ts`, `src/components/chat/chat-list.tsx`, `src/core/clock.ts`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`, `src/components/chat/chat-list-server.test.tsx`

### UIC-CHAT-16.4 - Selection

One conversation shall be selected at a time (`aria-selected`, `data-selected`): a press, Enter or Space on a row selects it and calls `onSelectionChange` with its id, and pressing the selected row keeps it selected. `selectedKey` controls the selection (`null` for none); left out, the list keeps the reader's choice.

Implementation: `src/components/chat/chat-list.tsx`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.5 - Keyboard

The grid list shall be one stop in the Tab sequence, entering on the selected or last focused row. Up and Down move focus between rows without selecting, Home and End move to the first and last row, and Page Up and Page Down move by a page.

Implementation: `src/components/chat/chat-list.tsx`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.6 - Search

Given `showSearch`, the list shall show a search field named and hinted by the provider string `searchConversations`; without it, the list has no search and filters nothing, whatever the field held when it went. Without `onSearchChange`, the list keeps the conversations whose title or last message contains the search text, ignoring case and accents, and marks the matching text ([Text Match](TEXT-MATCH.md)). With `onSearchChange`, it reports each change, shows `conversations` as given and still marks the matching text.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-row.tsx`, `src/components/chat/chat-list-parts.tsx`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.7 - New chat

The New chat button shall show the `plus` glyph and the provider string `newChat`, and call `onNew` when pressed.

Implementation: `src/components/chat/chat-list-parts.tsx`
Verification: `src/components/chat/chat-list.test.tsx`

### UIC-CHAT-16.8 - Loading

While `isLoading`, the root shall carry `data-loading` and `data-loading-rows`, and nothing in the list is marked busy (`aria-busy`), since the rows are replaced and a busy ancestor would hold back the status; six placeholder rows (`ui-chat-list__skeleton`, hidden from assistive technology) stand in for the rows, no Load more row shows, with a status reading the provider string `loadingConversations`. A placeholder row is shaped by `loadingRows` like the rows it stands for: `titles` (the default) a line of [Skeleton](SKELETON.md) text (`ui-chat-list__skeleton-text`); `icons` a rectangle skeleton (`ui-chat-list__skeleton-start`) before that line; `avatars` a circle skeleton before two lines, a title and a last message. The reference stylesheet gives the placeholder rows a row's height and titles of different lengths.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-parts.tsx`, `src/core/strings/chat-list.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.9 - Empty

A list without rows that is not loading shall show `ui-chat-list__empty` inside the grid list: the provider string `noMatchingConversations` while the search text is not blank, otherwise `emptyState` or, by default, an [Empty State](EMPTY-STATE.md) reading the provider string `noConversations`.

Implementation: `src/components/chat/chat-list-parts.tsx`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.10 - Hooks and caller attributes

`ChatList` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root; its labelling props name the grid list.

Implementation: `src/components/chat/chat-list.tsx`
Verification: `src/components/chat/chat-list.test.tsx`

### UIC-CHAT-16.11 - Load more

Given `onLoadMore`, and while not loading, a [Load More](LOAD-MORE.md) row (`ui-chat-list__load-more`, a `ghost` button reading the provider string `loadMore`) shall follow the rows and call `onLoadMore` when pressed, pending while a promise it returns settles (a rejection, or a throw, goes to `onLoadMoreError`; without it the error is rethrown); the root carries `data-has-more` meanwhile. While the next conversations load, given by `isLoadingMore` or while that promise is unsettled, and not `isLoading`, the root carries `data-loading-more` and `data-loading-rows`, two placeholder rows shaped by `loadingRows` follow the rows, the Load more row is pending, reading the provider string `loading` beside its spinner, which is named by `loadingMoreConversations`, and a status reads `loadingMoreConversations`; the Load more row stays where it is, so focus on it is kept. By default the root also carries `data-edge-fades`, and the reference stylesheet fades the last two rows toward the Load more row to hint that the list goes on; `showEdgeFades={false}` leaves out the attribute and the fade. The host leaves `onLoadMore` out once nothing is left to load.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-load-more.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-16.12 - Heading

Given a `heading`, the list shall show it above the rows (`ui-chat-list__heading`) and name the grid list by it (`aria-labelledby`), unless `aria-label` or `aria-labelledby` names the list.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-parts.tsx`
Verification: `src/components/chat/chat-list.test.tsx`, `e2e/chat-chat-list.spec.ts`

## UIC-CHAT-17 - Row menus

### UIC-CHAT-17.1 - Opening a row's menu

Given `renderContextMenu`, a secondary click or a long touch on a row shall open a [Context Menu](CONTEXT-MENU.md) at the pointer, and the Context Menu key or Shift+F10 with focus on the row or a control inside it (not a text control) shall open it below the row, showing the `Menu` that `renderContextMenu` returns for that row's conversation and named by the provider string `conversationMenu` with its title. A pointer that opens the menu first moves focus to the row, without selecting it, and focus returns to the row when the menu closes, whether by an action, Escape or a press outside. While the menu is open for a row, the row carries `data-menu-open`. The list opens one menu at a time: opening it for another row moves it there. The list itself handles the keys for its rows, so the host needs no event handlers of its own.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-menu.ts`, `src/components/chat/chat-list-row.tsx`, `src/core/strings/chat-list.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-list-menu.test.tsx`, `e2e/chat-chat-list.spec.ts`

### UIC-CHAT-17.2 - Rows without a menu

A row whose conversation `renderContextMenu` returns nothing for, and every row without `renderContextMenu`, shall leave the browser's own menu and the keys alone. When the conversation whose menu is open leaves the list, or its menu becomes empty, the menu closes.

Implementation: `src/components/chat/chat-list.tsx`, `src/components/chat/chat-list-menu.ts`
Verification: `src/components/chat/chat-list-menu.test.tsx`

## Chat Message Actions

`ChatMessageActions` is the action bar for a [Chat Transcript](CHAT-TRANSCRIPT.md) message's `actions`: a toolbar of the commands whose callbacks the host gives (Copy, a good or bad rating, Reply, React, Edit and Delete), with the feedback details, the [Emoji Picker](EMOJI-PICKER.md) and the delete confirmation ([Dialog](DIALOG.md)) those commands open. `ChatMessageActionsMenu` offers the same commands in a [Context Menu](CONTEXT-MENU.md) on a secondary click or long press on the message, and hands the message the bar, so both share one state. Which commands suit a message (ratings for an assistant's reply, Edit and Delete for the reader's own message) is the host's choice; the library shows what it is given.

## UIC-CHAT-18 - Action bar

### UIC-CHAT-18.1 - Commands

`ChatMessageActions` shall render a React Aria `toolbar` (`ui-chat-message-actions`) named by `aria-label`, `aria-labelledby` or else the provider string `messageActions`, holding small ghost icon-only [Buttons](BUTTON.md) in this order, each only when its value or callback is given: Copy (`copyText`, `ui-chat-message-actions__copy`, named `copy`), Good response and Bad response (`onFeedback`, both `ui-chat-message-actions__rating`, named `goodResponse` and `badResponse`), Reply (`onReply`, `ui-chat-message-actions__reply`, named `reply`), React (`onReact`, `ui-chat-message-actions__react`, named `addReaction`), Edit (`onEdit`, `ui-chat-message-actions__edit`, named `edit`) and Delete (`onDelete`, `ui-chat-message-actions__delete`, named `delete`). Without any command it renders nothing.

Implementation: `src/components/chat/chat-message-actions.tsx`, `src/components/chat/message-actions-bar.tsx`, `src/components/chat/message-commands.ts`, `src/core/strings/chat-actions.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-18.2 - Keyboard

The toolbar shall be one stop in the Tab sequence: Left and Right arrows (reversed right to left) move focus between its commands without wrapping, Tab and Shift+Tab leave it, and coming back focuses the command focused last.

Implementation: `src/components/chat/message-actions-bar.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-18.3 - Copy

Copy shall put `copyText` on the clipboard, exactly as given, through the library's copy support (the asynchronous Clipboard API, then a selection copy). Once the text reached the clipboard it calls `onCopy`. For two seconds the button shows the `check` glyph (the `error` glyph when the copy failed) and the toolbar carries `data-copied` after a copy, and a polite status (`ui-chat-message-actions__status`) reads the provider string `copied` or `copyFailed`; a repeated outcome is read again. Of quick presses only the latest copy is announced: an earlier copy that settles after it changes nothing in the status.

Implementation: `src/components/chat/message-actions-bar.tsx`, `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-18.4 - Hooks and caller attributes

`ChatMessageActions` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to the toolbar.

Implementation: `src/components/chat/message-actions-bar.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`

## UIC-CHAT-19 - Feedback

### UIC-CHAT-19.1 - Ratings

The rating buttons shall be toggle buttons (`aria-pressed`) carrying `data-rating` (`up` or `down`) that show the current rating: `feedback` when the host controls it (`null` for none), otherwise the rating the actions keep from the reader's choices, starting with none.

Implementation: `src/components/chat/message-actions-bar.tsx`, `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`

### UIC-CHAT-19.2 - Rating at once

Without `feedbackReasons`, choosing a rating shall call `onFeedback({ rating, reasons: [] })` at once.

Implementation: `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`

### UIC-CHAT-19.3 - Feedback details

With `feedbackReasons` (even empty), the rating buttons shall have `aria-haspopup="dialog"` and `aria-expanded`, and choosing a rating shall show it as chosen and open a [Popover](POPOVER.md) (`ui-chat-message-actions__feedback`) placed against the button and titled by the provider string `feedbackDetails(rating)`. It holds the reasons, when there are any, as toggle chip buttons (`ui-chat-message-actions__reason`) in a group (`ui-chat-message-actions__reasons`) named `feedbackReasons`; a multi-line text field for an optional comment (`ui-chat-message-actions__comment`) labelled `feedbackComment`; and Skip and Submit (`skip` and `submitFeedback`) in `ui-chat-message-actions__feedback-actions`. Submit calls `onFeedback` once with the rating, the chosen reasons in the order of `feedbackReasons` and the trimmed comment (left out when blank). Skip, Escape or a press outside calls it with the rating and no reasons. The popover then closes and focus returns to the rating button.

Implementation: `src/components/chat/message-command-overlays.tsx`, `src/components/chat/feedback-form.tsx`, `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-19.4 - Clearing a rating

Choosing the rating already shown shall clear it: `onFeedback({ rating: null, reasons: [] })`, without details.

Implementation: `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

## UIC-CHAT-20 - Reply, React, Edit and Delete

### UIC-CHAT-20.1 - Reply and Edit

Reply and Edit shall call `onReply` and `onEdit`.

Implementation: `src/components/chat/message-actions-bar.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`

### UIC-CHAT-20.2 - React

React shall open an `EmojiPicker` in a popover (`ui-chat-message-actions__emoji-popover`) placed against the button, with focus in its search field and the given `customEmoji`, `recentEmoji`, `onRecentEmojiChange` and `loadEmoji`. Choosing an emoji calls `onReact` with its glyph in the chosen skin tone, or `:shortcode:` for a custom emoji, and closes the picker; Escape or a press outside closes it. Focus returns to the button.

Implementation: `src/components/chat/message-command-overlays.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-20.3 - Delete

Delete shall open a [Dialog](DIALOG.md) alert dialog with the `danger` tone, titled `deleteMessage`, described by `deleteMessageDescription`, whose confirm action is named `delete`. Confirming runs `onDelete`, pending while a returned promise settles; Cancel or Escape closes it without deleting. Focus returns to the button.

Implementation: `src/components/chat/message-command-overlays.tsx`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-20.4 - Open overlays

The buttons that open an overlay shall have `aria-haspopup="dialog"` and `aria-expanded`, and while an overlay is open the toolbar carries `data-open`, so a stylesheet that shows the bar on hover or focus keeps it while the reader works in the overlay. Keys, secondary clicks and presses in the overlays stop at the bar, so they never reach the message around it (React passes events from portals up the component tree). An open overlay whose command goes (`onFeedback` or `feedbackReasons`, `onReact`, `onDelete`) closes for good: the pending rating is dropped, the toolbar drops `data-open`, and the command coming back does not reopen it.

Implementation: `src/components/chat/message-actions-bar.tsx`, `src/components/chat/message-command-overlays.tsx`, `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

## UIC-CHAT-21 - Context menu

### UIC-CHAT-21.1 - Menu

`ChatMessageActionsMenu` shall call its `children` with the action bar of its commands (`null` without commands) and make the element it returns a `ContextMenuTrigger` target ([UIC-CONTEXT-MENU-1](CONTEXT-MENU.md#uic-context-menu-1---context-menu-trigger)): a secondary click, a long touch, the Context Menu key or Shift+F10 opens a `Menu` named by `aria-label` or else `messageActions`, holding the commands the bar shows, in its order: Copy, a section named `messageFeedback` with Good response and Bad response as checkable items, Reply, Add reaction, Edit, and Delete with the `danger` tone. A secondary click on a text control inside the message keeps the browser's menu, and without commands there is no menu. The target keeps its own ref, and `className`, `id` and caller `data-*` attributes reach the menu's popover. Each command draws the glyph its bar button draws; `menuIcons` sets the menu's icons by command (`copy`, `up`, `down`, `reply`, `react`, `edit`, `delete`, [UIC-MENU-6.1](MENU.md#uic-menu-61---action-icon-maps)), `null` leaving a command without one, while the bar keeps its own glyphs, which name its buttons. The rating items keep their checks beside their icons.

Implementation: `src/components/chat/chat-message-actions-menu.tsx`
Verification: `src/components/chat/chat-message-actions-menu.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

### UIC-CHAT-21.2 - Shared state

The menu and the bar it hands out shall share one state. Copy from the menu copies `copyText` and the bar shows and announces the outcome; the checked rating is the rating shown; choosing a rating acts as in the bar, with the feedback details placed against the message, and choosing the checked rating clears it; Add reaction and Delete open the emoji picker and the confirmation placed against the message, while the bar carries `data-open`. Focus returns to the message when they close.

Implementation: `src/components/chat/chat-message-actions-menu.tsx`, `src/components/chat/message-commands.ts`
Verification: `src/components/chat/chat-message-actions-menu.test.tsx`, `e2e/chat-chat-message-actions.spec.ts`

## Chat Model Picker

`ChatModelPicker` is a compact composer control that shows the model the reader's messages go to and, when that model takes one, its reasoning effort, and opens a menu to choose them. The menu lists the models, each with its description, an optional badge and, for an unavailable model, the reason; then the efforts the chosen model takes. It builds on [Button](BUTTON.md), [Meta Line](META-LINE.md), [Badge](BADGE.md) and the [Menu](MENU.md) family (`MenuTrigger`, `MenuPopover`, `Menu`, `MenuSection`, `MenuItem`). The caller lists the models and efforts and reads the choice, controlled or not; a host places it among a [Message Composer](MESSAGE-COMPOSER.md)'s controls, or [Chat](CHAT.md)'s `composerEndControls`.

## UIC-CHAT-22 - Trigger

### UIC-CHAT-22.1 - Entry point

`ChatModelPicker` and its types (`ChatModelPickerProps`, `ChatModelOption`, `ChatEffortOption`) shall be exported from the package root and from `@flamboyantengineer/ui-components/chat-model-picker`. It loads no ProseMirror module, so the root stays free of the optional editor peers.

Implementation: `src/components/chat/model-picker.ts`, `src/index.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`

### UIC-CHAT-22.2 - Trigger

`ChatModelPicker` shall render one small `ghost` [Button](BUTTON.md) carrying the `ui-chat-model-picker` root, starting with the current model's `icon` when it has one and ending with a `chevron-down` glyph. Its label is a [Meta Line](META-LINE.md) of the current model's `label` (`ui-chat-model-picker__model`) and, while the model takes an effort, the current effort's `label` (`ui-chat-model-picker__effort`), as in "Balanced · High". The root publishes `data-has-effort` while the model takes an effort. The button is named by the provider string `chatModelTrigger` from the model's and the effort's labels ("Model: Balanced, High effort", or "Model: Classic" without an effort), which holds the labels in the order the trigger shows them so that its name contains its visible text, and reports the menu in `aria-haspopup` and `aria-expanded`. Without models it renders nothing.

Implementation: `src/components/chat/chat-model-picker.tsx`, `src/core/strings/chat-model-picker.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

### UIC-CHAT-22.3 - Disabled

With `isDisabled`, or inside a disabled composer, the trigger shall be disabled (`data-disabled`) and the menu shall not open. Disabled on its own the trigger stays focusable (`aria-disabled`), as the composer's send button does, while a disabled composer disables it natively with its other controls. Becoming disabled closes an open menu, and its models and efforts choose nothing meanwhile; focus returns to a trigger disabled on its own. Enabled again, the picker leaves the menu closed.

Implementation: `src/components/chat/chat-model-picker.tsx`
Verification: `src/components/chat/chat-model-picker.test.tsx`

### UIC-CHAT-22.4 - Hooks, strings and caller attributes

`ChatModelPicker` shall carry the hooks below, append the caller's `className` and forward `id` and caller `data-*` attributes to its root. Its strings come from the provider (`src/core/strings/chat-model-picker.ts`).

Implementation: `src/components/chat/chat-model-picker.tsx`, `src/core/strings/chat-model-picker.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`

### UIC-CHAT-22.5 - In a composer

Among a composer's controls ([UIC-MESSAGE-COMPOSER-6](MESSAGE-COMPOSER.md#uic-message-composer-6---controls)), the trigger shall be disabled while the composer is, as well as with its own `isDisabled`. While the composer is compact ([UIC-MESSAGE-COMPOSER-6.4](MESSAGE-COMPOSER.md#uic-message-composer-64---compact-row)), the root publishes `data-compact` and the trigger is an icon-only button showing the current model's `icon`, else the `sparkles` glyph, named and hinted by the same `chatModelTrigger` text.

Implementation: `src/components/chat/chat-model-picker.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/message-composer-controls.spec.ts`

## UIC-CHAT-23 - Menu

### UIC-CHAT-23.1 - Sections

Pressing the trigger shall open a menu (`ui-chat-model-picker__menu`, also `ui-menu`) in a [Menu Popover](MENU.md#uic-menu-43---popover) above the trigger's start, flipping below when there is no room, and labelled by the trigger. It holds a section titled by the provider string `chatModel` with one item per model of `models`, in order, then, only while the current model takes an effort, a section titled `chatEffort` with one item per effort it takes. Each section is a single selection whose current choice is checked.

Implementation: `src/components/chat/chat-model-picker.tsx`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

### UIC-CHAT-23.2 - Models

Each model's item shall show its `icon` when it has one, its `label` followed, with a `badge`, by a small `info` [Badge](BADGE.md) holding it, and its `description` after them; the label is its type-to-select text. A model with `isDisabled` is unavailable: its item shows its `disabledReason` in place of its description (its description without a reason), stays reachable by keyboard with `aria-disabled="true"` and `data-disabled` so the reason can be read ([UIC-MENU-2.6](MENU.md#uic-menu-26---focusable-disabled-items)), and cannot be chosen: a press, Enter or Space changes nothing, reports nothing and leaves the menu open.

Implementation: `src/components/chat/chat-model-picker.tsx`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

### UIC-CHAT-23.3 - Efforts

The efforts a model takes shall be those of `efforts` its own `efforts` ids name, in the order of `efforts`: every one when the model leaves `efforts` undefined, none when its list is empty, and none for any model when the picker has no `efforts`. Each effort's item shows its `label` and its `description`; the label is its type-to-select text.

Implementation: `src/components/chat/chat-model-picker.tsx`, `src/components/chat/use-chat-model-choice.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

### UIC-CHAT-23.4 - Choosing and keyboard

Choosing an available model or an effort, by pointer, Enter or Space, shall report it ([UIC-CHAT-24](#uic-chat-24---state)) and close the menu, returning focus to the trigger. Enter, Space or Arrow Down on the trigger open the menu with focus on its first item and Arrow Up on its last; Arrow keys, Home and End move between items across both sections, typing moves to the item whose label starts with the typed characters, and Escape closes the menu and returns focus to the trigger (React Aria).

Implementation: `src/components/chat/chat-model-picker.tsx`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

## UIC-CHAT-24 - State

### UIC-CHAT-24.1 - Model

The model shall follow the controlled pair convention ([UIC-COMPOSITION-5](COMPOSITION.md#uic-composition-5---controlled-state)): `model` with `onModelChange`, or uncontrolled from `defaultModel`. The current model is the controlled `model` while `models` lists it; otherwise the first available (not disabled) model among the held choice and `defaultModel`, else the first available model, else the first model. Choosing a model other than the current one calls `onModelChange` with its id.

Implementation: `src/components/chat/use-chat-model-choice.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`

### UIC-CHAT-24.2 - Effort

The effort shall follow the same convention with `effort`, `defaultEffort` and `onEffortChange`. The current effort is the first of the controlled `effort`, the held choice, `defaultEffort` and the model's `defaultEffort` that the current model takes, else the first effort it takes; a model that takes none has no current effort. Choosing another effort calls `onEffortChange` with its id. When the reader chooses a model that does not take the current effort, the effort moves to that model's `defaultEffort` when it takes it, else to its first effort, and `onEffortChange` reports the move; a model that takes the current effort keeps it without a report, and a model that takes none leaves the held effort as it is for the next model that does.

Implementation: `src/components/chat/use-chat-model-choice.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

### UIC-CHAT-24.3 - Persisted choice

With `persistKey`, the picker shall keep its uncontrolled model and effort in the provider's storage ([UIC-PROVIDER-6.1](PROVIDER.md#uic-provider-61---storage-adapter)) under that key, as a JSON object with `model` and `effort` ids, written as they change and read when it mounts or the key changes, so a picker mounted again, as after a reload, resumes the choice. A controlled value is never stored. A stored value that cannot be read counts as none, and a stored model or effort that is no longer listed, available or taken falls back as in [UIC-CHAT-24.1](#uic-chat-241---model) and [UIC-CHAT-24.2](#uic-chat-242---effort).

Implementation: `src/components/chat/use-chat-model-choice.ts`
Verification: `src/components/chat/chat-model-picker.test.tsx`, `e2e/chat-chat-model-picker.spec.ts`

## Chat Parts

`ChatParts` renders the content of one message of a [Chat Transcript](CHAT-TRANSCRIPT.md), inside a `ChatMessage`: an ordered list of typed parts (`ChatPart`), each drawn by the component for its type. Text renders as [Markdown](MARKDOWN.md) or plain text, reasoning as [Chat Activity](CHAT.md)'s `ChatReasoning`, tool calls as [Chat Tool Call](CHAT.md) cards, questions as [Chat Question](CHAT.md) cards, and plans, sources, attachments, code and diffs through their own components. Consecutive reasoning and tool calls of one reply fold into a `ChatSteps` group summed up in one line ("Edited files, ran a command"); text written between tool calls splits them into separate groups. `ChatParts` holds no conversation state: the host owns the parts and records the reader's answers, approvals and retries through the callbacks.

The directory also holds the conversation model the chat components share: `ChatPart` and its variants (`chat-part.ts`), `ChatParticipant` and `ChatMessageData` (`chat-conversation.ts`). Each part variant carries the data contract of the component that draws it, plus its `type` and, where the part is not otherwise identified, an optional `id`.

## UIC-CHAT-25 - Parts

### UIC-CHAT-25.1 - Parts in order

`ChatParts` shall render a `ui-chat-parts` root holding its `parts` in order, each drawn by the component for its `type` ([UIC-CHAT-26](#uic-chat-26---text) to [UIC-CHAT-28](#uic-chat-28---other-parts)). Each part is keyed by its type and `id`, or its type and position when it has no `id`, so a part keeps its element and state while the message streams and parts are added after it.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/chat-parts-grouping.ts`, `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-parts.test.tsx`, `src/components/chat/chat-parts-grouping.test.ts`

### UIC-CHAT-25.2 - DOM ids

`ChatParts` shall namespace each tool call's and question's derived DOM id by its own stable instance identity. With a `messageId`, the suffix shall include it (`<instance>-<messageId>-<part id>`), the message id percent-encoded with its hyphens too (`m-1` writes `m%2D1`), so the first hyphen ends it and no two messages' parts share a DOM id, whatever their ids hold (`m-1` with `p` and `m` with `1-p` stay apart); the callbacks still receive the part's own `id`. Without a `messageId` the suffix is the part's `id`. Repeated opaque message and part ids in separate instances shall remain independent; callback ids stay unchanged. Retained draft and request keys shall use logical message/part identities, never the generated DOM namespace, so virtual remounts restore their state.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/chat-part-view.tsx`, `src/components/chat/chat-part-state.ts`
Verification: `src/components/chat/chat-part-view.test.tsx`, `src/components/chat/chat-instance-identity.test.tsx`

### UIC-CHAT-25.3 - Hooks and caller attributes

`ChatParts` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root. The components it draws keep their own hooks.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/chat-parts-hooks.ts`
Verification: `src/components/chat/chat-parts.test.tsx`

## UIC-CHAT-26 - Text

### UIC-CHAT-26.1 - Markdown

A text part shall render through [Markdown](MARKDOWN.md) as `ui-chat-parts__text` with `data-format="markdown"`, unless its `format` is `plain` or, without a `format`, the `textFormat` prop is `plain` (`textFormat` defaults to `markdown`). While the part's `status` is `streaming`, the Markdown renders in its streaming mode ([UIC-MARKDOWN-2.11](MARKDOWN.md#uic-markdown-211---streaming-incomplete-syntax)), so incomplete syntax at the end renders as it will once complete.

Implementation: `src/components/chat/chat-text-part.tsx`
Verification: `src/components/chat/chat-text-part.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-26.2 - Code blocks and citations

The Markdown of every text part shall draw fenced and indented code as `CodeBlock` ([UIC-CODE-BLOCK-4.1](CODE-BLOCK.md#uic-code-block-41---code-block-override)), highlighted by its fence language ([UIC-CODE-BLOCK-1.4](CODE-BLOCK.md#uic-code-block-14---highlighting)), a plain-text fence wrapping its lines and code scrolling sideways within the message, and `[n]` markers as `ChatCitation`s of the sources of the message's `sources` parts, taken in order across those parts ([UIC-CHAT-38.1](CHAT.md#uic-chat-381---citation-override)); a marker inside a link or a task label stays text, so no link or button nests in another. With `onApplyCode`, each fenced block shows Apply, which calls `onApplyCode` with the block's value and a code part made from the fence (`{ type: 'code', code, language }`). These overrides stay the same objects while the sources' content (each source compared field by field, with no serialisation) and the presence of `onApplyCode` stay the same, so a streaming message keeps its finished blocks ([UIC-MARKDOWN-2.12](MARKDOWN.md#uic-markdown-212---finished-blocks)), and Apply calls the latest `onApplyCode`.

Implementation: `src/components/chat/chat-text-part.tsx`
Verification: `src/components/chat/chat-text-part.test.tsx`, `src/components/chat/markdown-citation-places.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-26.3 - Plain text

A plain text part shall render its `text` as written in a `<div>` (`ui-chat-parts__text`, `data-format="plain"`), with a `<br>` at each line break, through [Text Match](TEXT-MATCH.md).

Implementation: `src/components/chat/chat-text-part.tsx`
Verification: `src/components/chat/chat-text-part.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-26.4 - Mention and command tokens

Each of a text part's `tokens` shall show its `label` as a pill (`ui-chat-parts__token`, `data-kind` `mention`, `command` or `trigger`, the last for an entry of a host's own trigger vocabulary) in place of the range of `text` it covers, in both formats. In Markdown the pill takes the place of the token's text wherever Markdown reads it as text, inside emphasis, links and lists as elsewhere, and text beside it keeps its citations; where Markdown shows the source as written (code, a link's target, an image), the token's text stays as written. Tokens outside the text or overlapping an earlier token are ignored. Only the listed tokens become pills: any other text, including characters that look like the markers that carry tokens through Markdown (written as is or as entities), stays text, in text, code and links alike, and never adds or hides a token. Each token's marker stays a few characters long however many such characters or tokens the text holds, so the Markdown source grows in proportion to the text. Tokens are compared field by field, so a host that rebuilds the array on each render keeps the Markdown overrides. While a part with tokens streams, the overrides stay the same objects as long as its listed tokens do, so its finished blocks are not rendered again (UIC-MARKDOWN-2.12), and a text that continues the previous one parses only its unsettled end to place its tokens, so each chunk's work does not grow with the reply.

Implementation: `src/components/chat/chat-text-part.tsx`, `src/components/chat/chat-text-tokens.ts`
Verification: `src/components/chat/chat-text-part.test.tsx`, `src/components/chat/chat-text-tokens.test.ts`, `src/components/chat/chat-text-token-streaming.test.ts`, `src/components/chat/chat-text-token-literals.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-26.5 - Record references

A token of kind `reference` (an opaque record `id`, its `label` and an optional host `recordType`) shall show in its pill (`data-kind` `reference`), in both formats and wherever UIC-CHAT-26.4 places pills, a neutral `MessageReference` whose default label is the token label, with what `getReference({ id, label, recordType })` returns for it (its label override, name, icon, link, supporting content or preview); without `getReference`, or when it returns nothing, the chip shows only the label. The parts never fetch the record, and a link reaches it through the provider's link renderer. Inside a Markdown link or a task item's label the chip drops its link and preview (the host's `href`, `isExternal` and `preview`), so no link nests in another control and server markup hydrates cleanly. The label and the host's values render as text, never as markup.

Implementation: `src/components/chat/chat-text-part.tsx`, `src/components/chat/chat-parts.tsx`
Verification: `src/components/chat/chat-text-part.test.tsx`, `src/components/chat/chat-reference-places.test.tsx`, `e2e/chat-chat-parts.spec.ts`

## UIC-CHAT-27 - Agent parts

### UIC-CHAT-27.1 - Reasoning

A reasoning part shall render as `ChatReasoning` with its `text`, `title`, `status` and `durationMs`, opening on its own while it streams unless `expandsActivity` is false, its Markdown streaming while the reasoning does ([UIC-CHAT-7.4](CHAT.md#uic-chat-74---format)).

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-27.2 - Tool calls

A tool-call part may set `grouping: 'standalone'` to render as its own native row, keeping its label, kind/status glyph, literal result and duration visible without a custom renderer. The default `auto` policy still groups consecutive activity. `defaultExpanded` initializes details; `expandedParts` and `onExpandedPartsChange` control them by part ID. Each row remains independent and its default yields to retained reader choices.

A tool-call part shall render as a `ChatToolCall` with its data and the `row` variant ([UIC-CHAT-39.8](CHAT.md#uic-chat-398---variant)), always in a group of steps ([UIC-CHAT-29.1](#uic-chat-291---grouping)), so every call of a reply takes the same styles and keeps its state as the reply streams. Approve, Deny and Always allow show while its approval waits only when `onApprove`, `onDeny` and `onAlwaysAllow` are given, and call them with the call's `id` (and the reader's reason, for `onDeny`).

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`, `src/components/chat/chat-standalone.test.tsx`, `e2e/chat-native.spec.ts`

### UIC-CHAT-27.3 - Tool renderers

`toolRenderers` shall map a tool's `name` to a `ChatToolRenderer` whose `render(call, handlers)` draws that tool's calls: in place of the card's body by default (the card keeps its title, status, error and approval), or in place of the whole card with `replaces: 'card'`. `handlers` holds the call's `onApprove`, `onDeny(reason?)` and `onAlwaysAllow`, bound to the call, each present only when `ChatParts` has the callback. Tool names, part ids and message ids are looked up as own keys, so a tool named after an `Object` member, such as `constructor`, `__proto__` or `toString`, uses only a renderer registered under that name and otherwise draws the standard card.

Implementation: `src/components/chat/chat-part-view.tsx`, `src/components/chat/chat-parts.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`, `src/components/chat/chat-part-own-keys.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-27.4 - Questions

A question part shall render as a `ChatQuestion` card with its data. Submitting calls `onAnswerQuestion` with the part's `id` and the answers, and the card awaits a promise it returns ([UIC-CHAT-32.7](CHAT.md)); without `onAnswerQuestion` the card is read-only ([UIC-CHAT-32.9](CHAT.md)). Dismiss shows only with `onDismissQuestion`, which receives the part's `id` and is awaited likewise. `questionAnsweredMark` becomes each card's `answeredMark` ([UIC-CHAT-33.4](CHAT.md)).

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-27.5 - Tool glyphs

`toolGlyphs` shall map a tool's `name` to a `GlyphComponent` that becomes the `glyph` of that tool's calls, shown once a call succeeded in place of its kind's glyph or letter glyph ([UIC-CHAT-39.9](CHAT.md#uic-chat-399---tool-glyph-and-letter)), whether the call stands alone or in a group of steps. A call part's `source` passes on to its card. Tool names are looked up as own keys, as for `toolRenderers`. A group of steps still sums its calls up by kind.

Implementation: `src/components/chat/chat-part-view.tsx`, `src/components/chat/chat-parts.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

## UIC-CHAT-28 - Other parts

### UIC-CHAT-28.1 - Plan

A plan part shall render as `ChatPlan` with its `title` and `steps`.

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-28.2 - Sources

A sources part shall render as `ChatSources` with its `sources`, collapsed until the reader opens it ([UIC-CHAT-36.4](CHAT.md#uic-chat-364---collapsed-by-default)). A sources part with an `id` keeps the reader's choice by that `id` ([UIC-CHAT-30.1](#uic-chat-301---readers-choices)).

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-28.3 - Files

A files part shall render as `AttachmentList` with its `attachments`; with `onRetryAttachment`, a failed upload shows Retry, which calls it with the attachment's `id`.

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-28.4 - Code and terminal

A code part shall render as `CodeBlock` with its `code`, `language`, `title` and `variant` (`terminal` for terminal output), highlighted by its `language` ([UIC-CODE-BLOCK-1.4](CODE-BLOCK.md#uic-code-block-14---highlighting)). With `onApplyCode`, the block shows Apply, which calls `onApplyCode` with the block's value and the part.

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-28.5 - Diff

A diff part shall render a `ui-chat-parts__diff` element holding its `title`, when it has one, in `ui-chat-parts__diff-title`, then a `TextDiff` of its `oldText` and `newText` named by that title.

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

### UIC-CHAT-28.6 - Custom parts

A custom part shall render what `renderPart(part)` returns, and nothing without `renderPart`.

Implementation: `src/components/chat/chat-part-view.tsx`
Verification: `src/components/chat/chat-part-view.test.tsx`

## UIC-CHAT-29 - Steps

### UIC-CHAT-29.1 - Grouping

A run of consecutive reasoning and tool-call parts shall fold into one `ChatSteps` group, holding them in order, when it holds a tool call, even a single tool call that ends the message. A call therefore keeps its place in the tree as further parts stream after it: its denial reason, focus, custom body state and the reader's open and closed choices survive the update. A run without a tool call stays as reasoning parts on their own. Any other part, such as text the assistant writes between tool calls, ends the run, so it shows between two groups as a part of the message.

Implementation: `src/components/chat/chat-parts-grouping.ts`, `src/components/chat/chat-parts.tsx`
Verification: `src/components/chat/chat-parts-grouping.test.ts`, `src/components/chat/chat-parts.test.tsx`

### UIC-CHAT-29.2 - Running and summary

A group shall run (`ChatSteps`' `isRunning`: open, "Working…") while `isStreaming` is true and either it ends the message or one of its steps is still at work (reasoning streaming, a tool call `pending` or `running`); otherwise it has ended and collapses, unless the reader chose otherwise or a call in it waits for approval ([UIC-CHAT-29.3](#uic-chat-293---approvals-in-a-group)); a failed call does not hold it open ([UIC-CHAT-29.4](#uic-chat-294---failures-in-a-group)). So a group of successful steps collapses once the answer after it starts streaming. With `expandsActivity` false a running group stays closed until the reader opens it. While its latest step is reasoning that streams, the group is labelled by that reasoning's `title`, when it has one. Once it has ended it is summed up by its `actions`: how many of its tool calls are of each `kind` (`other` when the call has none), kinds in the order they first appear; its reasoning does not show in the summary.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/chat-parts-grouping.ts`
Verification: `src/components/chat/chat-parts-grouping.test.ts`, `src/components/chat/chat-parts.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-29.3 - Approvals in a group

A group holding a tool call whose approval waits (`approval-requested` without a decision) shall be open without the reader's choice, even once the message no longer streams. When a call in a group the reader closed starts waiting for approval, or already waits as `ChatParts` mounts, the group opens as if the reader had opened it (`onExpandedPartsChange` receives the group as open), so the request never hides in a collapsed group and the group does not collapse under the reader's focus once they decide; closing it again is the reader's choice and holds.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/use-parts-expansion.ts`
Verification: `src/components/chat/chat-parts.test.tsx`

### UIC-CHAT-29.4 - Failures in a group

A failed tool call (`failed`) in a group shall show as a row like its other steps, its card closed ([UIC-CHAT-41.1](CHAT.md#uic-chat-411---expanded-state)) so its error waits in the body ([UIC-CHAT-40.5](CHAT.md#uic-chat-405---error)). A failure calls nothing open: the group runs and collapses as [UIC-CHAT-29.2](#uic-chat-292---running-and-summary) says, whether the call fails while the group runs, in the update that ends the run, or was already failed when `ChatParts` mounts, as in loaded history; a group or card the reader closed stays closed, and `onExpandedPartsChange` is not called for it. The reader opens the group and the card to read the error, and those choices hold over later renders and remounts as [UIC-CHAT-30.1](#uic-chat-301---readers-choices) says.

Implementation: `src/components/chat/chat-parts.tsx`, `src/components/chat/chat-tool-call.tsx`
Verification: `src/components/chat/chat-parts.test.tsx`, `src/components/chat/chat.test.tsx`, `e2e/chat-chat-parts.spec.ts`

## UIC-CHAT-30 - Expansion

### UIC-CHAT-30.1 - Reader's choices

The reader's choices to open or close reasoning, tool-call cards, sources and groups of steps shall be kept by key: a part's `id`, and `steps:<first step's id>` for a group. Without `expandedParts`, `ChatParts` keeps them itself, so they survive a part moving into a group and the message completing. With `expandedParts`, it follows that record, so the choices also survive remounts such as virtualization; a key absent from the record leaves the part to its progress. `onExpandedPartsChange` receives the whole record each time the reader opens or closes one.

Implementation: `src/components/chat/use-parts-expansion.ts`, `src/components/chat/chat-part-view.tsx`, `src/components/chat/chat-parts.tsx`
Verification: `src/components/chat/chat-parts.test.tsx`

## Chat Question

`ChatQuestion` is an inline card in which an agent asks the reader one or several questions inside a conversation. Each question is answered by one option (radios), any options (checkboxes) or the reader's own words; options may carry a description, a "Recommended" badge and a Markdown preview, and a question may offer "Other" with a field for the reader's own words. A pending card shows its questions as tabs with a counter, one question at a time; the reader picks any question by its tab or steps with Back and Next. Submit sends every answer at once, and the host may accept them asynchronously: the card is locked while they are sent and keeps every answer when they are refused. Without an answer handler a pending card is read-only. Once answered the card collapses to a summary of the answers; once dismissed it says so. The card takes the `ChatQuestionData` fields of a message part, so a conversation renders it by spreading the part's data.

## UIC-CHAT-31 - Card and questions

### UIC-CHAT-31.1 - Card

`ChatQuestion` shall render a `ui-chat-question` root with `role="group"`, named by its first question through the provider's `questionAsked` string (`Question: <first question>`, or `3 questions: <first question>` for several), so the name differs from the question group inside it; its `id` is the card's `id`. It takes the data fields `id`, `questions`, `status` and `answers` (`ChatQuestionData`), `onSubmit`, `onDismiss` and `answeredMark` ([UIC-CHAT-33.4](#uic-chat-334---answered-tabs)), publishes `status` as `data-status` (`pending`, `answered` or `dismissed`), `data-stepped` while it holds more than one question, `data-submitting` while a request it sent is unsettled (UIC-CHAT-32.7) and `answeredMark` as `data-answered-mark`.

Implementation: `src/components/chat/chat-question.tsx`, `src/components/chat/chat-question-model.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.2 - Question

A pending card shall render through the [Questionnaire](QUESTIONNAIRE.md) parts: a stepping `Questionnaire` (`ui-chat-question__form`) over the questions' ids, whose current question follows the card's step, which reads the answered questions from the card's drafts (UIC-QUESTIONNAIRE-1.4) and is read-only while the card is (UIC-QUESTIONNAIRE-1.5). Each question is a `QuestionnaireItem` (`ui-chat-question__item`, a `<fieldset>` named by the question, required while the reader can answer) that publishes the question's `selectionMode` as `data-selection-mode` (`single`, `multiple` or `none`) and holds the question's text in its `QuestionnaireTitle` (`ui-chat-question__question`, a `<legend>`) and then its answer; every question is mounted in the shown panel and only the shown one is visible. The question's `header` labels its tab ([UIC-CHAT-33.1](#uic-chat-331---tabs)).

Implementation: `src/components/chat/chat-question-item.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.3 - Single choice

A `single` question shall draw its options as `QuestionnaireChoices` (`ui-chat-question__options`, role `radiogroup`, named by the question's text), one `QuestionnaireChoice` radio per option, in order, each a `ui-chat-question__option` that publishes `data-selected` while chosen. The group follows the radio group pattern of the WAI-ARIA Authoring Practices: Tab enters it once, on the chosen radio or else the first; the arrow keys move to the next or previous radio, wrapping at the ends, and choose it; Space chooses the focused radio.

Implementation: `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-fields.tsx`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.4 - Multiple choice

A `multiple` question shall draw its options as `QuestionnaireChoices` (`ui-chat-question__options`, role `group`, named by the question's text), one `QuestionnaireChoice` checkbox per option, in order, each a `ui-chat-question__option` that publishes `data-selected` while ticked. Each box is a Tab stop and Space toggles it.

Implementation: `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-fields.tsx`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.5 - Free text

A `none` question shall be answered in the reader's own words only: a required single-line [Text Field](TEXT-FIELD.md) (`ui-chat-question__text`) named by the question's text, with the provider's `questionAnswerPlaceholder` as its hint. Its options are ignored.

Implementation: `src/components/chat/chat-question-item.tsx`, `src/components/chat/chat-question-fields.tsx`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.6 - Options

An option's `label` shall name its radio or checkbox, and its `description` render after it in `ui-chat-question__description`, which describes the input (`aria-describedby`). An option with `isRecommended` adds a small info [Badge](BADGE.md) (`ui-chat-question__recommended`) with the provider's `questionRecommended` string after the label, inside the input's name, and its wrapper publishes `data-recommended`. A recommended option is not chosen for the reader.

Implementation: `src/components/chat/chat-question-fields.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.7 - Other

A question with `allowsOther` shall end its options with one named by the provider's `questionOther` string, whose wrapper publishes `data-other`. While Other is chosen, a required single-line [Text Field](TEXT-FIELD.md) (`ui-chat-question__other`, named by `questionOtherAnswer`, with the `questionAnswerPlaceholder` hint) follows the group for the reader's own words. Choosing Other by a press or Space moves focus to the field; an arrow key that moves onto Other while walking the radios chooses it but keeps focus on the radio, so the arrow keys keep moving and Tab reaches the field next. In a `single` question Other replaces the chosen option; in a `multiple` one it adds to the ticked options. The words are kept while another option is chosen.

Implementation: `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-model.ts`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-31.8 - Previews

The group, the Other field and the preview of a question with options shall sit in `ui-chat-question__answer`, which publishes `data-has-preview` while an option has a `preview`. The preview (`ui-chat-question__preview`, a `group` named by the provider's `questionPreview` string from the option's label) shows the option's `preview` through [Markdown](MARKDOWN.md), after the group, for the option whose radio or checkbox has focus; while none has focus it shows the first chosen option with a preview, and nothing while that is none or the focused option has no preview. The reference stylesheet sets it beside the options, or below them on a narrow card, and wraps its code rather than scrolling it, since a scrolling preview is one more Tab stop (the browser makes a scroll container without focusable content focusable).

Implementation: `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-model.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question.test.tsx`, `src/components/chat/chat-question-model.test.ts`, `e2e/chat-chat-question.spec.ts`

## UIC-CHAT-32 - Answering

### UIC-CHAT-32.1 - Answers

A question shall count as answered once it has an option chosen or Other chosen, and words whenever Other is chosen; a `none` question once it has words (text that is not only white space). The answer of a question is a `ChatQuestionAnswer`: its `questionId`, the chosen options' ids in `optionIds` in the order they are offered, and, when Other is chosen or the question is `none`, the trimmed words in `otherText`. Question ids are the caller's own keys: any string, including one that names an `Object` member such as `constructor`, `__proto__` or `toString`, keeps its own draft and answer. A draft is read against the question as it stands: a chosen option the question no longer offers is dropped, a `single` question keeps at most one option and no option beside Other, Other counts only while `allowsOther` is set, and a `none` question keeps no options. Whether the question is answered, and its answer, follow that reading, so a draft left with no choice is unanswered again.

Implementation: `src/components/chat/chat-question-model.ts`, `src/components/chat/chat-question-pending.tsx`
Verification: `src/components/chat/chat-question-model.test.ts`, `src/components/chat/chat-question.test.tsx`, `src/components/chat/chat-part-own-keys.test.tsx`, `src/components/chat/chat-question-revalidate.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.2 - Submit

A pending card with `onSubmit` shall draw a primary Submit [Button](BUTTON.md) (`ui-chat-question__submit`, the provider's `questionSubmit` string) in `ui-chat-question__actions`, after the last question in a stepped card. Until every question is answered it is unavailable but focusable (`aria-disabled="true"`) and hints why in a tooltip (`questionAnswerAllToSubmit`). Pressing it calls `onSubmit` with one answer per question, in order. The card stays pending until its `status` changes.

Implementation: `src/components/chat/chat-question-pending.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.3 - Dismiss

With `onDismiss`, a pending card shall end its actions with a ghost Dismiss [Button](BUTTON.md) (`ui-chat-question__dismiss`, the provider's `dismiss` string) that calls it, whether or not the card can be answered. A promise it returns is awaited as the answers are (UIC-CHAT-32.7, UIC-CHAT-32.8). Without `onDismiss` there is no Dismiss button.

Implementation: `src/components/chat/chat-question-pending.tsx`, `src/components/chat/chat-question-request.ts`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `src/components/chat/chat-question-request.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.4 - Enter in an answer field

Enter without a modifier, outside an input method's composition, in the free-text field or the Other field of a card that can be answered and sends nothing (UIC-CHAT-32.7, UIC-CHAT-32.9) shall go on as the primary button would: to the next question, or from the last question submit, or, when an earlier question is still open, to it. While the shown question has no answer, Enter instead shows the field's validation.

Implementation: `src/components/chat/chat-question-fields.tsx`, `src/components/chat/chat-question-pending.tsx`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.5 - Validation

The free-text and Other fields shall be required fields (UIC-FIELD-3.1), except while read-only (UIC-CHAT-32.7, UIC-CHAT-32.9), that show their validation once focus leaves them or Enter asks for an answer they lack: the message renders in the field's message slot, is announced, and the input reports `aria-invalid` and `aria-errormessage`. Their committed value follows their value, so they are never dirty: they draw no restore button and leave Escape to the conversation around them.

Implementation: `src/components/chat/chat-question-fields.tsx`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.6 - Focus once settled

When the reader's Submit or Dismiss is followed by the card leaving `pending`, focus shall move to the card's root (focusable by script while not pending) if it was lost with the pressed button or is still inside the card, so keyboard focus never falls to the page; focus the reader moved elsewhere stays there.

Implementation: `src/components/chat/chat-question.tsx`
Verification: `src/components/chat/chat-question-pending.test.tsx`

### UIC-CHAT-32.7 - Submitting

`onSubmit` and `onDismiss` may return a promise. From the press (or Enter) until it settles, the card shall be submitting: the root publishes `data-submitting`, the button pressed is pending ([Button](BUTTON.md)'s `isPending`: it keeps focus and refuses presses), the other actions are unavailable, and the answers are read-only (a read-only radio or checkbox group publishes `data-readonly` and `aria-readonly`; a field that has focus keeps it). One request runs at a time: a second press or Enter sends nothing, including before the submitting state renders. When the promise resolves the card is no longer submitting and keeps the answers as given, staying pending until the host changes its `status`. A callback that returns no promise leaves no submitting state. The requests belong to the card's pending lifetime, which ends when the card leaves pending or changes `id`: a card pending again, even with the same `id`, starts unlocked and sends at once, and a request from an earlier lifetime that settles later changes nothing.

Implementation: `src/components/chat/chat-question-request.ts`, `src/components/chat/chat-question.tsx`, `src/components/chat/chat-question-pending.tsx`, `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-fields.tsx`, `labs/reference/chat.css`, `src/utils/use-retained-state.ts`
Verification: `src/components/chat/chat-question-request.test.tsx`, `src/components/chat/chat-question-lifetime.test.tsx`, `e2e/chat-chat-question.spec.ts`, `src/components/chat/chat-retained-inputs.test.tsx`

### UIC-CHAT-32.8 - Refused requests

When `onSubmit` or `onDismiss` throws or its promise rejects, the card shall keep every option chosen, every word typed (Other's included) and the question shown, and show why in an [Inline Error](INLINE-ERROR.md) (`ui-chat-question__error`, an assertive alert) before the actions: the error's message, else the provider's `questionSubmitFailed` string for answers or the common `actionFailed` string for a dismissal. The actions are available again, so the reader can retry; the message stays until the next request.

Implementation: `src/components/chat/chat-question-request.ts`, `src/components/chat/chat-question-pending.tsx`, `src/core/strings/chat-question.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question-request.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.9 - Read-only card

A pending card without `onSubmit` shall be read-only: its options and fields show without taking changes (`data-readonly`, `aria-readonly`, `readonly`), a field asks for no answer, Enter does nothing and there is no Submit. A stepped read-only card offers Next on every question but the last, so the reader can read each question. A card with one question and no `onDismiss` draws no actions.

Implementation: `src/components/chat/chat-question-pending.tsx`, `src/components/chat/chat-question-choices.tsx`, `src/components/chat/chat-question-fields.tsx`
Verification: `src/components/chat/chat-question-request.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-32.10 - Scope

The reader's drafts, the question shown and the card's requests shall belong to the card's `id` while it is pending. A card that changes `id` starts afresh with no drafts, the first question and no request; a request that settles after the card changed `id`, left `pending` or unmounted changes nothing, so it never marks, fails or unlocks another card.

Implementation: `src/components/chat/chat-question-request.ts`, `src/components/chat/chat-question.tsx`
Verification: `src/components/chat/chat-question-request.test.tsx`

## UIC-CHAT-33 - Several questions

### UIC-CHAT-33.1 - Tabs

A pending card shall show one question at a time, starting with the first, in a [Tabs](TABS.md) family (`ui-chat-question__tabs`, small): a tab list named by the provider's `questionSteps` string with one tab (`ui-chat-question__tab`) per question, labelled by its `header`, or `questionStep` from its position when it has none, then the counter (`ui-chat-question__progress`), then the shown question in the selected tab's panel (`ui-chat-question__panel`). The shown question's tab is selected (`data-selected`, `aria-selected="true"`). The tabs keep one tab stop: the arrow keys, Home and End move to a tab and show its question at once. A tab list that does not fit scrolls, with scroll buttons at an edge that hides tabs (UIC-TABS-2.7), keeping the selected tab in view. A card with one question shows one tab and the counter "1/1" too.

Implementation: `src/components/chat/chat-question-tabs.tsx`, `src/components/chat/chat-question-pending.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question-tabs.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-33.2 - Counter

The counter shall follow the tab list on its row and show the shown question's position and the number of questions through the provider's `questionCounter` string ("2/3"), hidden from assistive technology, which reads `questionProgress` ("Question 2 of 3") instead.

Implementation: `src/components/chat/chat-question-tabs.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat/chat-question-tabs.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-33.3 - Choosing a question

Pressing any question's tab, at any time, shall show that question, answered or not and wherever it sits: the tabs never wait for an answer, and stay usable while the card is read-only or a request runs, so the reader can look through the questions. Focus stays on the tab, and the reader's choices and words are kept for every question.

Implementation: `src/components/chat/chat-question-tabs.tsx`, `src/components/chat/chat-question-pending.tsx`
Verification: `src/components/chat/chat-question-tabs.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-33.4 - Answered tabs

Every answered question's tab shall publish `data-answered` and take the provider's `questionAnsweredTab` string ("Answered") as its accessible description. `answeredMark` chooses what else marks it: `icon` (the default) draws a check glyph before the label (the tab's `ui-tabs__icon`); `style` draws nothing more, leaving `data-answered`, with the root's `data-answered-mark="style"`, to the stylesheet. `ChatParts` takes it as `questionAnsweredMark` for its question parts, and `Chat` passes it on.

Implementation: `src/components/chat/chat-question-tabs.tsx`, `src/components/chat/chat-question.tsx`, `src/components/chat/chat-part-view.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-question-tabs.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-33.5 - Back and Next

Within full Chat, pending answer drafts and the current step shall be retained across virtual unmounts, scoped to conversation, message and part identity. Standalone ChatQuestion keeps local drafts.

A card with more than one question shall draw a Back [Button](BUTTON.md) (`ui-chat-question__back`, the provider's `back` string) on every question but the first, and a primary Next button (`ui-chat-question__next`, `next`) on every question but the last, where Submit takes its place. Next is unavailable but focusable (`aria-disabled="true"`) while the shown question has no answer and hints why in a tooltip (`questionAnswerToContinue`). Back and Next select the tab of the question they show. The reader's choices and words are kept when they step back and forth.

Implementation: `src/components/chat/chat-question-pending.tsx`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-33.6 - Focus on step

Stepping to another question by Back, Next or Enter shall move focus to that question's answer: its chosen radio, else its first radio, checkbox or text field, so the reader answers each question from the keyboard without searching for it. Choosing a question by its tab leaves focus on the tab.

Implementation: `src/components/chat/chat-question-pending.tsx`
Verification: `src/components/chat/chat-question-pending.test.tsx`, `e2e/chat-chat-question.spec.ts`

## UIC-CHAT-34 - Status

### UIC-CHAT-34.1 - Answered

An `answered` card shall collapse to a description list (`ui-chat-question__summary`) of `ui-chat-question__summary-item` groups, one per question, each holding the question's text (`ui-chat-question__summary-question`, a term) and what the reader answered from `answers` (`ui-chat-question__summary-answer`, its definition): `questionChose` with the chosen options' labels in offered order and then the words given for Other ("You chose PostgreSQL and Redis"), `questionAnsweredText` with the words of a `none` question, or `questionNoAnswer` for a question without an answer.

Implementation: `src/components/chat/chat-question-summary.tsx`, `src/components/chat/chat-question-model.ts`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-34.2 - Dismissed

A `dismissed` card shall collapse to its first question's text (`ui-chat-question__question`) and the provider's `questionDismissed` string in `ui-chat-question__status`.

Implementation: `src/components/chat/chat-question-summary.tsx`
Verification: `src/components/chat/chat-question.test.tsx`, `e2e/chat-chat-question.spec.ts`

### UIC-CHAT-34.3 - Announcement

A pending card shall hold a visually hidden polite status (`ui-chat-question__announcement`, `role="status"`) that receives the card's name (`questionAsked` with its first question and its question count) once, right after the card mounts, so the card is announced once without making it a live region.

Implementation: `src/components/chat/chat-question.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat/chat-question.test.tsx`

## UIC-CHAT-35 - Strings and hooks

### UIC-CHAT-35.1 - Strings

Every string the card renders shall come from the provider: its own in `src/core/strings/chat-question.ts`, with counts and lists formed by functions, and `back`, `next`, `dismiss` and `actionFailed` from the common strings.

Implementation: `src/core/strings/chat-question.ts`, `src/core/strings.ts`
Verification: `src/components/chat/chat-question.test.tsx`

### UIC-CHAT-35.2 - Hooks and caller attributes

`ChatQuestion` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat/chat-question.tsx`
Verification: `src/components/chat/chat-question.test.tsx`

## Chat Sources

`ChatSources` lists the sources an answer drew on, such as web pages or documents, collapsed behind a trigger that counts them ("Sources (3)"): a numbered list named by that count, each source's title (a [Link](LINK.md) when it has a URL), its site and a snippet, without favicons. `ChatCitation` is the inline numbered marker (`[1]`) that cites one of them in the answer's text: it links to the source and previews it in a [Hover Card](HOVER-CARD.md) on hover, keyboard focus and long press. `createCitationOverride` turns the `[n]` markers in a [Markdown](MARKDOWN.md) answer into citations ([UIC-MARKDOWN-2.8](MARKDOWN.md#uic-markdown-28---node-overrides)). Sources are numbered by their order: the first source is `[1]`.

## UIC-CHAT-36 - Sources list

### UIC-CHAT-36.1 - Labelled list

`ChatSources` shall render a `ui-chat-sources` root (React Aria `Disclosure`) holding a trigger button (`ui-chat-sources__trigger`) with a label (`ui-chat-sources__label`) that reads the provider's `chatSourcesLabel` string for the number of sources (`Sources (3)`) followed by the disclosure's indicator glyph (`ui-chat-sources__indicator`, pointing to the inline end while collapsed and down while open), then the panel (`ui-chat-sources__panel`, a `group` named by the trigger) holding an ordered list (`ui-chat-sources__list`) named by the label, with one `ui-chat-sources__item` per source in the order of `sources`, so each item's number is its citation number.

Implementation: `src/components/chat/chat-sources.tsx`, `src/core/strings/chat-sources.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-sources.test.tsx`, `e2e/chat-chat-sources.spec.ts`

### UIC-CHAT-36.2 - Source details

Each item shall show the source's `title` in `ui-chat-sources__title`: a [Link](LINK.md) to `url`, opening in a new tab when the URL is absolute `http` or `https`, or plain text without a URL or with one that is not safe to open (`isSafeUrl`: relative or `http`, `https`, `mailto` or `tel`, as links from content are checked), since sources come from model output. Then its site in `ui-chat-sources__site`, `siteName` or else the host of an absolute URL without `www.`, and its `snippet` in a `<p>` (`ui-chat-sources__snippet`). A part the source lacks is not rendered.

Implementation: `src/components/chat/chat-source-summary.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-sources.test.tsx`, `e2e/chat-chat-sources.spec.ts`

### UIC-CHAT-36.3 - Hooks and caller attributes

`ChatSources` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat/chat-sources.tsx`
Verification: `src/components/chat/chat-sources.test.tsx`

### UIC-CHAT-36.4 - Collapsed by default

`ChatSources` shall start collapsed, its list hidden, unless `defaultExpanded` is true. Pressing the trigger by pointer, touch, Enter or Space toggles the list; the trigger's `aria-expanded` follows it and the root publishes `data-expanded` while it is open. `isExpanded` controls the state, and `onExpandedChange` receives each state the reader requests, also while controlled.

Implementation: `src/components/chat/chat-sources.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-sources.test.tsx`, `e2e/chat-chat-sources.spec.ts`

## UIC-CHAT-37 - Citations

### UIC-CHAT-37.1 - Marker

`ChatCitation` shall render its `index` as `[n]` in a `ui-chat-citation__marker` span hidden from assistive technology, inside a `ui-chat-citation` trigger named by the provider's `chatCitationLabel` string with the number and the source's title (`Source 1: Lisbon weather`). With a `url`, the trigger is a [Link](LINK.md) to it, underlined on hover only (`underline="hover"`) and opening in a new tab (with Link's safe `rel` and new-tab text) when the URL is absolute `http` or `https`.

Implementation: `src/components/chat/chat-citation.tsx`, `src/core/strings/chat-sources.ts`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-citation.test.tsx`, `e2e/chat-chat-sources.spec.ts`

### UIC-CHAT-37.2 - Preview

The trigger shall open a [Hover Card](HOVER-CARD.md) (`ui-chat-citation__card`) after the pointer rests on it or keyboard focus reaches it, without moving focus, or on a long touch press, which moves focus into it ([UIC-HOVER-CARD-1.2](HOVER-CARD.md#uic-hover-card-12---opening)). The card is named by the source's title and shows it in `ui-chat-citation__title` (a link to the source when it has a URL), the site in `ui-chat-citation__site` and the snippet in `ui-chat-citation__snippet`, as a list item does ([UIC-CHAT-36.2](#uic-chat-362---source-details)). Tab from the trigger moves into the card; Escape closes it.

Implementation: `src/components/chat/chat-citation.tsx`, `src/components/chat/chat-source-summary.tsx`, `labs/reference/chat.css`
Verification: `src/components/chat/chat-citation.test.tsx`, `e2e/chat-chat-sources.spec.ts`

### UIC-CHAT-37.3 - Source without a URL

For a source without a `url`, or with one that is not safe to open ([UIC-CHAT-36.2](#uic-chat-362---source-details)), the trigger shall be a bare [Button](BUTTON.md) instead of a link, and pressing it (by pointer, touch or keyboard) opens the card at once.

Implementation: `src/components/chat/chat-citation.tsx`
Verification: `src/components/chat/chat-citation.test.tsx`, `e2e/chat-chat-sources.spec.ts`

### UIC-CHAT-37.4 - Hooks and caller attributes

`ChatCitation` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its trigger.

Implementation: `src/components/chat/chat-citation.tsx`
Verification: `src/components/chat/chat-citation.test.tsx`

## UIC-CHAT-38 - Markdown

### UIC-CHAT-38.1 - Citation override

`createCitationOverride(sources)` shall return a `renderNode` for [Markdown](MARKDOWN.md) that splits each text node at its markers, `[n]` or `[n, m, …]` for several, whose every number is between 1 and the number of sources, and draws each number as a `ChatCitation` of `sources[n - 1]`, the text between them through [Text Match](TEXT-MATCH.md). A marker with a number outside that range stays text, as do markers in code and markers inside a link or a task item's label (the `isInteractive` place [UIC-MARKDOWN-2.8](MARKDOWN.md#uic-markdown-28---node-overrides) reports), where a citation's link or button would nest in another interactive element; other nodes keep their default rendering. Server markup with such a marker therefore hydrates without a mismatch.

Implementation: `src/components/chat/markdown-citations.tsx`
Verification: `src/components/chat/markdown-citations.test.tsx`, `src/components/chat/markdown-citation-places.test.tsx`, `e2e/chat-chat-sources.spec.ts`

## Chat Tool Call

`ChatToolCall` is one call of a tool by an assistant, shown in a conversation as a collapsible card built on [Disclosure](DISCLOSURE.md): a trigger with the call's status, label and duration, and a body with the arguments and result as formatted, copyable JSON, or a custom body the host draws for that tool. A failed call keeps its error in the body. A call that asks for the reader's approval shows what it will do with Approve, Deny (with an optional reason) and Always allow, each offered only when the host handles it, with keyboard shortcuts; once decided, the card keeps the decision. The card takes its data as plain props (`ChatToolCallData`): `id`, `name`, `label`, `target`, `kind`, `status`, `args`, `result`, `error`, `durationMs` and `approval`.

## UIC-CHAT-39 - Card

### UIC-CHAT-39.1 - Parts

`ChatToolCall` shall render a `ui-chat-tool-call` element whose `id` is the call's `id`, holding a [Disclosure](DISCLOSURE.md) (`ui-chat-tool-call__disclosure`) whose title heading (`ui-chat-tool-call__heading`) holds the trigger and whose panel (`ui-chat-tool-call__body`) holds the body ([UIC-CHAT-40](#uic-chat-40---body)). The trigger holds one [Trace](TRACE.md) line (`TraceLine`, whose `status` is `running` while the call runs, `pending` while it waits to run or for approval, `error` once it failed, and unset otherwise) holding a decorative status glyph (`ui-chat-tool-call__status-glyph`, in a `TraceIcon`) and then the summary (`ui-chat-tool-call__summary`), which holds, in order, the label (`ui-chat-tool-call__label`, also a `TraceTitle`), the `target` (`ui-chat-tool-call__target`, also a `TraceDescription`) when given, the status (`ui-chat-tool-call__status`), the duration (`ui-chat-tool-call__duration`) when `durationMs` is given, and the auto-approved badge (`ui-chat-tool-call__badge`) when it applies, separated by spaces, so the trigger's name reads the label, the target, the status, the duration and the badge, and a label too long for one line wraps inside the summary, beside the glyph. The error ([UIC-CHAT-40.5](#uic-chat-405---error)) and the approval ([UIC-CHAT-42](#uic-chat-42---approval)) follow the disclosure, outside its panel, so collapsing the card never hides them.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-39.2 - Label

The label shall be `label` when given, else one derived from `name`: its words split at underscores, hyphens, dots, slashes, colons, spaces and case changes, joined by spaces in lower case except words written in capitals, with the first letter in upper case (`search_recipes` and `searchRecipes` read `Search recipes`, `get_HTTP_status` reads `Get HTTP status`). A name with no words is the label as given.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/format-tool-call.ts`
Verification: `src/components/chat/format-tool-call.test.ts`, `src/components/chat/chat-tool-call.test.tsx`

### UIC-CHAT-39.3 - Status

The root shall publish `status` as `data-status`: `pending`, `running`, `approval-requested`, `succeeded`, `failed`, `denied` or `cancelled`. The status shows as text from the provider's `toolCallStatus` (`Pending`, `Running`, `Needs approval`, `Done`, `Failed`, `Denied`, `Cancelled`), which is part of the trigger's name, beside a status glyph: `clock`, the library [Spinner](PROGRESS-BAR.md#uic-progress-bar-2---spinner) (also `ui-spinner`), `hand-raised`, the kind's glyph ([UIC-CHAT-39.7](#uic-chat-397---kind)), `error`, `no-symbol` and `x-circle` in that order. A `running` call is busy: the root carries `aria-busy="true"`.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-parts.tsx`, `src/core/strings/chat-tool.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-39.4 - Duration

Given `durationMs`, the duration shall show in the provider's `toolCallDuration` short form (`350 ms`, `1.2 s`, `2 min 5 s`), hidden from assistive technology, beside its long form for assistive technology (`350 milliseconds`, `1.2 seconds`, `2 minutes 5 seconds`), visually hidden. The unit shall follow the value as rounded for display, so 59 950 ms reads `1 min` rather than `60 s`, and 119 600 ms reads `2 min` rather than `1 min 60 s`.

Implementation: `src/components/chat/tool-call-parts.tsx`, `src/core/strings/chat-tool.ts`
Verification: `src/components/chat/chat-tool-call.test.tsx`

### UIC-CHAT-39.5 - Auto-approved

When `approval.isAutoApproved` is set, the trigger shall show a small [Badge](BADGE.md) with the provider's `toolCallAutoApproved` string, and the root publishes `data-auto-approved`.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-39.6 - Hooks and caller attributes

`ChatToolCall` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/chat/chat-tool-call.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`

### UIC-CHAT-39.7 - Kind

The root shall publish `kind`, what the call does, as `data-kind`: `read`, `edit`, `command`, `search`, `fetch` or `other` (the default). Once the call `succeeded`, its status glyph is the tool's ([UIC-CHAT-39.9](#uic-chat-399---tool-glyph-and-letter)), else its kind's: `file-text`, `edit`, `terminal`, `search`, `globe` and, for `other`, the letter glyph or `wrench`, so a finished call shows what it did. A group of steps sums its calls up by kind ([Chat Parts](CHAT.md#uic-chat-292---running-and-summary)).

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-parts.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-39.8 - Variant

The root shall publish `variant` as `data-variant`: `card` (the default), a call shown on its own, or `row`, a quiet call among the steps of a reply. [Chat Parts](#uic-chat-272---tool-calls) draws every call as a `row` in a group of steps, so its state survives parts streamed after it and styles written for the row reach every call of a reply. The variant changes no content or behaviour.

Implementation: `src/components/chat/chat-tool-call.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-parts.spec.ts`

### UIC-CHAT-39.9 - Tool glyph and letter

Once a call `succeeded`, its status glyph shall be, in order of precedence: the `glyph` given for the tool (a `GlyphComponent`, also given by tool name through `toolGlyphs` on [Chat Parts](CHAT.md#uic-chat-275---tool-glyphs)); else the kind's glyph for `read`, `edit`, `command`, `search` and `fetch`; else, for `other`, a letter glyph; else `wrench`. The letter glyph is a decorative SVG on the glyphs' 24 by 24 view box, a rounded outline box with the letter inside, drawn in the current color with the glyphs' 1.5 stroke and the surrounding font, carrying `ui-glyph`, `ui-chat-tool-call__status-glyph`, `data-glyph="letter"` and the letter as `data-letter`. The letter is the leading letter ([UIC-INITIALS-2.1](INITIALS.md#uic-initials-21---first-letter-or-digit)) of `source`, what provides the tool, such as an integration named `OneDrive`, else of `name`; a source or name without a letter or a digit shows `wrench`. Before the call succeeds, the status glyph shows ([UIC-CHAT-39.3](#uic-chat-393---status)) whatever the tool's glyph.

Implementation: `src/components/chat/tool-call-parts.tsx`, `src/components/chat/tool-call-letter-glyph.tsx`, `src/utils/initials.ts`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

## UIC-CHAT-40 - Body

### UIC-CHAT-40.1 - Arguments and result

The body shall show `args` and then `result`, each when defined, in a `ui-chat-tool-call__part` with `data-part` `arguments` or `result`: a `ui-chat-tool-call__part-header` holding the title (`ui-chat-tool-call__part-title`, the provider's `toolCallArguments` or `toolCallResult`) and its copy button, then the value as read-only text in a `<pre>` inside a [Scroll Region](SCROLL-REGION.md) (`ui-chat-tool-call__json`, scrolling on both axes) whose viewport is a focusable `group` labelled by the title, so a long value scrolls by keyboard. The text is JSON indented by two spaces; a string holding a JSON object or array is re-indented from its own tokens, changing only white space, so every number, string and repeated key keeps its text (a large integer, `1.0`, `-0`, `1e2`), and any other string, malformed JSON included, shows as given, and a value JSON cannot hold (a cycle, a function) shows as `String(value)`.

Implementation: `src/components/chat/tool-call-parts.tsx`, `src/components/chat/format-tool-call.ts`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `src/components/chat/format-tool-call.test.ts`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-40.2 - Copying

Each part's copy button (`ui-chat-tool-call__copy`, a [Copy Button](COPY-BUTTON.md)) shall copy the text the part shows and be named by the provider's `copyToolCallPart` from the part's title (`Copy arguments`, `Copy result`).

Implementation: `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`

### UIC-CHAT-40.3 - Custom body

`children` shall replace the arguments and result in the body, for a tool whose host draws its own view of the call, such as a forecast card for a weather tool.

Implementation: `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-40.4 - No details

Without `children`, `args` or `result`, the body shall show the provider's `toolCallNoDetails` string in `ui-chat-tool-call__empty`.

Implementation: `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`

### UIC-CHAT-40.5 - Error

A `failed` call with an `error` shall show the error in a `ui-chat-tool-call__error` element at the top of the body, before the arguments and result or the custom body, with a decorative `error` glyph. Like the rest of the body, it shows only while the card is expanded, so collapsing the card hides all of the error; the trigger keeps the label, the `error` status glyph and the `Failed` status.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-parts.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

## UIC-CHAT-41 - Expansion

### UIC-CHAT-41.1 - Expanded state

Pressing the trigger shall toggle the body as [UIC-DISCLOSURE-1.2](DISCLOSURE.md#uic-disclosure-12---expanding-and-collapsing) does. Uncontrolled, the card follows its status, open while it is `approval-requested` and closed otherwise, until the reader toggles it; a `failed` call starts closed, whether it is loaded failed or fails while shown; from then on the reader's choice holds. `defaultExpanded` sets the state at first instead, and it then holds until the reader toggles it. The reader's choice belongs to the call's `id`: when the card shows another call, it follows that call's status again. `isExpanded` controls the state, and `onExpandedChange` receives each requested state, also while controlled.

Implementation: `src/components/chat/chat-tool-call.tsx`
Verification: `src/components/chat/chat-tool-call.test.tsx`, `src/components/chat/tool-call-identity.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

## UIC-CHAT-42 - Approval

### UIC-CHAT-42.1 - Request

While the call is `approval-requested` and `approval.decision` is unset, the approval is pending: after the disclosure, a `ui-chat-tool-call__approval` `group` labelled by its prompt (`ui-chat-tool-call__prompt`, the provider's `toolCallApprovalPrompt` from the label, `Allow “Search recipes”?`) shall hold a `ui-chat-tool-call__actions` row of small buttons (`ui-chat-tool-call__action`, with `data-action`), each only when its callback is given: Approve (`approve`, primary, the provider's `approve` string) calls `onApprove`; Deny (`deny`, the provider's `toolCallDeny`) opens the reason form ([UIC-CHAT-42.2](#uic-chat-422---deny-with-a-reason)); Always allow (`always`, the provider's `toolCallAlwaysAllow` from `approval.scopeLabel`, `Always allow in this conversation`) calls `onAlwaysAllow`. The body is open by default ([UIC-CHAT-41.1](#uic-chat-411---expanded-state)), so the reader sees what the tool will do.

Implementation: `src/components/chat/chat-tool-call.tsx`, `src/components/chat/tool-call-approval.tsx`, `src/core/strings/chat-tool.ts`
Verification: `src/components/chat/tool-call-approval.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-42.2 - Deny with a reason

Within full Chat, an open denial form and its literal draft shall survive virtual unmounts by conversation, message and part identity. Remounting restores the form without taking focus. A decision or conversation change resets it; standalone cards keep local state.

Pressing Deny shall replace the buttons with a `ui-chat-tool-call__deny-form` holding a [Text Field](TEXT-FIELD.md) (`ui-chat-tool-call__reason`, labelled by the provider's `toolCallDenyReason`), which takes focus, then Send (the provider's `send`) and Cancel (`cancel`). Send, or Enter in the field, calls `onDeny` with the trimmed reason, or with no reason when it is blank, closes the form and moves focus to Deny. Cancel closes the form, forgets the reason and moves focus to Deny without calling `onDeny`. The form closes, forgetting the reason, when the approval stops being pending, so a later request starts with the buttons. The form and its reason belong to the call's `id`: when the card shows another call, it starts with the buttons and no reason, while updates to the same call keep the form, its reason and its focus. When the form closes this way while it holds focus, focus moves to Deny.

Implementation: `src/components/chat/tool-call-approval.tsx`, `src/components/chat/use-tool-call-approval.ts`, `src/utils/use-retained-state.ts`
Verification: `src/components/chat/tool-call-approval.test.tsx`, `src/components/chat/tool-call-identity.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`, `src/components/chat/chat-retained-inputs.test.tsx`, `e2e/chat-native.spec.ts`

### UIC-CHAT-42.3 - Keyboard shortcuts

While the approval is pending and focus is anywhere in the card, Ctrl+Enter or Cmd+Enter shall call `onApprove`, or send the denial while the reason form is open, and Escape shall move focus to Deny, or cancel the open reason form. The card catches these keys before the focused control, so a focused button is not pressed by them; Escape with focus already on Deny (once Deny's tooltip, which keyboard focus opens, has closed on a first Escape), keys whose callback is missing and keys on a resolved approval go on to the page, so an enclosing transcript can take them. Approve publishes `Ctrl+Enter` and Deny `Escape` through the [Button](BUTTON.md)'s `shortcut` (`aria-keyshortcuts` and the tooltip's keys, [UIC-BUTTON-1.7](BUTTON.md#uic-button-17---keyboard-shortcut)) whenever they show, as a disabled command keeps its shortcut.

Implementation: `src/components/chat/use-tool-call-approval.ts`, `src/components/chat/tool-call-approval.tsx`
Verification: `src/components/chat/use-tool-call-approval.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-42.4 - Decision

Once `approval.decision` is set, whatever the status, the approval shall be resolved: the prompt leaves, the group publishes `data-decision` (`approved`, `denied` or `always`) and is labelled by the decision, which shows in a `ui-chat-tool-call__decision` status (`role="status"`, present while the approval shows, so a decision made while it is on the page is announced) as the provider's `toolCallDecision`: `Approved`, `Denied`, `Denied: <reason>` with `approval.reason`, or `Always allowed`. The keyboard shortcuts stop working. A call that leaves `approval-requested` without a decision shows no approval.

Implementation: `src/components/chat/tool-call-approval.tsx`, `src/core/strings/chat-tool.ts`
Verification: `src/components/chat/tool-call-approval.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

### UIC-CHAT-42.5 - Focus across changes

When the approval resolves while focus is inside it, its buttons shall stay, the same elements with `aria-disabled="true"`, until focus moves to another element outside the approval, so the reader keeps their place and can read the buttons they had; otherwise a resolved approval shows only its decision. When the approval leaves the card while focus is inside it, focus moves to the card's trigger.

Implementation: `src/components/chat/tool-call-approval.tsx`
Verification: `src/components/chat/tool-call-approval.test.tsx`, `e2e/chat-chat-tool-call.spec.ts`

## UIC-CHAT-43 - Composable assistant chat

### UIC-CHAT-43.1 - Thread and prompt

The [assistant thread lab](../labs/assistant-chat.html) shall compose a named `MessageScroller` with an end-aligned `Bubble` for the reader's question and a plain `Message` with `ChatParts` and a reply action for the assistant. An empty conversation shows its welcome until the first message. A native form with `InputGroupTextarea` submits one prompt per send, uses Send and Stop controls, and stays outside the viewport. With `autoScroll`, the sent prompt anchors before the streamed reply fills the available space, then the scroller follows the reply to its end. Starting a new conversation resets the thread and draft.

Implementation: `labs/src/assistant-chat.lab.tsx`, `labs/src/assistant-chat-cases.tsx`, `labs/src/assistant-chat-data.ts`
Verification: `e2e/assistant-chat.spec.ts`

### UIC-CHAT-43.2 - Reading during a reply

The history example shall keep visible messages in place when the host prepends older ones. Reader scrolling releases the anchor and following, so later chunks do not take the reader away from older messages. Jump to latest returns to the end and resumes following.

Implementation: `labs/src/assistant-chat-cases.tsx`, `labs/src/assistant-chat-data.ts`, `src/components/message-scroller/scroller-runtime.ts`
Verification: `e2e/assistant-chat.spec.ts`

### UIC-CHAT-43.3 - Inline responses

An assistant reply that waits for tool approval shall leave its approval operable while the run is still active. Answering the request lets the same reply continue in place. This is separate from whether the scroller has a completed arrival to announce.

Implementation: `labs/src/assistant-chat-cases.tsx`, `labs/src/assistant-chat-data.ts`
Verification: `e2e/assistant-chat.spec.ts`

## Hooks

| Hook                                        | Kind      | Values / Meaning                                                                         |
| ------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `ui-chat`                                   | root      |                                                                                          | The conversation.                                                                  |
| `ui-chat__search-toggle`                    | slot      |                                                                                          | The header's search button (also `ui-button`).                                     |
| `ui-chat__search`                           | slot      |                                                                                          | The search bar under the header (also `ui-find-bar`).                              |
| `ui-chat__transcript`                       | slot      |                                                                                          | The transcript (also `ui-chat-transcript`).                                        |
| `ui-chat__typing`                           | slot      |                                                                                          | Who is typing (also `ui-chat-typing-indicator`).                                   |
| `ui-chat__status`                           | slot      |                                                                                          | In a reply: what the assistant is thinking or doing (also `ui-chat-status-line`).  |
| `ui-chat__queue`                            | slot      |                                                                                          | The queue of follow-ups above the composer.                                        |
| `ui-chat__queue-label`                      | slot      |                                                                                          | The queue's label, with its count.                                                 |
| `ui-chat__queue-list`                       | slot      |                                                                                          | The ordered list of queued messages.                                               |
| `ui-chat__queue-item`                       | slot      |                                                                                          | One queued message.                                                                |
| `ui-chat__queue-text`                       | slot      |                                                                                          | A queued message's text.                                                           |
| `ui-chat__queue-attachments`                | slot      |                                                                                          | A queued message's files (also `ui-attachment-list`).                              |
| `ui-chat__queue-steer`                      | slot      |                                                                                          | Send a queued message into the conversation now (also `ui-button`).                |
| `ui-chat__queue-edit`                       | slot      |                                                                                          | Edit a queued message (also `ui-button`).                                          |
| `ui-chat__queue-remove`                     | slot      |                                                                                          | Remove a queued message (also `ui-button`).                                        |
| `ui-chat__progress`                         | slot      |                                                                                          | What the chat waits for the host to accept, a polite live region.                  |
| `ui-chat__progress-icon`                    | slot      |                                                                                          | The progress line's clock, spinner or host icon.                                   |
| `ui-chat__progress-label`                   | slot      |                                                                                          | The progress line's text, such as "Sending…".                                      |
| `ui-chat__composer`                         | slot      |                                                                                          | The composer (also `ui-message-composer`).                                         |
| `ui-chat__disclaimer`                       | slot      |                                                                                          | The caller's disclaimer under the composer.                                        |
| `ui-chat__banner`                           | slot      |                                                                                          | The reply or edit banner's text, inside the composer's banner.                     |
| `ui-chat__banner-label`                     | slot      |                                                                                          | What the banner is about: replying, or editing.                                    |
| `ui-chat__banner-cancel`                    | slot      |                                                                                          | Cancel reply (also `ui-button`).                                                   |
| `data-editing`                              | state     | `true`                                                                                   | On a queued message the composer edits.                                            |
| `data-steering`                             | state     | `true`                                                                                   | On a queued message whose steer the host has not accepted yet.                     |
| `data-action`                               | state     | `send`, `queue`, `steer`, `save`, `remove`                                               | On the progress line while it shows: what it waits for.                            |
| `ui-chat-header`                            | root      |                                                                                          | The header.                                                                        |
| `ui-chat-header__avatar`                    | slot      |                                                                                          | The participants' avatar or avatar group.                                          |
| `ui-chat-header__text`                      | slot      |                                                                                          | The title and the status line.                                                     |
| `ui-chat-header__title`                     | slot      |                                                                                          | The title, a heading.                                                              |
| `ui-chat-header__status`                    | slot      |                                                                                          | Who is typing, or what the assistant is doing.                                     |
| `ui-chat-header__actions`                   | slot      |                                                                                          | The search button and the host's controls.                                         |
| `ui-chat__compose`                          | slot      |                                                                                          | The queue and composer surface.                                                    |
| `ui-chat__queue-handle`                     | slot      |                                                                                          | Queue reorder handle.                                                              |
| `ui-chat__queue-menu`                       | slot      |                                                                                          | Queue action menu trigger.                                                         |
| `data-dragging`                             | state     | `true`                                                                                   | A queued row being dragged.                                                        |
| `data-drop-position`                        | attribute | `before`, `after`                                                                        | A queued row accepting a drop.                                                     |
| `ui-chat-reasoning`                         | root      |                                                                                          | Reasoning's disclosure `<div>` (React Aria `Disclosure`).                          |
| `ui-chat-reasoning__trigger`                | slot      |                                                                                          | The trigger button.                                                                |
| `ui-chat-reasoning__label`                  | slot      |                                                                                          | The label: "Thinking…" or how long it took.                                        |
| `ui-chat-reasoning__spinner`                | slot      |                                                                                          | The decorative busy indicator while it streams.                                    |
| `ui-chat-reasoning__panel`                  | slot      |                                                                                          | The panel (React Aria `DisclosurePanel`).                                          |
| `ui-chat-reasoning__text`                   | slot      |                                                                                          | The reasoning text (also `ui-markdown` in the Markdown format).                    |
| `ui-chat-steps`                             | root      |                                                                                          | A group of steps' disclosure `<div>` (React Aria `Disclosure`).                    |
| `ui-chat-steps__trigger`                    | slot      |                                                                                          | The trigger button.                                                                |
| `ui-chat-steps__glyph`                      | slot      |                                                                                          | The glyph of the first action's kind (also `ui-glyph`).                            |
| `ui-chat-steps__label`                      | slot      |                                                                                          | The label: "Working…" or what the run did.                                         |
| `ui-chat-steps__spinner`                    | slot      |                                                                                          | The decorative busy indicator while the run goes on.                               |
| `ui-chat-steps__panel`                      | slot      |                                                                                          | The panel holding the steps (React Aria `DisclosurePanel`).                        |
| `ui-chat-plan`                              | root      |                                                                                          | A plan's `<div>`.                                                                  |
| `ui-chat-plan__header`                      | slot      |                                                                                          | The title and the progress.                                                        |
| `ui-chat-plan__title`                       | slot      |                                                                                          | The title.                                                                         |
| `ui-chat-plan__progress`                    | slot      |                                                                                          | How many steps are done.                                                           |
| `ui-chat-plan__list`                        | slot      |                                                                                          | The `<ol>` of steps.                                                               |
| `ui-chat-plan__step`                        | slot      |                                                                                          | A step's `<li>`.                                                                   |
| `ui-chat-plan__glyph`                       | slot      |                                                                                          | A step's status glyph (also `ui-glyph`).                                           |
| `ui-chat-plan__spinner`                     | slot      |                                                                                          | The decorative busy indicator of the step in progress.                             |
| `ui-chat-plan__label`                       | slot      |                                                                                          | A step's label.                                                                    |
| `ui-chat-status-line`                       | root      |                                                                                          | The status line's `<div>`.                                                         |
| `ui-chat-status-line__spinner`              | slot      |                                                                                          | The decorative busy indicator.                                                     |
| `ui-chat-status-line__icon`                 | slot      |                                                                                          | The caller's decorative icon, in place of the busy indicator.                      |
| `ui-chat-status-line__text`                 | slot      |                                                                                          | What the assistant is thinking or doing.                                           |
| `data-status`                               | attribute | `streaming`, `complete`, `pending`, `in-progress`, `done`, `failed`, `skipped`           | On reasoning: whether it streams. On a plan step: where it stands.                 |
| `data-format`                               | attribute | `markdown`, `plain`                                                                      | On reasoning: how its text renders.                                                |
| `data-running`                              | state     | `true`                                                                                   | On a group of steps: the run goes on.                                              |
| `data-activity`                             | attribute | `thinking`, `writing`                                                                    | On a status line: whether the assistant thinks or writes.                          |
| `data-expanded`                             | state     | `true`                                                                                   | On reasoning or a group of steps: the panel shows (React Aria).                    |
| `data-focus-visible-within`                 | state     | `true`                                                                                   | On reasoning, a group of steps or their panel: keyboard focus inside (React Aria). |
| `data-hovered`                              | state     | `true`                                                                                   | On a trigger, while the pointer is over it (React Aria).                           |
| `data-pressed`                              | state     | `true`                                                                                   | On a trigger, while pressed (React Aria).                                          |
| `data-focused`                              | state     | `true`                                                                                   | On a trigger, while focused (React Aria).                                          |
| `data-focus-visible`                        | state     | `true`                                                                                   | On a trigger, while focused by keyboard (React Aria).                              |
| `ui-chat-list`                              | root      |                                                                                          | The list's frame.                                                                  |
| `ui-chat-list__header`                      | slot      |                                                                                          | The New chat button and the search field.                                          |
| `ui-chat-list__search`                      | slot      |                                                                                          | The search field (also `ui-search-field`).                                         |
| `ui-chat-list__new`                         | slot      |                                                                                          | The New chat button (also `ui-button`).                                            |
| `ui-chat-list__body`                        | slot      |                                                                                          | The heading, the grid list and the Load more row.                                  |
| `ui-chat-list__heading`                     | slot      |                                                                                          | The heading above the rows, which names the grid list.                             |
| `ui-chat-list__list`                        | slot      |                                                                                          | The grid list (`role="grid"`).                                                     |
| `ui-chat-list__conversation`                | slot      |                                                                                          | A conversation row (`role="row"`).                                                 |
| `ui-chat-list__avatar`                      | slot      |                                                                                          | The decorative icon, avatar with presence, or avatar group.                        |
| `ui-chat-list__title`                       | slot      |                                                                                          | The title.                                                                         |
| `ui-chat-list__time`                        | slot      |                                                                                          | The time of the last message (also `ui-attribution`).                              |
| `ui-chat-list__preview`                     | slot      |                                                                                          | The last message, on one line.                                                     |
| `ui-chat-list__muted`                       | slot      |                                                                                          | The muted mark (also `ui-icon`).                                                   |
| `ui-chat-list__status`                      | slot      |                                                                                          | The host's status mark (also `ui-icon`).                                           |
| `ui-chat-list__activity`                    | slot      |                                                                                          | The dots showing a participant typing or working.                                  |
| `ui-chat-list__activity-dot`                | slot      |                                                                                          | One of the activity's three dots.                                                  |
| `ui-chat-list__unread`                      | slot      |                                                                                          | The unread count (also `ui-badge`).                                                |
| `ui-chat-list__empty`                       | slot      |                                                                                          | The empty or no-match notice.                                                      |
| `ui-chat-list__skeleton`                    | slot      |                                                                                          | A placeholder row while loading.                                                   |
| `ui-chat-list__skeleton-start`              | slot      |                                                                                          | A placeholder row's icon or avatar (also `ui-skeleton`).                           |
| `ui-chat-list__skeleton-text`               | slot      |                                                                                          | A placeholder row's lines (also `ui-skeleton-text`).                               |
| `ui-chat-list__load-more`                   | slot      |                                                                                          | The Load more row (also `ui-load-more`, `ui-button`).                              |
| `data-loading`                              | state     | `true`                                                                                   | On the root: the conversations are loading.                                        |
| `data-loading-more`                         | state     | `true`                                                                                   | On the root: the next conversations are loading.                                   |
| `data-loading-rows`                         | state     | `titles`, `icons`, `avatars`                                                             | On the root while loading: the placeholder rows' shape.                            |
| `data-has-more`                             | state     | `true`                                                                                   | On the root: more conversations can load (`onLoadMore`).                           |
| `data-edge-fades`                           | state     | `true`                                                                                   | On the root: the last rows fade (`showEdgeFades`).                                 |
| `data-unread`                               | state     | `true`                                                                                   | On a row: it has unread messages.                                                  |
| `data-muted`                                | state     | `true`                                                                                   | On a row: its notifications are off.                                               |
| `data-menu-open`                            | state     | `true`                                                                                   | On a row: its context menu is open.                                                |
| `data-selected`                             | state     | `true`                                                                                   | On a row: the selected conversation (React Aria).                                  |
| `data-selection-mode`                       | state     | `single`                                                                                 | On a row: the list's selection mode (React Aria).                                  |
| `data-hovered`                              | state     | `true`                                                                                   | On a row: under the pointer (React Aria).                                          |
| `data-pressed`                              | state     | `true`                                                                                   | On a row: being pressed (React Aria).                                              |
| `data-focused`                              | state     | `true`                                                                                   | On the grid list or a row: has focus (React Aria).                                 |
| `data-focus-visible`                        | state     | `true`                                                                                   | On the grid list or a row: has keyboard focus (React Aria).                        |
| `data-focus-visible-within`                 | state     | `true`                                                                                   | On a row: keyboard focus inside it (React Aria).                                   |
| `data-empty`                                | state     | `true`                                                                                   | On the grid list: it has no rows (React Aria).                                     |
| `data-layout`                               | state     | `stack`                                                                                  | On the grid list: its layout (React Aria).                                         |
| `data-orientation`                          | state     | `vertical`                                                                               | On the grid list: its orientation (React Aria).                                    |
| `data-collection`                           | state     |                                                                                          | React Aria's collection marker, on the grid list and its rows.                     |
| `data-key`                                  | state     |                                                                                          | On a row: opaque collection key (React Aria); not for styling.                     |
| `ui-chat-message-actions`                   | root      |                                                                                          | The toolbar (`role="toolbar"`).                                                    |
| `ui-chat-message-actions__copy`             | slot      |                                                                                          | Copy (also `ui-button`).                                                           |
| `ui-chat-message-actions__status`           | slot      |                                                                                          | The visually hidden status that reads the copy's outcome.                          |
| `ui-chat-message-actions__rating`           | slot      |                                                                                          | A rating toggle (also `ui-button`).                                                |
| `ui-chat-message-actions__reply`            | slot      |                                                                                          | Reply (also `ui-button`).                                                          |
| `ui-chat-message-actions__react`            | slot      |                                                                                          | React (also `ui-button`).                                                          |
| `ui-chat-message-actions__edit`             | slot      |                                                                                          | Edit (also `ui-button`).                                                           |
| `ui-chat-message-actions__delete`           | slot      |                                                                                          | Delete (also `ui-button`).                                                         |
| `ui-chat-message-actions__feedback`         | slot      |                                                                                          | The feedback details popover (also `ui-popover`).                                  |
| `ui-chat-message-actions__reasons`          | slot      |                                                                                          | The group of reason chips.                                                         |
| `ui-chat-message-actions__reason`           | slot      |                                                                                          | A reason chip (also `ui-button`).                                                  |
| `ui-chat-message-actions__comment`          | slot      |                                                                                          | The comment field (also `ui-text-field`).                                          |
| `ui-chat-message-actions__feedback-actions` | slot      |                                                                                          | Skip and Submit.                                                                   |
| `ui-chat-message-actions__emoji-popover`    | slot      |                                                                                          | The popover holding the emoji picker.                                              |
| `data-open`                                 | state     | `true`                                                                                   | On the toolbar: an overlay of its commands is open.                                |
| `data-copied`                               | state     | `true`                                                                                   | On the toolbar: the last copy reached the clipboard, for two seconds.              |
| `data-orientation`                          | state     | `horizontal`                                                                             | On the toolbar: its axis (React Aria).                                             |
| `data-rating`                               | attribute | `up`, `down`                                                                             | On a rating toggle: which rating it chooses.                                       |
| `data-placement`                            | state     | `top`, `bottom`, `left`, `right`                                                         | On the emoji popover: its resolved side (React Aria).                              |
| `data-entering`                             | state     | `true`                                                                                   | On the emoji popover: it is opening (React Aria).                                  |
| `data-exiting`                              | state     | `true`                                                                                   | On the emoji popover: it is closing (React Aria).                                  |
| `ui-chat-model-picker`                      | root      |                                                                                          | The trigger (also `ui-button`).                                                    |
| `ui-chat-model-picker__model`               | slot      |                                                                                          | The current model's name on the trigger.                                           |
| `ui-chat-model-picker__effort`              | slot      |                                                                                          | The current effort's name on the trigger, while the model takes one.               |
| `ui-chat-model-picker__menu`                | slot      |                                                                                          | The menu of models and efforts (also `ui-menu`).                                   |
| `data-has-effort`                           | state     | `true`                                                                                   | The current model takes an effort, which the trigger shows.                        |
| `data-compact`                              | state     | `true`                                                                                   | The composer around it is compact: the trigger shows its icon alone.               |
| `ui-chat-parts`                             | root      |                                                                                          | The parts' `<div>`.                                                                |
| `ui-chat-parts__text`                       | slot      |                                                                                          | A text part: the Markdown root (also `ui-markdown`) or a plain-text `<div>`.       |
| `ui-chat-parts__token`                      | slot      |                                                                                          | A token's pill: a mention's or command's label, or a reference's chip.             |
| `ui-chat-parts__diff`                       | slot      |                                                                                          | A diff part: its title and its `TextDiff`.                                         |
| `ui-chat-parts__diff-title`                 | slot      |                                                                                          | A diff part's title.                                                               |
| `data-format`                               | attribute | `markdown`, `plain`                                                                      | On a text part: how it renders.                                                    |
| `data-kind`                                 | attribute | `mention`, `command`, `reference`, `trigger`                                             | On a token: what it stands for.                                                    |
| `ui-chat-question`                          | root      |                                                                                          | The card (`role="group"`).                                                         |
| `ui-chat-question__form`                    | slot      |                                                                                          | The pending card's questionnaire (also `ui-questionnaire`).                        |
| `ui-chat-question__tabs`                    | slot      |                                                                                          | The questions' tabs, the counter and the panel (also `ui-tabs`).                   |
| `ui-chat-question__tab`                     | slot      |                                                                                          | One question's tab (also `ui-tabs__tab`).                                          |
| `ui-chat-question__progress`                | slot      |                                                                                          | The counter after the tabs.                                                        |
| `ui-chat-question__panel`                   | slot      |                                                                                          | The shown question's panel (also `ui-tabs__panel`).                                |
| `ui-chat-question__item`                    | slot      |                                                                                          | One question (also `ui-questionnaire__item`).                                      |
| `ui-chat-question__question`                | slot      |                                                                                          | The question's text.                                                               |
| `ui-chat-question__answer`                  | slot      |                                                                                          | The options, the Other field and the preview.                                      |
| `ui-chat-question__options`                 | slot      |                                                                                          | The radio group or checkbox group.                                                 |
| `ui-chat-question__option`                  | slot      |                                                                                          | One option: its radio or checkbox and description.                                 |
| `ui-chat-question__recommended`             | slot      |                                                                                          | The "Recommended" badge (also `ui-badge`).                                         |
| `ui-chat-question__description`             | slot      |                                                                                          | An option's description.                                                           |
| `ui-chat-question__other`                   | slot      |                                                                                          | The field for the words given for Other (also `ui-text-field`).                    |
| `ui-chat-question__text`                    | slot      |                                                                                          | The field of a free-text question (also `ui-text-field`).                          |
| `ui-chat-question__preview`                 | slot      |                                                                                          | The preview of the focused or chosen option.                                       |
| `ui-chat-question__error`                   | slot      |                                                                                          | Why the last request failed (also `ui-inline-error`).                              |
| `ui-chat-question__actions`                 | slot      |                                                                                          | Back, Next or Submit, and Dismiss.                                                 |
| `ui-chat-question__back`                    | slot      |                                                                                          | The Back button (also `ui-button`).                                                |
| `ui-chat-question__next`                    | slot      |                                                                                          | The Next button (also `ui-button`).                                                |
| `ui-chat-question__submit`                  | slot      |                                                                                          | The Submit button (also `ui-button`).                                              |
| `ui-chat-question__dismiss`                 | slot      |                                                                                          | The Dismiss button (also `ui-button`).                                             |
| `ui-chat-question__announcement`            | slot      |                                                                                          | The visually hidden status that announces a pending card.                          |
| `ui-chat-question__summary`                 | slot      |                                                                                          | The answers of an answered card (`<dl>`).                                          |
| `ui-chat-question__summary-item`            | slot      |                                                                                          | One question and its answer.                                                       |
| `ui-chat-question__summary-question`        | slot      |                                                                                          | The question's text (`<dt>`).                                                      |
| `ui-chat-question__summary-answer`          | slot      |                                                                                          | What the reader answered (`<dd>`).                                                 |
| `ui-chat-question__status`                  | slot      |                                                                                          | "Dismissed" on a dismissed card.                                                   |
| `data-status`                               | attribute | `pending`, `answered`, `dismissed`                                                       | On the root: whether the card asks or sums up.                                     |
| `data-stepped`                              | state     | `true`                                                                                   | On the root: more than one question, asked one at a time while pending.            |
| `data-submitting`                           | state     | `true`                                                                                   | On the root: the answers or the dismissal sent are unsettled.                      |
| `data-answered-mark`                        | attribute | `icon`, `style`                                                                          | On the root: how answered tabs are marked.                                         |
| `data-selection-mode`                       | attribute | `single`, `multiple`, `none`                                                             | On the item: how the question is answered.                                         |
| `data-has-preview`                          | state     | `true`                                                                                   | On the answer: an option has a preview.                                            |
| `data-orientation`                          | attribute | `vertical`                                                                               | On the radio group: the arrow-key axis (React Aria).                               |
| `data-readonly`                             | state     | `true`                                                                                   | On the options: read-only while submitting or unanswerable (React Aria).           |
| `data-selected`                             | state     | `true`                                                                                   | On an option: chosen or ticked.                                                    |
| `data-recommended`                          | state     | `true`                                                                                   | On an option: the agent recommends it.                                             |
| `data-other`                                | state     | `true`                                                                                   | On an option: the Other choice.                                                    |
| `data-answered`                             | state     | `true`                                                                                   | On a tab: the question has an answer.                                              |
| `ui-chat-sources`                           | root      |                                                                                          | The sources' disclosure `<div>` (React Aria `Disclosure`).                         |
| `ui-chat-sources__trigger`                  | slot      |                                                                                          | The trigger button.                                                                |
| `ui-chat-sources__label`                    | slot      |                                                                                          | The label counting the sources, which also names the list.                         |
| `ui-chat-sources__indicator`                | slot      |                                                                                          | The disclosure chevron (also `ui-glyph`).                                          |
| `ui-chat-sources__panel`                    | slot      |                                                                                          | The panel holding the list (React Aria `DisclosurePanel`).                         |
| `ui-chat-sources__list`                     | slot      |                                                                                          | The `<ol>` of sources.                                                             |
| `ui-chat-sources__item`                     | slot      |                                                                                          | One source's `<li>`.                                                               |
| `ui-chat-sources__title`                    | slot      |                                                                                          | A source's title: a link (also `ui-link`) or text.                                 |
| `ui-chat-sources__site`                     | slot      |                                                                                          | A source's site.                                                                   |
| `ui-chat-sources__snippet`                  | slot      |                                                                                          | A source's snippet.                                                                |
| `ui-chat-citation`                          | root      |                                                                                          | The marker's trigger: a link (also `ui-link`) or a bare button.                    |
| `ui-chat-citation__marker`                  | slot      |                                                                                          | The visible `[n]`, hidden from assistive technology.                               |
| `ui-chat-citation__card`                    | slot      |                                                                                          | The preview card (also `ui-hover-card`), portalled.                                |
| `ui-chat-citation__title`                   | slot      |                                                                                          | The card's title: a link (also `ui-link`) or text.                                 |
| `ui-chat-citation__site`                    | slot      |                                                                                          | The card's site.                                                                   |
| `ui-chat-citation__snippet`                 | slot      |                                                                                          | The card's snippet.                                                                |
| `data-expanded`                             | state     | `true`                                                                                   | On the sources' root: the list shows (React Aria).                                 |
| `data-focus-visible-within`                 | state     | `true`                                                                                   | On the sources' root or panel: keyboard focus inside (React Aria).                 |
| `data-hovered`                              | state     | `true`                                                                                   | On the trigger, while the pointer is over it (React Aria).                         |
| `data-pressed`                              | state     | `true`                                                                                   | On the trigger, while pressed (React Aria).                                        |
| `data-focused`                              | state     | `true`                                                                                   | On the trigger, while focused (React Aria).                                        |
| `data-focus-visible`                        | state     | `true`                                                                                   | On the trigger, while focused by keyboard (React Aria).                            |
| `ui-chat-tool-call`                         | root      |                                                                                          | The card's `<div>`.                                                                |
| `ui-chat-tool-call__disclosure`             | slot      |                                                                                          | The collapsible header and body (also `ui-disclosure`).                            |
| `ui-chat-tool-call__heading`                | slot      |                                                                                          | The heading around the trigger (also `ui-disclosure__heading`).                    |
| `ui-chat-tool-call__status-glyph`           | slot      |                                                                                          | The status glyph in the trigger (also `ui-glyph`, or `ui-spinner` while running).  |
| `ui-chat-tool-call__summary`                | slot      |                                                                                          | The label, status, duration and badge, which wrap beside the glyph.                |
| `ui-chat-tool-call__label`                  | slot      |                                                                                          | The label in the trigger.                                                          |
| `ui-chat-tool-call__target`                 | slot      |                                                                                          | What the call acted on, after the label.                                           |
| `ui-chat-tool-call__status`                 | slot      |                                                                                          | The status text in the trigger.                                                    |
| `ui-chat-tool-call__duration`               | slot      |                                                                                          | The duration in the trigger.                                                       |
| `ui-chat-tool-call__badge`                  | slot      |                                                                                          | The auto-approved badge (also `ui-badge`).                                         |
| `ui-chat-tool-call__body`                   | slot      |                                                                                          | The collapsible body (also `ui-disclosure__panel`).                                |
| `ui-chat-tool-call__part`                   | slot      |                                                                                          | The arguments or the result.                                                       |
| `ui-chat-tool-call__part-header`            | slot      |                                                                                          | A part's title and copy button.                                                    |
| `ui-chat-tool-call__part-title`             | slot      |                                                                                          | A part's title.                                                                    |
| `ui-chat-tool-call__copy`                   | slot      |                                                                                          | A part's copy button (also `ui-copy-button`).                                      |
| `ui-chat-tool-call__json`                   | slot      |                                                                                          | A part's scrolling JSON text (also `ui-scroll-region`).                            |
| `ui-chat-tool-call__empty`                  | slot      |                                                                                          | The note of a body with nothing to show.                                           |
| `ui-chat-tool-call__error`                  | slot      |                                                                                          | A failed call's error, at the top of the body.                                     |
| `ui-chat-tool-call__approval`               | slot      |                                                                                          | The approval request, then its decision.                                           |
| `ui-chat-tool-call__prompt`                 | slot      |                                                                                          | The pending request's question.                                                    |
| `ui-chat-tool-call__actions`                | slot      |                                                                                          | The row of approval buttons.                                                       |
| `ui-chat-tool-call__action`                 | slot      |                                                                                          | An approval button (also `ui-button`).                                             |
| `ui-chat-tool-call__deny-form`              | slot      |                                                                                          | The deny reason form (also `ui-form`).                                             |
| `ui-chat-tool-call__reason`                 | slot      |                                                                                          | The deny reason field (also `ui-text-field`).                                      |
| `ui-chat-tool-call__decision`               | slot      |                                                                                          | The decision status.                                                               |
| `data-variant`                              | attribute | `card`, `row`                                                                            | On the card: a card on its own, or a quiet row among a reply's steps.              |
| `data-status`                               | state     | `pending`, `running`, `approval-requested`, `succeeded`, `failed`, `denied`, `cancelled` | On the card: where the call stands.                                                |
| `data-kind`                                 | state     | `read`, `edit`, `command`, `search`, `fetch`, `other`                                    | On the card: what the call does.                                                   |
| `data-auto-approved`                        | state     | `true`                                                                                   | On the card: the call ran without asking because it was always allowed.            |
| `data-letter`                               | attribute | one letter or digit                                                                      | On a letter status glyph: the letter it shows.                                     |
| `data-part`                                 | state     | `arguments`, `result`                                                                    | On a part: which value it shows.                                                   |
| `data-action`                               | state     | `approve`, `deny`, `always`                                                              | On an approval button: what it does.                                               |
| `data-decision`                             | state     | `approved`, `denied`, `always`                                                           | On the approval: the reader's decision, once made.                                 |
