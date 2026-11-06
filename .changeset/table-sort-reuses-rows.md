---
'@flamboyantengineer/ui-components': patch
---

`Table` sorts again without rebuilding or filtering its rows again: building nested rows, filtering and sorting are each kept on their own inputs, so a header press on a large table no longer calls `getChildRows` or reads the filtered values again, and a new filter no longer rebuilds the nested rows.
