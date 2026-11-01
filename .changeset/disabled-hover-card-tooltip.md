---
'@flamboyantengineer/ui-components': patch
---

A disabled `HoverCardTrigger` or `Tooltip` draws its panel closed even while a controlled owner keeps `isOpen` true, and asks once to close an open panel through `onOpenChange(false)`, so an uncontrolled panel stays closed when enabled again.
