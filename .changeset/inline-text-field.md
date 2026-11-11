---
'@flamboyantengineer/ui-components': minor
---

Add `InlineTextField`: a one-line field for short text edited in place, such as a caption, that is safe inside a host listening for keys itself (a rich-text editor's non-editable node view). It renders no portal, takes no focus on mount, keeps key, clipboard and drop events from the host so select all and paste stay in the field, commits on Enter and blur, and restores on Escape.
