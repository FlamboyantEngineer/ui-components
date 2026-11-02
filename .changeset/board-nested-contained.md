---
'@flamboyantengineer/ui-components': patch
---

Board: a collapsed column's cards and card content publish `data-collapsed`, so styles reach only that board's cards. The reference styles keep a board nested in a card inside it, scrolling its own columns.
