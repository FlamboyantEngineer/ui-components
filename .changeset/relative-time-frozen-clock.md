---
'@flamboyantengineer/ui-components': patch
---

RelativeTime no longer wakes every millisecond for a fixed `getNow` stopped at a boundary where its words would change: a wake that finds the clock unmoved waits for the next render instead.
