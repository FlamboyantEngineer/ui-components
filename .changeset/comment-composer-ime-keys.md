---
'@flamboyantengineer/ui-components': patch
---

`CommentComposer` leaves Ctrl+Enter, Command+Enter and Escape to the input method while a composition owns them, so confirming or cancelling a composition no longer submits or clears the comment.
