---
'@flamboyantengineer/ui-components': patch
---

StatTile keeps the sign of a delta that rounds to zero (`+0`, `-0%`), so its text still tells every reader which way the value moved; only a zero delta reads `0`.
