---
'@flamboyantengineer/ui-components': patch
---

`DiagramCanvas` shows, moves and removes only the selection its current `selectionMode` allows (none, one, or every existing item), so a selection kept from multiple mode no longer widens a single-node move or deletion.
