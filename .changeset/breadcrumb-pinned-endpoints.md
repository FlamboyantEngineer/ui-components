---
'@flamboyantengineer/ui-components': minor
---

A `Breadcrumb` with `overflow="menu"` always keeps its first and current crumbs, however narrow it is: once every middle crumb is in the menu it publishes `data-collapsed`, and the reference sheet lets the two endpoints shrink and ellipsize instead of hiding them. The current crumb is never listed in the overflow menu, so it never becomes a link.
