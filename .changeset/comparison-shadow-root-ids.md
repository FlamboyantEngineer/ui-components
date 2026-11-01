---
'@flamboyantengineer/ui-components': minor
---

`MergeView`, `TextDiff`, `RedlineCompare` and `AnnotationLayer` look their own ids up in the shadow root that holds them, so navigation focus, folded-line focus, moved-block jumps and annotation targets work inside web components and never reach an element of the same id outside the component. New `enableShadowRoots()` turns on React Aria's shadow DOM support for hosts that render the library inside shadow roots, without which presses on its buttons there do not register.
