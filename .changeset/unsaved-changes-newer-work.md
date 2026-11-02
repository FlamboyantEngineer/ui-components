---
'@flamboyantengineer/ui-components': patch
---

`UnsavedChangesGuard` no longer approves leaving when an editor gets newer work while its own Save or Discard runs: after the actions finish and the editors' updates render, it leaves only when nothing the action covers is still dirty, and otherwise keeps the question open for the reader to choose again.
