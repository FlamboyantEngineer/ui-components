---
'@flamboyantengineer/ui-components': patch
---

`Menubar` keeps a caller's `ref` attached across renders, and the comparison views' owner-scoped state keeps one setter while the comparison stays the same.
