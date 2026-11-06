---
'@flamboyantengineer/ui-components': patch
---

`getVisibleTreeRows` and `applyTreeMove` walk the tree without recursion, so very deep loaded trees no longer overflow the call stack.
