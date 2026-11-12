---
'@flamboyantengineer/ui-components': minor
---

Chat offers Steer on each queued message through the new `onSteer(id)` prop, and `useChatController` adds `steer(id)` and `props.onSteer`, which stop the running reply and send that queued message at once, ahead of the rest of the queue. Removing the queued message the composer edits now ends the edit at once, so the "Editing a queued message" banner no longer stays while the host applies the new queue.
