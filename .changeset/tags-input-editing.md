---
'@flamboyantengineer/ui-components': minor
---

`TagsInput` takes `allowsEditing`: Enter or F2 on a focused tag, or a double click, edits the tag in place (`ui-tags-input__editor`, named "Edit …"). Enter accepts the trimmed draft as one change, checked against the other tags only; Escape restores the tag; leaving accepts, or restores a refused draft; an empty edit removes the tag. The group publishes `data-editing` while an editor is open.
