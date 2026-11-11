---
'@flamboyantengineer/ui-components': minor
---

Add `presentation: 'cards' | 'icons'` to `AnnotationMargin`. In the icons presentation each annotation is a marker level with its anchor (markers on one line stack), and activating it opens that annotation's card below it; several cards may be open at once, through `openKeys`, `defaultOpenKeys` and `onOpenChange`. `renderMarker` draws a marker's content, and the new provider string `annotationMarker` names it. The margin now publishes `data-presentation`, and `data-empty` while it has no annotations.
