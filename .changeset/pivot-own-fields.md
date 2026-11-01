---
'@flamboyantengineer/ui-components': patch
---

`pivot` and PivotTable read only a record's own fields, so a missing field named like an `Object.prototype` member (`constructor`, `toString`) is empty instead of the inherited function.
