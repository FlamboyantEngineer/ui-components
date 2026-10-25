---
'@flamboyantengineer/ui-components': minor
---

Add `Chat`, a whole conversation from the host's messages and callbacks, from its own entry point `@flamboyantengineer/ui-components/chat` (it composes the rich composer, so the package root stays free of ProseMirror).

- Serves assistant chats and chats between people from `messages`, `participants` and `currentUserId`; spread a `useChatController`'s `props` into it, or pass your own state.
- Messages: authors with presence (an assistant's avatar rounded), delivery, errors with `onRetry`, edits and deletions, date separators, grouping, the unread divider (`firstUnreadId`, `onRead`), read receipts (`readPositions`), older history (`onLoadOlder`, `hasOlder`, `isLoadingOlder`), virtualization (`virtualized`), and each message's parts through `ChatParts` with every part callback, `toolRenderers`, `onApplyCode` and `renderPart`; the reader's open and closed parts survive remounts.
- Commands, each only when its callback is given: Copy (`onCopy`), ratings with reasons (`onFeedback`, `feedbackReasons`), and between people Reply (`onReply`, with a quote banner and jump to the quoted message), React (`onReact`), Edit (`onEdit`, also Up in the empty composer) and Delete (`onDelete`) on the reader's own messages.
- The composer: mentions of the participants, `commands`, a per-conversation draft (`conversationId`), Up to recall `history` in assistant chats, attachments (`attachments`, `onAttach`, `onRemoveAttachment`, `onRetryAttachment`), Stop (`isPending`, `onStop`), `isDisabled`, and the queue of follow-ups (`queue`, `onQueueChange`) above it, editable and removable, sending while a reply runs.
- Who is typing (`typingIds`) or the assistant thinking, and the reply's status line, below the transcript; `scrollMode` defaults to `anchor` in assistant chats.
- Optional header (`title`, `headerActions`) with the participants and their presence, and search within the conversation (`showSearch`) that searches the data, so a virtualized history is searched whole, and highlights the match. `ChatHeader` is also exported.
- Hooks: `ui-chat` with `__search-toggle`, `__search`, `__transcript`, `__typing`, `__status`, `__queue`, `__queue-label`, `__queue-list`, `__queue-item`, `__queue-text`, `__queue-edit`, `__queue-remove`, `__composer`, `__banner`, `__banner-label`, `__banner-cancel` and `data-editing`; `ui-chat-header` with `__avatar`, `__text`, `__title`, `__status` and `__actions`.
- New strings: `chatSearch`, `chatReplyingTo`, `chatCancelReply`, `chatEditingMessage`, `chatEditingQueued`, `chatQueuedMessages`, `chatEditQueued`, `chatRemoveQueued`.
- `MessageComposer` and `RichMessageComposer` gain `allowsPendingSubmit`: they send while a reply is pending, the button being Send while there is something to send and Stop otherwise.
- `ChatMessageActions` and `ChatMessageActionsMenu` gain `onCopy`, called once Copy has put the text on the clipboard.
- `ChatTranscript` no longer moves focus to a highlighted message while the reader types in a field outside it, such as a find box.
