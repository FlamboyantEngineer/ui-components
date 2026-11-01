---
'@flamboyantengineer/ui-components': minor
---

`CommentThreadReply` waits for `onEdit` and `onDelete`: either may return a promise, which keeps the editor or the delete confirmation open and pending until it settles, closing once it succeeds and staying open with the failure when it fails. `CommentEditorOptions.onSubmit` returns that outcome, so a caller editor keeps its text on failure. An open editor or confirmation now ends when its `onEdit` or `onDelete` is withdrawn or the thread turns read-only, and does not come back with the permission. New hook: `ui-comment-thread-reply__error`.
