---
'@flamboyantengineer/ui-components': patch
---

`FindBar` keeps its uncontrolled matching options and replacement while the options menu or the replace controls are gone, so they come back as last reported instead of returning silently to their defaults.
