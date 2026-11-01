---
'@flamboyantengineer/ui-components': patch
---

DiagramCanvas discards a node move preview or an unfinished pointer connection when the node or port that owns the drag leaves the canvas, such as when the host removes it or the outline view is shown, instead of leaving nodes displaced and the canvas connecting.
