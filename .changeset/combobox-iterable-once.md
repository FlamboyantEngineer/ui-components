---
'@flamboyantengineer/ui-components': patch
---

`Combobox` reads each `items` or `defaultItems` source once and draws the list, chips and inline completion from that copy, so a generator now gives chips their option labels instead of raw ids, and an unchanged source is not traversed again on unrelated renders.
