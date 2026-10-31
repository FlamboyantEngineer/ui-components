---
'@flamboyantengineer/ui-components': patch
---

`PivotTable`, `PermissionMatrix` and the `Timeline` table view hand `Table` the same columns and rows across renders that do not change them, so grant toggles, expansion and selection changes keep the table's memoised layout and cell grid.
