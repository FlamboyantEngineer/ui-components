---
'@flamboyantengineer/ui-components': patch
---

`AnnotationLayer` measures target elements, hit tests presses and places its margin in its own CSS pixels, so marks stay on their anchors and are pressed where they show when an ancestor scales the layer with a CSS transform.
