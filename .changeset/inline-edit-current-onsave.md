---
'@flamboyantengineer/ui-components': patch
---

A save InlineEdit queued behind a running one calls the `onSave` current when it starts, not the one of the render that started the first save.
