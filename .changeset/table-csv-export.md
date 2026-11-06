---
'@flamboyantengineer/ui-components': minor
---

`Table` exports CSV. `csvExport` draws an export menu that writes the current page, every row the table presents (filtered and in its order) or the selected rows, as the drawn columns or the ids `csvExport.columns` names, and downloads the file as UTF-8 with a byte order mark, or hands it to `onExport`. Caller-paged and load-more tables read "Loaded rows" unless `allRows` gives the whole dataset. A column's `getExportText` replaces its value's text, and rendered content is never read. `formatTableCsv` and `formatCsv` serialize rows on their own, quoting by RFC 4180 and prefixing formula-like text with an apostrophe unless `escapeFormulas` is false.
