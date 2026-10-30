---
'@flamboyantengineer/ui-components': patch
---

`CommentComposer` clears its draft after a submit resolves only while the draft is still the one submitted and belongs to the same key and storage adapter. Text typed during a slow submit, and the draft of another thread the composer moved to, now survive. It shares the submission rules of `MessageComposer`.
