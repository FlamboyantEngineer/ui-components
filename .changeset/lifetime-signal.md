---
'@flamboyantengineer/ui-components': patch
---

Async work in `FolderManager`, `InlineEdit`, `DecisionControl`, the composers and `useClipboard` now settles through an abort signal scoped to each operation instead of a mounted flag, so an operation begun before a remount stays withdrawn after it.
