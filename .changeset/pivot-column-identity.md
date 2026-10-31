---
'@flamboyantengineer/ui-components': minor
---

PivotTable value columns are known by their column key and value, so a sort, focus or width stays on the same column when records, the locale or the values move. `PivotValue` gains an optional `id` to tell apart values that share a field, aggregation and label. A Table drops a sort it owns on a column that leaves `columns`.
