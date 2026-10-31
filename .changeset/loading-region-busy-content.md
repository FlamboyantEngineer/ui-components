---
'@flamboyantengineer/ui-components': patch
---

`LoadingRegion` marks only its content busy, not its root, so the loading card's status is announced during the wait instead of being held back by a busy ancestor.
