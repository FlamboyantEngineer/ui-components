---
'@flamboyantengineer/ui-components': patch
---

`CommentThread` keeps its composer mounted, hidden, while the thread is resolved or read-only, so an unsent or pending reply returns when replying is possible again. Comments passed inside fragments now count one by one for `visibleReplies`, the list and the composer label.
