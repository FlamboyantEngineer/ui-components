---
'@flamboyantengineer/ui-components': patch
---

Modal, Portal, Chat Transcript and Truncation Tooltip share one definition of the elements Tab reaches: a modal's first-focus search now skips elements that are not rendered, and a truncation tooltip also opens from focus on an `area`, `iframe` or media control holding the text. Persisted tab, tree, dock panel, navigation rail, model picker and composer state read storage through one JSON codec.
