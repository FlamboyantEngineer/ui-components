---
'@flamboyantengineer/ui-components': patch
---

`AnnotationLayer` cuts measured anchors to what the scrolling or clipping elements between the target and the layer show: a partly hidden anchor draws and hits only its visible part, and a hidden one draws nothing while its card stays, not orphaned.
