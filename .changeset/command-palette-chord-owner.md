---
'@flamboyantengineer/ui-components': patch
---

One press of a CommandPalette chord opens at most one palette: the palette that registered the chord last claims it, handing it back when it unmounts. A chord pressed inside another modal overlay is left to that overlay.
