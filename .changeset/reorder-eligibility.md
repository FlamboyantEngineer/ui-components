---
'@flamboyantengineer/ui-components': patch
---

Table, ListView and TransferList move only the dragged rows that may move when the drop lands: rows gone, disabled or refused by `canMove` stay where they are, also when they were selected or dragged before they changed.
