---
'@flamboyantengineer/ui-components': minor
---

`LineChart` points take `y: null` for a missing value, which breaks the line and area, draws no point, is skipped by the arrow keys, leaves a blank table cell and never counts as zero. The new `connectsMissing` prop draws straight across missing values instead.
