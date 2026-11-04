---
'@flamboyantengineer/ui-components': patch
---

A `NumberField` with `units` or a nondecimal `radix` keeps a value more precise than its display (1.23456 shown as `1.235`) when focus leaves or Enter is pressed without an edit, instead of committing the rounded text.
