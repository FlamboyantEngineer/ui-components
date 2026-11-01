---
'@flamboyantengineer/ui-components': minor
---

`ChatTranscript` gains `conversationId`: a new one starts the transcript over (its place, paging, read state, measurements and timers), even when the new messages reuse ids, separators or dates. `Chat` passes its own `conversationId`, so another conversation asks for its older messages and reports what is read on its own. A transcript that infers a new conversation also clears its older-history request and pending reports.
