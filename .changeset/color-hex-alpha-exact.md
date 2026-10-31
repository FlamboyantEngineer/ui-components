---
'@flamboyantengineer/ui-components': patch
---

`ColorField` writes a hex alpha byte exactly instead of rounding it to two decimals, so editing a colour digit no longer changes an untouched alpha.
