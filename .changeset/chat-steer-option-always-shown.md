---
'@flamboyantengineer/ui-components': patch
---

`Chat` with `showSendOptions` always offers Steer automatically in the composer's "+" menu, whether or not a reply runs and even while the host passes no `onSendNow` or `onQueueChange`; without them the reader's choice is kept and takes effect once they come.
