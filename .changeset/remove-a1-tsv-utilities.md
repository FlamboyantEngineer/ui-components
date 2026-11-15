---
'@flamboyantengineer/ui-components': minor
---

Removed `formatCellReference`, `parseCellReference`, `CellCoordinates`, `formatTsv` and `parseTsv`. Nothing in the library used them; A1 references and tab-separated text are spreadsheet syntax, which the spreadsheet editor owns.
