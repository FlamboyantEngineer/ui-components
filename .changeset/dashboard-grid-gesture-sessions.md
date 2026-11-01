---
'@flamboyantengineer/ui-components': patch
---

DashboardGrid ends a pointer move or resize for good when its layout change cancels it, when the layout's owner changes (another `persistKey`, or a controlled layout given or taken away), or when its handle unmounts: the same pointer never revives it, and it never writes to another stored layout.
