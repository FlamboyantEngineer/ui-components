---
'@flamboyantengineer/ui-components': minor
---

A virtualized `Table` can measure its rows: `rowHeight="auto"` gives wrapped cells and opened detail rows their natural height, with `estimatedRowHeight` as the height of a row until it is drawn and of the header rows. Rows are measured again after content changes and column resizes, and the root publishes `data-measured-rows`. A fixed `rowHeight` stays the default.
