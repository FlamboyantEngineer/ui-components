---
'@flamboyantengineer/ui-components': patch
---

ChatParts opens its Markdown token markers with a run of anchors longer than any in the text, so marker-like characters in a message (typed, generated or written as entities) stay text and never add or hide a token pill.
