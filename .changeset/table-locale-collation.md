---
'@flamboyantengineer/ui-components': minor
---

Table sorting, row groups and set filter values now collate text in the provider locale and reorder when it changes, so Swedish orders `Å`, `Ä` and `Ö` after `Z`. `sortTableRows(rows, { columns, sort, locale })` takes its columns, sort and a required locale in one object, `pivot(records, layout, locale)` takes a required locale, and Pivot Table orders its keys in the provider locale.
