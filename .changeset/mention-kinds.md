---
'@flamboyantengineer/ui-components': minor
---

Mentions name more than people: `MentionCandidate` takes `kind` (`person`, `group`, `assistant` or a host kind) and a group's `count`, which the suggestion list shows through the new `mentionGroupCount` string. `serializeMention` writes other kinds as `@kind[Name](id)`, `parseMentions` reads them into `mentionKind` and leaves tokens inside code spans or after a backslash as text, and `CommentText` chips publish `data-kind` and pass the kind to `renderCard`.
