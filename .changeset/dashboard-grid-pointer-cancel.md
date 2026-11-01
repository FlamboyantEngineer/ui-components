---
'@flamboyantengineer/ui-components': patch
---

DashboardGrid discards a pointer move or resize that the browser cancels (`pointercancel`) instead of keeping it: the tiles go back, and nothing is reported, stored or announced.
