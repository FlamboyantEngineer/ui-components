---
'@flamboyantengineer/ui-components': minor
---

`AnnotationLayer` keeps element anchors current when content inside it changes, resizes or scrolls without the layer rendering, such as a child's own state update or a nested scrolling region, so marks and hit testing follow their targets. Measurements are coalesced to one per animation frame. A new `handleRef` gives an `AnnotationLayerHandle` with `remeasure()` for changes the layer cannot observe.
