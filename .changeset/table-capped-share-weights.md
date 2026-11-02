---
'@flamboyantengineer/ui-components': patch
---

A static `Table`'s flexible columns keep their `fr` weights when they have a `maxWidth`: a cap they have not reached no longer evens out their widths, and a reached cap leaves its room to the other shares by weight, as in a virtualized table.
