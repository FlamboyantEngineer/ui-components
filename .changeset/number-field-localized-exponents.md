---
'@flamboyantengineer/ui-components': patch
---

A `NumberField` with `units` reads back scientific and engineering notation in locales whose exponent separator is not `E`, such as Arabic `أس` and Swedish `×10^`, so a formatted value is no longer reported unreadable.
