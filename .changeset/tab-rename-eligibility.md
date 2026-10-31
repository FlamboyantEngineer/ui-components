---
'@flamboyantengineer/ui-components': patch
---

A tab rename ends without renaming when its tab leaves, turns disabled or the list stops taking renames, and a returning tab no longer reopens it. Enter and blur recheck the tab before calling `onRename`.
