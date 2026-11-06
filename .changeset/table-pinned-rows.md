---
'@flamboyantengineer/ui-components': minor
---

`Table` pins rows. `pinnedRows` (`{ top, bottom }` lists of row ids) draws those top-level rows first and last in the body, once each, on every page and outside filtering, sorting, paging, grouping and reordering, without their child or detail rows. They select, edit and act like any row and publish `data-pinned` (`top` or `bottom`). In a static table each publishes `--ui-table-row-offset`, measured past the sticky header or summary and the rows pinned before it, and the reference stylesheet keeps them in view while the body scrolls; a virtualized table orders them but pins nothing.
