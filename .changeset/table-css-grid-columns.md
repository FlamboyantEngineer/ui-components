---
'@flamboyantengineer/ui-components': minor
---

A static `Table` lays out its columns in CSS: the grid publishes its column tracks as the measured `--ui-table-columns` (and group header cells their `--ui-table-span`), so flexible and percentage columns follow the container's size in the same frame instead of after a resize observer. A stylesheet must now draw `.ui-table__grid` as a CSS grid on `--ui-table-columns` whose sections and rows are subgrids; the reference stylesheet shows the rules. Resizable columns in a static table get the table's own resizer, with the same pointer and keyboard gestures; virtualized tables keep React Aria's measured layout.
