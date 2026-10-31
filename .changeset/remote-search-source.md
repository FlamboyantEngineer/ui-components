---
'@flamboyantengineer/ui-components': patch
---

`SelectField` and `Combobox` tie a search's pages to the loader that returned them: a new `loadOptions` or `loadItems` function ends the running search and the next page of the shown results, and `SelectField` searches the latest query again from the new loader's first page, so an old cursor never reaches another loader.
