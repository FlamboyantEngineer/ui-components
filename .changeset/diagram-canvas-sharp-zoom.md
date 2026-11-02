---
'@flamboyantengineer/ui-components': patch
---

DiagramCanvas's reference sheet no longer sets `will-change: transform` on the content layer, so zoomed nodes, labels and edges are redrawn as vectors at the displayed zoom instead of magnifying an earlier raster.
