---
'@flamboyantengineer/ui-components': patch
---

`DashboardGrid` places a pointer move or resize again on the current `layout` when the host changes it mid-gesture, so tiles added, removed or moved meanwhile are no longer overwritten by the stale preview. A gesture whose own tile was removed or moved meanwhile is cancelled and reports nothing.
