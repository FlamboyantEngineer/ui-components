---
'@flamboyantengineer/ui-components': patch
---

A NumberField with `units` reads back what it shows: the locale's own digits (such as Arabic-Indic), minus and separators, and the signs and hundredths scaling of `formatOptions` such as a percent style, so untouched values no longer turn invalid.
