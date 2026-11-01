---
'@flamboyantengineer/ui-components': patch
---

A `Chat` reply whose message is removed from `messages` or deleted now ends at once: the composer keeps its text and sends it through `onSend` instead of replying to a message the reader can no longer see, and the message coming back does not bring the reply back.
