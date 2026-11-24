---
'@flamboyantengineer/ui-components': patch
---

Keep page keys with a focused document in MediaViewer and preserve focus during image retry. Reopening the viewer or returning to an image starts a fresh image attempt.

Limit PDF scroll geometry reads to an ordered lookup and the visible pages. Use one visibility observer for PDF thumbnails as their sidebar scrolls and resizes.
