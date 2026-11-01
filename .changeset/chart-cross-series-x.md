---
'@flamboyantengineer/ui-components': patch
---

`LineChart` moves focus between series to the point nearest in x (a number or a time) rather than the point at the same position, so unevenly sampled series and series over different ranges line up.
