---
'@flamboyantengineer/ui-components': patch
---

A pending `Button` refuses activation through a `MenuTrigger` or `PopoverTrigger` and its own press lifecycle callbacks from the moment it is busy, including while `pendingDelay` holds the pending indicator back, and keeps its focus, hover and tooltip.
