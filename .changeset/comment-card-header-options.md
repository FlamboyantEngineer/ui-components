---
'@flamboyantengineer/ui-components': minor
---

Comment cards for document margins:

- `CommentThread` takes `headerActions`, a header `menu` with `onAction` (shown also while resolved or read-only), `firstInMenu` (the opening comment's menu moves into it), `resolveInMenu` (Reopen as a menu entry), `author` and `time` for a thread with no comments yet, `composerOnSelect` and `onClose`. New hooks: `ui-comment-thread__author`, `__header-actions`, `__menu` and `__close`; new provider string `moreActions`.
- `CommentComposer` takes `minRows` and `actionsOnFocus`.
