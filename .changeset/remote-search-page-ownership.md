---
'@flamboyantengineer/ui-components': patch
---

`Combobox` with `loadItems` and `SelectField` with `loadOptions` now tie each page cursor to the search that returned it. A search that replaces another no longer reuses the old cursor after it fails. A failed search no longer shows the previous query's results. A page from a replaced search that arrives late is dropped, so it no longer takes the place of the current search's next page.
