---
'@flamboyantengineer/ui-components': patch
---

A field with `autoFocus` inside a `Drawer` now takes focus only once the panel has slid in, without scrolling. A retained `Modal` (`keepMounted`) keeps focus in the leaving dialog through its exit and returns it when the exit ends, instead of dropping it on the page body.
