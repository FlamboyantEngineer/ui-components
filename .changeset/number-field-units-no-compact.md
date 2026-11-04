---
'@flamboyantengineer/ui-components': patch
---

A `NumberField` with `units` writes and reads its numbers in standard notation when `formatOptions` asks for compact notation, so typed text such as `12K` is reported as unreadable instead of committing 12.
