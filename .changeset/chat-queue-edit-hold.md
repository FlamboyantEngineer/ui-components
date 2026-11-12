---
'@flamboyantengineer/ui-components': minor
---

Chat tells the host which queued message the reader edits through the new `onQueuedEditChange(id)` prop, with `undefined` when the edit ends. `useChatController` takes it as `props.onQueuedEditChange`: it holds that message back, so it neither goes out from the queue nor steers until the edit is saved or cancelled, and then sends the saved text. Steer works on any queued message, whatever its position.
