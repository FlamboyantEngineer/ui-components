---
'@flamboyantengineer/ui-components': patch
---

A `DiagramPaletteItem` drop still reading its text adds nothing once the canvas leaves edit mode, loses `onNodeAdd` or unmounts; otherwise it adds once through the current `onNodeAdd`, at the point under the drop.
