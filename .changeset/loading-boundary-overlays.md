---
'@flamboyantengineer/ui-components': patch
---

`LoadingRegion` and `Skeleton` close the library's menus, field popups and popovers opened from their content when loading starts, so an overlay rendered in a portal can no longer be activated while its content is blocked. A region holds focus that was in the overlay and returns it to the overlay's trigger once loading ends.
