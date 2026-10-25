---
'@flamboyantengineer/ui-components': minor
---

Chat components for assistant conversations and conversations between people.

- `Chat` (from `@flamboyantengineer/ui-components/chat`) composes a whole conversation from the host's messages, participants and callbacks: grouped messages with parts, delivery, edits, deletions, reactions, read receipts, unread and older history; Copy, ratings, Reply, React, Edit and Delete; typing and status lines; a queue of follow-ups; header search; and a rich composer with mentions, commands, attachments, drafts and Stop. `ChatHeader` shows the participants, their presence, the title and a status line.
- `useChatController` turns a host's `send` function, an async iterable of `ChatStreamEvent`s, into a chat's state and props: streaming, Stop, Retry, a send queue, approvals and questions awaited mid-stream, Always allow, recall history and uploads with progress. `reduceChatStream` and `isAwaitingReader` expose its model.
- `ChatParts` renders a message's typed parts (text as Markdown or plain with mention and command pills, reasoning, tool calls, questions, plans, sources, attachments, code and diffs) and folds reasoning and tool calls into step groups, with `toolRenderers`, `renderPart` and kept expansion state.
- `ChatTranscript` is a keyboard-navigable feed with batched announcements, follow and anchor scrolling, older history, highlighting, an unread bar, read tracking and virtualization. `ChatMessage` shows its author with presence, grouping, delivery, errors with Retry, quotes, edits, deletions, reactions and readers; `ChatQuote`, `ChatDateSeparator`, `ChatUnreadDivider`, `ChatTypingIndicator`, `ChatReadReceipts` and `groupChatMessages` complete it.
- `MessageComposer` offers a banner, attachments by button, drop and paste, an emoji picker, edit mode, recall, a persisted draft and sending while a reply is pending. `RichMessageComposer` (from `@flamboyantengineer/ui-components/message-composer/rich`) adds mention and command pills, typed Markdown and code blocks, and sends `{ text, tokens }`.
- `ChatToolCall` shows a tool call's status, arguments and result in a collapsible card, with Approve, Deny with a reason and Always allow.
- `ChatQuestion` asks one or several questions answered by choice, with recommendations, previews and Other, or in free text, collapsing to a summary.
- `ChatReasoning`, `ChatSteps`, `ChatPlan` and `ChatStatusLine` show an assistant's reasoning, grouped steps, plan and current activity, announcing plan and status changes politely.
- `ChatAttachment` and `ChatAttachmentList` show thumbnails that open the media viewer, file chips, upload progress, errors with Retry, downloads and removal that keeps focus in the list.
- `ChatSources` and `ChatCitation` list an answer's sources and preview them from inline numbered citations; `createCitationOverride` adds citations to Markdown.
- `ChatMessageActions` and `ChatMessageActionsMenu` offer a message's commands as a toolbar and a context menu sharing one state, with feedback details, an emoji picker and a delete confirmation.
- `ChatList` lists conversations with search, New chat, selection, presence, unread counts, muted state, host actions, loading and empty states.
- `CodeBlock` shows code with its language, Copy, an optional Apply action, highlighting and a terminal variant; `createCodeBlockOverride` draws Markdown code blocks with it.
- `Markdown` renders streaming sources with `isStreaming`, completing unfinished syntax and re-rendering only the blocks that changed.
- Styling hooks, provider strings, glyphs, labs and reference stylesheets for each of them.
