---
'@flamboyantengineer/ui-components': patch
---

`Chat` ends the edit of a queued message once that message leaves the queue, or of the reader's message once it is deleted: the banner goes, and the composer sends its text through `onSend` instead of dropping it into an unchanged `onQueueChange`.
