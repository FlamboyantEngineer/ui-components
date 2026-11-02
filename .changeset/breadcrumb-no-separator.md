---
'@flamboyantengineer/ui-components': patch
---

`Breadcrumb` draws no separator when `separator` is `null` or `false`; `null` used to fall back to the chevron and `false` drew an empty icon.
