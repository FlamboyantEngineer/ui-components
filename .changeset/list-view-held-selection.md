---
'@flamboyantengineer/ui-components': patch
---

`ListView` keeps an uncontrolled selection, and the row that held focus, when `reorder` or `virtualized` turns on or off, instead of starting again from `defaultSelectedKeys`.
