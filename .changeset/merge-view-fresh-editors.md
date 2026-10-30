---
'@flamboyantengineer/ui-components': patch
---

`MergeView` starts its conflict editors over when `base`, `ours` or `theirs` changes, so undo in a new merge never brings back an earlier merge's text or marks a new conflict resolved. Label, callback and locale changes keep the current work.
