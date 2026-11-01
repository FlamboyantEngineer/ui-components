---
'@flamboyantengineer/ui-components': patch
---

A `Modal`, `Drawer` or `CommandPalette` opened from a `LoadingRegion` or `Skeleton` is now its own loading boundary: menus and popups inside it stay usable while the content beneath loads. Closing it while that content is blocked hands focus to the region, which returns it to the opener once loading ends.
