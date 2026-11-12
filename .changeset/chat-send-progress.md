---
'@flamboyantengineer/ui-components': minor
---

`Chat` shows when the host takes time to accept what the reader did. Once a promise from `onSend`, `onSendNow`, `onReply`, `onEdit`, `onQueueChange` or `onSteer` has waited 400 ms, a polite `ui-chat__progress` line above the composer reads "Sending…", "Queuing…", "Steering…", "Saving…" or "Removing…" with the clock a message waiting for delivery shows (`progressIcon` swaps it for the spinner or the host's icon), and the pressed button shows itself busy. `onSteer` and `onQueueChange` may now return a promise; a queued message's edit ends once it is accepted, a steering message publishes `data-steering`, and refusals go to `onSendError`. The message composer's action button shows itself busy after the same delay, and stays Send while a message sent during a reply waits.

The reader can choose to steer instead of queuing during a reply (`steersWhilePending`) and to send with Ctrl+Enter only (`sendsWithModifier`), each controlled or stored through the provider's storage adapter; `showSendOptions` offers both in the composer's "+" menu. The composer's new `menuSections` adds sections to its "+" menu, adding a "+" button when the host placed none.
