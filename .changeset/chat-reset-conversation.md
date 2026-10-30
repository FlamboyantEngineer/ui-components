---
'@flamboyantengineer/ui-components': minor
---

`useChatController` replaces `setMessages` with two operations: `updateMessages(update)` edits the conversation as it stands while the reply, queue and uploads carry on, and `resetConversation(messages)` replaces it atomically, abandoning the running reply (its signal aborts, its waiters reject, its late events are ignored), clearing the queue so nothing queued is sent into the new conversation, aborting uploads and clearing the retry record. Migrate `setMessages(update)` to `updateMessages(update)` and `setMessages(messages)` to `resetConversation(messages)`.
