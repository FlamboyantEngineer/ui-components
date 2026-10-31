---
'@flamboyantengineer/ui-components': patch
---

`sanitizeHtml` and `HtmlMarkup` place table parts the way an HTML parser does, so server-rendered tables hydrate without recovery. A `col` outside a column group gets a `colgroup`, and a cell outside a row gets a `tbody` and a `tr`. Other elements written directly in table structure move before the table, and a `table` there closes the open one. Table parts outside any table are ignored and their content kept.
