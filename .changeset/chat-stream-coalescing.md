---
'@flamboyantengineer/ui-components': patch
---

`useChatController` writes streamed events to the conversation once per animation frame, so a burst of deltas renders `Chat` once instead of once per delta. Approval requests, questions, the end of a reply, the reader's responses and `updateMessages` still write at once.
