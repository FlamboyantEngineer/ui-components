---
'@flamboyantengineer/ui-components': patch
---

`UnsavedChangesGuard` shows each `confirmLeave` question in a dialog of its own: a Save or Discard still running for a question that a newer one replaced no longer closes, marks pending or fails the newer question, which stays open until the reader answers it.
