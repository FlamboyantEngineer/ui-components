---
'@flamboyantengineer/ui-components': patch
---

CardGrid keeps an uncontrolled selection, and the focused card, when `layout` or `virtualized` changes, instead of starting again from `defaultSelectedKeys`. Switching a virtual grid straight to a waterfall no longer fails either.
