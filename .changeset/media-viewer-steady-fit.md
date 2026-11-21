---
'@flamboyantengineer/ui-components': patch
---

Media Viewer: an image no longer flickers between two sizes when its scrollbars come and go. The fit now uses the viewport's room as it is with no scrollbar showing, through the new `useElementSize` box `scrollbar-free`, rather than the rounded client box that a scrollbar shrinks.
