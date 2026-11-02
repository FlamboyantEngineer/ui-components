---
'@flamboyantengineer/ui-components': patch
---

FormulaBar draws no result, and keeps no room for one, while the caller's evaluation is empty. The reference stylesheet again marks only a dirty FormulaBar's content, lets a long result shrink rather than push the bar's parts out of it, and fits the bar into narrower widths.
