---
'@flamboyantengineer/ui-components': patch
---

`CommandPalette` hands focus back as soon as it closes, while its exit animation is still playing, and the leaving overlay is `inert`. The reference stylesheet fades the palette out over 500ms (none under reduced motion), and the lab's two-second demo fade is gone.
