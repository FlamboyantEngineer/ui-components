---
'@flamboyantengineer/ui-components': patch
---

A field's `pattern` must match the whole text even when it has the multiline flag; one matching line no longer passes a multiline value. Checking leaves a `g` or `y` pattern's `lastIndex` alone.
